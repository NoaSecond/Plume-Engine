// src/Renderer/Model/Mesh.h
#pragma once

#include <glm/glm.hpp>
#include <vector>
#include <memory>
#include "../Shader.h"
#include "../VertexArray.h"

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
    std::shared_ptr<VertexArray> VAO;

    Mesh(const std::vector<Vertex>& vertices, const std::vector<unsigned int>& indices);
    void Draw(Shader& shader);

private:
    void setupMesh();
};