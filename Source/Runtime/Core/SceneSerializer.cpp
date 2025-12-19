#include "SceneSerializer.h"
#include "Scene.h"
#include "nlohmann_json.hpp"
#include <fstream>
#include <iostream>
#include <sstream>

namespace Plume {

    SceneSerializer::SceneSerializer(Scene* scene)
        : m_Scene(scene) {}

    SceneSerializer::~SceneSerializer() {}

    void SceneSerializer::Serialize(const std::string& filePath) {
        std::string json = SerializeToString();
        std::ofstream out(filePath);
        if (out.is_open()) {
            out << json;
            out.close();
        }
    }

    std::string SceneSerializer::SerializeToString() {
        if (!m_Scene) return "[]";

        nlohmann::json j = nlohmann::json::array();
        for (const auto& e : m_Scene->m_Registry) {
            nlohmann::json entityJson;
            entityJson["id"] = e.Tag.ID;
            entityJson["name"] = e.Tag.Name;
            
            std::string typeStr = "Mesh";
            if (e.Type.Type == EntityType::Light) typeStr = "Light";
            else if (e.Type.Type == EntityType::Camera) typeStr = "Camera";
            else if (e.Type.Type == EntityType::Folder) typeStr = "Folder";
            entityJson["type"] = typeStr;
            
            entityJson["subType"] = e.Type.SubType;
            entityJson["visible"] = e.Visible;
            
            nlohmann::json transform;
            transform["position"] = { {"x", e.Transform.Position.x}, {"y", e.Transform.Position.y}, {"z", e.Transform.Position.z} };
            transform["rotation"] = { {"x", e.Transform.Rotation.x}, {"y", e.Transform.Rotation.y}, {"z", e.Transform.Rotation.z} };
            transform["scale"] = { {"x", e.Transform.Scale.x}, {"y", e.Transform.Scale.y}, {"z", e.Transform.Scale.z} };
            
            entityJson["transform"] = transform;
            j.push_back(entityJson);
        }
        return j.dump(4);
    }

    bool SceneSerializer::Deserialize(const std::string& filePath) {
        std::ifstream in(filePath);
        if (!in.is_open()) return false;
        
        std::stringstream ss;
        ss << in.rdbuf();
        return DeserializeFromString(ss.str());
    }

    bool SceneSerializer::DeserializeFromString(const std::string& jsonString) {
        if (!m_Scene) return false;

        m_Scene->Clear();
        try {
            auto j = nlohmann::json::parse(jsonString);
            if (!j.is_array()) return false;
            
            for (const auto& item : j) {
                Scene::EntityData data;
                data.Tag.ID = item.value("id", ""); // Should ideally generate if empty
                data.Tag.Name = item.value("name", "Entity");
                
                std::string typeStr = item.value("type", "Mesh");
                if (typeStr == "Light") data.Type.Type = EntityType::Light;
                else if (typeStr == "Camera") data.Type.Type = EntityType::Camera;
                else if (typeStr == "Folder") data.Type.Type = EntityType::Folder;
                else data.Type.Type = EntityType::Mesh;
                
                data.Type.SubType = item.value("subType", "");
                data.Visible = item.value("visible", true);
                
                if (item.contains("transform")) {
                    auto& t = item["transform"];
                    if (t.contains("position")) {
                        data.Transform.Position.x = t["position"].value("x", 0.0f);
                        data.Transform.Position.y = t["position"].value("y", 0.0f);
                        data.Transform.Position.z = t["position"].value("z", 0.0f);
                    }
                    if (t.contains("rotation")) {
                        data.Transform.Rotation.x = t["rotation"].value("x", 0.0f);
                        data.Transform.Rotation.y = t["rotation"].value("y", 0.0f);
                        data.Transform.Rotation.z = t["rotation"].value("z", 0.0f);
                    }
                    if (t.contains("scale")) {
                        data.Transform.Scale.x = t["scale"].value("x", 1.0f);
                        data.Transform.Scale.y = t["scale"].value("y", 1.0f);
                        data.Transform.Scale.z = t["scale"].value("z", 1.0f);
                    }
                }
                
                m_Scene->m_Registry.push_back(data);
            }
            return true;
        } catch (...) {
            std::cout << "Failed to deserialize scene JSON" << std::endl;
            return false;
        }
    }

} // namespace Plume
