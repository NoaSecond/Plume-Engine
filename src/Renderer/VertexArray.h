// src/Renderer/VertexArray.h
#pragma once

#include "Buffer.h"
#include <memory>
#include <vector> // <-- NOUVEAU

class VertexArray {
public:
    VertexArray();
    ~VertexArray();

    void Bind() const;
    void Unbind() const;

    void AddVertexBuffer(const std::shared_ptr<VertexBuffer>& vertexBuffer);

private:
    uint32_t m_RendererID;
    // NOUVEAU : Stocker les vertex buffers pour garantir leur durée de vie
    std::vector<std::shared_ptr<VertexBuffer>> m_VertexBuffers;
};