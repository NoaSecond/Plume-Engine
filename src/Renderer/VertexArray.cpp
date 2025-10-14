// src/Renderer/VertexArray.cpp
#include "VertexArray.h"
#include <glad/glad.h>

// Fonction utilitaire pour convertir notre enum en type de base OpenGL
static GLenum ShaderDataTypeToOpenGLBaseType(ShaderDataType type) {
    switch (type) {
        case ShaderDataType::Float:    return GL_FLOAT;
        case ShaderDataType::Float2:   return GL_FLOAT;
        case ShaderDataType::Float3:   return GL_FLOAT;
        case ShaderDataType::Float4:   return GL_FLOAT;
        case ShaderDataType::Mat3:     return GL_FLOAT;
        case ShaderDataType::Mat4:     return GL_FLOAT;
        case ShaderDataType::Int:      return GL_INT;
        case ShaderDataType::Int2:     return GL_INT;
        case ShaderDataType::Int3:     return GL_INT;
        case ShaderDataType::Int4:     return GL_INT;
        case ShaderDataType::Bool:     return GL_BOOL;
    }
    return 0;
}

VertexArray::VertexArray() {
    glGenVertexArrays(1, &m_RendererID);
}

VertexArray::~VertexArray() {
    glDeleteVertexArrays(1, &m_RendererID);
}

void VertexArray::Bind() const {
    glBindVertexArray(m_RendererID);
}

void VertexArray::Unbind() const {
    glBindVertexArray(0);
}

void VertexArray::AddVertexBuffer(const std::shared_ptr<VertexBuffer>& vertexBuffer) {
    glBindVertexArray(m_RendererID);
    vertexBuffer->Bind();

    const auto& layout = vertexBuffer->GetLayout();
    uint32_t index = 0;
    for (const auto& element : layout.GetElements()) {
        glEnableVertexAttribArray(index);
        glVertexAttribPointer(
            index,
            element.GetComponentCount(), // <-- CORRECTION APPLIQUÉE ICI
            ShaderDataTypeToOpenGLBaseType(element.Type),
            element.Normalized ? GL_TRUE : GL_FALSE,
            layout.GetStride(),
            (const void*)(intptr_t)element.Offset
        );
        index++;
    }

    m_VertexBuffers.push_back(vertexBuffer);
}