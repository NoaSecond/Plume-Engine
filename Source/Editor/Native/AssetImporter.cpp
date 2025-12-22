#include "AssetImporter.h"
#include "EditorUtils.h"
#include "../ThirdParty/ufbx/ufbx.h"
#include <fstream>
#include <iostream>
#include <algorithm>
#include <cctype>

namespace Plume {

bool AssetImporter::ImportAsset(const fs::path& sourcePath, const fs::path& targetDir) {
    std::string ext = sourcePath.extension().string();
    std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c){ return std::tolower(c); });

    if (ext == ".fbx" || ext == ".obj") {
        return ImportModel(sourcePath, targetDir);
    }
    
    // Fallback for other types handled by EditorUtils directly or strictly unsupported here
    // But EditorUtils::ProcessImportFile delegates to us for models.
    return false;
}

void AssetImporter::CreateAssetFile(const fs::path& path, const std::string& type, const json& meta, const char* data, size_t size) {
    std::ofstream ofs(path, std::ios::binary);
    if (ofs.is_open()) {
        ofs.write("PLAS", 4);
        uint32_t v = 1; ofs.write((char*)&v, 4);
        
        json fullMeta = meta;
        fullMeta["type"] = type;
        
        std::string ms = fullMeta.dump();
        uint32_t ml = (uint32_t)ms.size();
        ofs.write((char*)&ml, 4);
        ofs.write(ms.data(), ml);
        if (data && size > 0) {
            ofs.write(data, size);
        }
        ofs.close();
    }
}

