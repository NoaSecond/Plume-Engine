// src/Renderer/Shader.cpp
#include "Shader.h"
#include <iostream>
#include <vector>
#include <glad/glad.h>
#include <glm/gtc/type_ptr.hpp>

Shader::Shader(const std::string& vertexSrc, const std::string& fragmentSrc) {
    // ... (code de compilation des shaders)
    const char* vertexSource = vertexSrc.c_str();
    const char* fragmentSource = fragmentSrc.c_str();
    unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexSource, NULL);
    glCompileShader(vertexShader);
    unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentSource, NULL);
    glCompileShader(fragmentShader);
    m_RendererID = glCreateProgram();
    glAttachShader(m_RendererID, vertexShader);
    glAttachShader(m_RendererID, fragmentShader);
    glLinkProgram(m_RendererID);
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
}

Shader::~Shader() { glDeleteProgram(m_RendererID); }
void Shader::Bind() const { glUseProgram(m_RendererID); }
void Shader::Unbind() const { glUseProgram(0); }

void Shader::UploadUniformMat4(const std::string& name, const glm::mat4& matrix) {
    GLint location = glGetUniformLocation(m_RendererID, name.c_str());
    glUniformMatrix4fv(location, 1, GL_FALSE, glm::value_ptr(matrix));
}

void Shader::UploadUniformVec3(const std::string& name, const glm::vec3& vector) {
    GLint location = glGetUniformLocation(m_RendererID, name.c_str());
    glUniform3fv(location, 1, glm::value_ptr(vector));
}

void Shader::SetInt(const std::string& name, int value) {
    GLint location = glGetUniformLocation(m_RendererID, name.c_str());
    glUniform1i(location, value);
}