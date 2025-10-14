// src/Renderer/Model/Mesh.h
#pragma once

#include <glm/glm.hpp>
#include <vector>
#include <memory>
#include "../Shader.h"
#include "../VertexArray.h"
#include "../Texture.h" // <-- INCLURE LA TEXTURE

struct Vertex {
    glm::vec3 Position;
    glm::vec3 Normal;
    glm::vec2 TexCoords;
};

class Mesh {
public:
    // Données du maillage
    std::vector<Vertex>       vertices;
    std::vector<unsigned int> indices;
    std::vector<std::shared_ptr<Texture>> textures; // <-- MODIFIÉ
    std::shared_ptr<VertexArray> VAO;

    // MODIFIÉ : Le constructeur accepte maintenant des textures
    Mesh(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices, std::vector<std::shared_ptr<Texture>> textures);
    void Draw(Shader& shader);

private:
    void setupMesh();
};