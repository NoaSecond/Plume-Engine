// src/Renderer/Model/Model.cpp
#include "Model.h"
#include "Mesh.h"
#include "../Buffer.h"
#include <glad/glad.h>
#include <assimp/Importer.hpp>
#include <assimp/postprocess.h>
#include <iostream>

// --- Implémentation de la classe Model ---

Model::Model(const std::string& path) {
    loadModel(path);
}

void Model::Draw(Shader& shader) {
    for (unsigned int i = 0; i < m_Meshes.size(); i++) {
        m_Meshes[i].Draw(shader);
    }
}

void Model::loadModel(const std::string& path) {
    Assimp::Importer importer;
    const aiScene* scene = importer.ReadFile(path, aiProcess_Triangulate | aiProcess_FlipUVs | aiProcess_GenNormals);

    if (!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode) {
        std::cerr << "ERREUR::ASSIMP::" << importer.GetErrorString() << std::endl;
        return;
    }
    m_Directory = path.substr(0, path.find_last_of('/'));
    std::cout << "Model loaded: " << path << " (meshes approx: " << (scene ? scene->mNumMeshes : 0) << ")" << std::endl;
    processNode(scene->mRootNode, scene);
}

void Model::processNode(aiNode* node, const aiScene* scene) {
    for (unsigned int i = 0; i < node->mNumMeshes; i++) {
        aiMesh* mesh = scene->mMeshes[node->mMeshes[i]];
        m_Meshes.push_back(processMesh(mesh, scene));
    }
    for (unsigned int i = 0; i < node->mNumChildren; i++) {
        processNode(node->mChildren[i], scene);
    }
}

Mesh Model::processMesh(aiMesh* mesh, const aiScene* scene) {
    std::vector<Vertex> vertices;
    std::vector<unsigned int> indices;
    std::vector<std::shared_ptr<Texture>> textures;

    for (unsigned int i = 0; i < mesh->mNumVertices; i++) {
        Vertex vertex;
        vertex.Position = { mesh->mVertices[i].x, mesh->mVertices[i].y, mesh->mVertices[i].z };
        if (mesh->HasNormals()) { vertex.Normal = { mesh->mNormals[i].x, mesh->mNormals[i].y, mesh->mNormals[i].z }; }
        if (mesh->mTextureCoords[0]) { vertex.TexCoords = { mesh->mTextureCoords[0][i].x, mesh->mTextureCoords[0][i].y }; }
        else { vertex.TexCoords = { 0.0f, 0.0f }; }
        vertices.push_back(vertex);
    }

    for (unsigned int i = 0; i < mesh->mNumFaces; i++) {
        aiFace face = mesh->mFaces[i];
        for (unsigned int j = 0; j < face.mNumIndices; j++) {
            indices.push_back(face.mIndices[j]);
        }
    }

    if (mesh->mMaterialIndex >= 0) {
        aiMaterial* material = scene->mMaterials[mesh->mMaterialIndex];
        std::vector<std::shared_ptr<Texture>> diffuseMaps = loadMaterialTextures(material, aiTextureType_DIFFUSE, "texture_diffuse");
        textures.insert(textures.end(), diffuseMaps.begin(), diffuseMaps.end());
    }

    return Mesh(vertices, indices, textures);
}

std::vector<std::shared_ptr<Texture>> Model::loadMaterialTextures(aiMaterial* mat, aiTextureType type, std::string typeName) {
    std::vector<std::shared_ptr<Texture>> textures;
    for (unsigned int i = 0; i < mat->GetTextureCount(type); i++) {
        aiString str;
        mat->GetTexture(type, i, &str);
        bool skip = false;
        
        // Note: La vérification du cache n'est pas implémentée pour rester simple
        if (!skip) {
            std::string texturePath = m_Directory + '/' + std::string(str.C_Str());
            auto texture = std::make_shared<Texture>(texturePath);
            textures.push_back(texture);
            m_TexturesLoaded.push_back(texture);
        }
    }
    return textures;
}

// --- Implémentation de la classe Mesh ---
// (Le reste du fichier ne change pas)

Mesh::Mesh(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices, std::vector<std::shared_ptr<Texture>> textures) {
    this->vertices = vertices;
    this->indices = indices;
    this->textures = textures;
    setupMesh();
}

void Mesh::setupMesh() {
    VAO = std::make_shared<VertexArray>();
    auto vb = std::make_shared<VertexBuffer>(vertices.data(), static_cast<uint32_t>(vertices.size() * sizeof(Vertex)));
    vb->SetLayout({
        { ShaderDataType::Float3, "a_Position" },
        { ShaderDataType::Float3, "a_Normal" },
        { ShaderDataType::Float2, "a_TexCoords" }
    });
    VAO->AddVertexBuffer(vb);
    auto ib = std::make_shared<IndexBuffer>(indices.data(), static_cast<uint32_t>(indices.size()));
    VAO->SetIndexBuffer(ib);
}

void Mesh::Draw(Shader& shader) {
    for (unsigned int i = 0; i < textures.size(); i++) {
        textures[i]->Bind(0);
        shader.SetInt("u_TextureDiffuse", 0);
    }

    VAO->Bind();
    glDrawElements(GL_TRIANGLES, static_cast<GLsizei>(indices.size()), GL_UNSIGNED_INT, 0);
    VAO->Unbind();
}