bool AssetImporter::ImportModel(const fs::path& sourcePath, const fs::path& targetDir) {
    ufbx_load_opts opts = { 0 };
    opts.target_axes = ufbx_axes_right_handed_y_up; // Standard for OpenGL/Vulkan usually, adjust if needed for Plume
    opts.target_unit_meters = 1.0f;
    opts.generate_missing_normals = true;

    ufbx_error error;
    ufbx_scene* scene = ufbx_load_file(sourcePath.string().c_str(), &opts, &error);

    if (!scene) {
        // Log error?
        return false;
    }

    std::string filename = sourcePath.stem().string();
    std::string safeName = EditorUtils::sanitize_filename(filename);

    // 1. Process Meshes
    // We will separate meshes into Static and Skeletal
    // Simple heuristic: if a mesh is attached to a skin/bone, it is skeletal.
    
    for (size_t i = 0; i < scene->nodes.count; i++) {
        ufbx_node* node = scene->nodes.data[i];
        if (node->mesh) {
            std::string nodeName = node->name.length > 0 ? std::string(node->name.data, node->name.length) : safeName;
            nodeName = EditorUtils::sanitize_filename(nodeName);

            // Check for collision prefixes
            bool isCollision = false;
            if (nodeName.rfind("UCX_", 0) == 0 || nodeName.rfind("UBX_", 0) == 0 || nodeName.rfind("USP_", 0) == 0) {
                isCollision = true; // Handle collision later or attach to main mesh
                continue; // Skip creating separate asset for collision meshes for now, normally they are bundled data
            }

            bool isSkeletal = node->mesh->skin_deformers.count > 0;
            
            json meta;
            meta["original_file"] = sourcePath.string();
            meta["node_name"] = nodeName;

            std::string assetName;
            std::string type;

            if (isSkeletal) {
                assetName = "SKM_" + nodeName + ".plumeasset";
                type = "SkeletalMesh";
                
                // TODO: Extract Skeleton and PhysicsAsset
                std::string skeletonName = "SKEL_" + nodeName + ".plumeasset";
                CreateAssetFile(targetDir / skeletonName, "Skeleton", {{"source_mesh", assetName}});
                
                std::string physName = "PHYS_" + nodeName + ".plumeasset";
                CreateAssetFile(targetDir / physName, "PhysicsAsset", {{"source_mesh", assetName}});

                meta["skeleton"] = skeletonName;
                meta["physics_asset"] = physName;
            } else {
                assetName = "SM_" + nodeName + ".plumeasset";
                type = "StaticMesh";
            }

            // In a real importer, we would serialize the mesh data (vertices, indices) here into the binary payload
            // For now, we save metadata. The runtime loader will likely need to use ufbx to load the actual data 
            // OR we serialize it to our own binary format here. 
            // Given "Primitive" asset structure in EditorUtils, let's assume we maintain the source ref or serialize simple data.
            // For this task, we "explode" the assets, meaning we create the files.
            
            CreateAssetFile(targetDir / assetName, type, meta);
        }
    }

    // 2. Process Animations
    for (size_t i = 0; i < scene->anim_stacks.count; i++) {
        ufbx_anim_stack* stack = scene->anim_stacks.data[i];
        std::string animName = stack->name.length > 0 ? std::string(stack->name.data, stack->name.length) : "Anim";
        animName = EditorUtils::sanitize_filename(animName);
        
        std::string assetName = "ANIM_" + safeName + "_" + animName + ".plumeasset";
        CreateAssetFile(targetDir / assetName, "AnimationSequence", {{"source", sourcePath.string()}});
    }

    // 3. Process Materials
    for (size_t i = 0; i < scene->materials.count; i++) {
        ufbx_material* mat = scene->materials.data[i];
        std::string matName = mat->name.length > 0 ? std::string(mat->name.data, mat->name.length) : "Mat";
        matName = EditorUtils::sanitize_filename(matName);

        std::string assetName = "MAT_" + matName + ".plumeasset";
        
        // Build Graph
        json nodes = json::array();
        json edges = json::array();

        // 1. Result Node
        json resultNode;
        resultNode["id"] = "1";
        resultNode["type"] = "result";
        resultNode["data"] = { {"label", "Result Node"} };
        resultNode["position"] = { {"x", 600}, {"y", 100} };
        nodes.push_back(resultNode);

        int nodeIdCounter = 2;
        int yOffset = 0;

        std::cout << "[Import] Processing Material: " << matName << std::endl;

        // Helper to convert ufbx color to hex string
        auto toHex = [](ufbx_vec3 c) {
             int r = (int)(c.x * 255.0f);
             int g = (int)(c.y * 255.0f);
             int b = (int)(c.z * 255.0f);
             if (r < 0) r = 0; if (r > 255) r = 255;
             if (g < 0) g = 0; if (g > 255) g = 255;
             if (b < 0) b = 0; if (b > 255) b = 255;
             char buf[16];
             snprintf(buf, 16, "#%02x%02x%02x", r, g, b);
             return std::string(buf);
        };

        auto processMap = [&](const ufbx_material_map& map, const std::string& slotName) {
            // Priority 1: Texture
            if (map.texture) {
                std::string texPathStr;
                if (map.texture->filename.data && map.texture->filename.length > 0) {
                     texPathStr.assign(map.texture->filename.data, map.texture->filename.length);
                } else if (map.texture->relative_filename.data && map.texture->relative_filename.length > 0) {
                     texPathStr.assign(map.texture->relative_filename.data, map.texture->relative_filename.length);
                }
                
                std::string texName = "Texture";
                std::string texAssetName = "";
                
                if (!texPathStr.empty()) {
                    fs::path texPath = fs::path(texPathStr);
                    // Resolve path logic
                    if (texPath.is_relative()) {
                         texPath = sourcePath.parent_path() / texPath;
                    }
                    
                    // Fallback search
                    if (!fs::exists(texPath)) {
                        fs::path filename = texPath.filename();
                        fs::path adjacent = sourcePath.parent_path() / filename;
                        if (fs::exists(adjacent)) texPath = adjacent;
                        else {
                            fs::path subdir = sourcePath.parent_path() / "Textures" / filename;
                            if (fs::exists(subdir)) texPath = subdir;
                        }
                    }

                    texName = texPath.stem().string();
                    texName = EditorUtils::sanitize_filename(texName);
                    
                    if (fs::exists(texPath)) {
                         texAssetName = "TEX_" + texName + ".plumeasset";
                         EditorUtils::ProcessImportFile(texPath, targetDir); 
                    } else {
                         // Texture not found, still define asset name to what it SHOULD be
                         texAssetName = "TEX_" + texName + ".plumeasset"; 
                         std::cout << "[Warn] Texture file missing for " << slotName << ": " << texPathStr << std::endl;
                    }
                }

                // ALWAYS Create Texture Node
                std::string nodeId = std::to_string(nodeIdCounter++);
                json texNode = json::object();
                texNode["id"] = nodeId;
                texNode["type"] = "texture";
                json dataObj = json::object();
                dataObj["label"] = texName;
                dataObj["assetId"] = texAssetName; // Valid or placeholder
                texNode["data"] = dataObj;
                json posObj = json::object();
                posObj["x"] = 100;
                posObj["y"] = 100 + yOffset;
                texNode["position"] = posObj;
                nodes.push_back(texNode);

                // Edge
                json edge = json::object();
                edge["id"] = "e" + nodeId + "-1";
                edge["source"] = nodeId;
                edge["target"] = "1";
                edge["targetHandle"] = slotName;
                edges.push_back(edge);

                yOffset += 150;
                return; // Done for this slot
            }

            // Priority 2: PBR Constant Value (Color only for now)
            if (map.has_value) {
                // If this slot expects a color (base color, emission), create a Color Node
                if (slotName == "base-color" || slotName == "emissive") {
                    std::string hex = toHex(map.value_vec3); // map.value_vec3 is valid union member
                    
                    std::string nodeId = std::to_string(nodeIdCounter++);
                    json colNode = json::object();
                    colNode["id"] = nodeId;
                    colNode["type"] = "color";
                    
                    json dataObj = json::object();
                    dataObj["label"] = "Color";
                    dataObj["color"] = hex;
                    colNode["data"] = dataObj;
                    
                    json posObj = json::object();
                    posObj["x"] = 100;
                    posObj["y"] = 100 + yOffset;
                    colNode["position"] = posObj;
                    nodes.push_back(colNode);

                    json edge = json::object();
                    edge["id"] = "e" + nodeId + "-1";
                    edge["source"] = nodeId;
                    edge["target"] = "1";
                    edge["targetHandle"] = slotName;
                    edges.push_back(edge);

                    yOffset += 150;
                }
                // For scalar values like roughness, we skip node creation and let the Result Node defaults handle it
                // Or we could create a Float node if one existed.
            }
        };

        processMap(mat->pbr.base_color, "base-color");
        processMap(mat->pbr.normal_map, "normal");
        processMap(mat->pbr.roughness, "roughness");
        processMap(mat->pbr.metalness, "metallic");
        processMap(mat->pbr.emission_color, "emissive");
        
        json matContent;
        matContent["nodes"] = nodes;
        matContent["edges"] = edges;
        
        // Write Material Asset with GRAPH content
        // Important: content field for save-asset is stringified JSON
        std::string contentStr = matContent.dump();
        
        // We use a custom writer here to match SaveAssetCommand structure
        // But CreateAssetFile is simple metadata writer. 
        // We need to write the CONTENT blob.
        
        std::ofstream ofs(targetDir / assetName, std::ios::binary);
        if (ofs.is_open()) {
            ofs.write("PLAS", 4);
            uint32_t v = 1; ofs.write((char*)&v, 4);
            
            json fullMeta;
            fullMeta["type"] = "Material";
            
            std::string ms = fullMeta.dump();
            uint32_t ml = (uint32_t)ms.size();
            ofs.write((char*)&ml, 4);
            ofs.write(ms.data(), ml);
            ofs.write(contentStr.data(), contentStr.size());
            ofs.close();
        }
    }

    ufbx_free_scene(scene);
    return true;
}

}
