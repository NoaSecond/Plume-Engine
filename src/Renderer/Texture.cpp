// src/Renderer/Texture.cpp
#include "Texture.h"
#include <glad/glad.h>
#include <iostream>

// Inclure et définir l'implémentation de stb_image
#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

Texture::Texture(const std::string& path)
    : m_RendererID(0), m_FilePath(path), m_Width(0), m_Height(0), m_BPP(0) {

    // stb_image charge les images depuis le coin supérieur gauche, OpenGL les attend depuis le coin inférieur gauche.
    // On doit donc inverser l'image verticalement lors du chargement.
    stbi_set_flip_vertically_on_load(1);

    unsigned char* localBuffer = stbi_load(path.c_str(), &m_Width, &m_Height, &m_BPP, 4); // 4 = RGBA

    if (localBuffer) {
        glGenTextures(1, &m_RendererID);
        glBindTexture(GL_TEXTURE_2D, m_RendererID);

        // Définir les paramètres de la texture (filtrage et wrapping)
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);

        // Envoyer les données de l'image au GPU
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, m_Width, m_Height, 0, GL_RGBA, GL_UNSIGNED_BYTE, localBuffer);
        glGenerateMipmap(GL_TEXTURE_2D);

        // Libérer la mémoire de l'image une fois qu'elle est sur le GPU
        stbi_image_free(localBuffer);
    } else {
        std::cerr << "Erreur: Impossible de charger la texture: " << path << std::endl;
    }
}

Texture::~Texture() {
    glDeleteTextures(1, &m_RendererID);
}

void Texture::Bind(uint32_t slot) const {
    glActiveTexture(GL_TEXTURE0 + slot);
    glBindTexture(GL_TEXTURE_2D, m_RendererID);
}

void Texture::Unbind() const {
    glBindTexture(GL_TEXTURE_2D, 0);
}