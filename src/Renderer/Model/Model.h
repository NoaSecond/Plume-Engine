// src/Renderer/Model/Model.h
#pragma once

#include "Mesh.h"
#include <string>
#include <vector>
#include <assimp/scene.h>

class Model {
public:
    Model(const std::string& path);
    void Draw(Shader& shader);
    const std::vector<Mesh>& GetMeshes() const { return m_Meshes; }

private:
    // Données du modèle
    std::vector<Mesh> m_Meshes;
    std::string m_Directory;
    std::vector<std::shared_ptr<Texture>> m_TexturesLoaded; // Cache pour les textures

    void loadModel(const std::string& path);
    void processNode(aiNode *node, const aiScene *scene);
    Mesh processMesh(aiMesh *mesh, const aiScene *scene);
    
    // La déclaration qui manquait
    std::vector<std::shared_ptr<Texture>> loadMaterialTextures(aiMaterial *mat, aiTextureType type, std::string typeName);
};