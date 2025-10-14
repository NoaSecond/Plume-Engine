// src/Renderer/Shader.cpp
#include "Shader.h"

#include <iostream>
#include <vector>
#include <glad/glad.h>

Shader::Shader(const std::string& vertexSrc, const std::string& fragmentSrc) {
    const char* vertexSource = vertexSrc.c_str();
    const char* fragmentSource = fragmentSrc.c_str();

    // --- Vertex Shader ---
    unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexSource, NULL);
    glCompileShader(vertexShader);

    // NOUVEAU : Vérifier les erreurs de compilation du vertex shader
    int success;
    char infoLog[1024];
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertexShader, 1024, NULL, infoLog);
        std::cerr << "ERREUR::SHADER::VERTEX::COMPILATION_ECHOUEE\n" << infoLog << std::endl;
    }

    // --- Fragment Shader ---
    unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentSource, NULL);
    glCompileShader(fragmentShader);

    // NOUVEAU : Vérifier les erreurs de compilation du fragment shader
    glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragmentShader, 1024, NULL, infoLog);
        std::cerr << "ERREUR::SHADER::FRAGMENT::COMPILATION_ECHOUEE\n" << infoLog << std::endl;
    }

    // --- Programme Shader ---
    m_RendererID = glCreateProgram();
    glAttachShader(m_RendererID, vertexShader);
    glAttachShader(m_RendererID, fragmentShader);
    glLinkProgram(m_RendererID);

    // NOUVEAU : Vérifier les erreurs de linkage du programme
    glGetProgramiv(m_RendererID, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(m_RendererID, 1024, NULL, infoLog);
        std::cerr << "ERREUR::SHADER::PROGRAMME::LINKAGE_ECHOUE\n" << infoLog << std::endl;
    }

    // Les shaders ne sont plus nécessaires une fois liés au programme
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
}

Shader::~Shader() {
    glDeleteProgram(m_RendererID);
}

void Shader::Bind() const {
    glUseProgram(m_RendererID);
}

void Shader::Unbind() const {
    glUseProgram(0);
}