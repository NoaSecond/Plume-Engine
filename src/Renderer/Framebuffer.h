// src/Renderer/Framebuffer.h
#pragma once

#include <glad/glad.h>
#include <cstdint>

class Framebuffer {
public:
    Framebuffer() = default;
    ~Framebuffer();

    void Create(uint32_t width, uint32_t height);
    void Bind();
    void Unbind();
    void Resize(uint32_t width, uint32_t height);

    GLuint GetColorAttachment() const { return m_ColorAttachment; }

private:
    GLuint m_RendererID = 0;
    GLuint m_ColorAttachment = 0;
    GLuint m_DepthAttachment = 0;
    uint32_t m_Width = 0, m_Height = 0;
};
