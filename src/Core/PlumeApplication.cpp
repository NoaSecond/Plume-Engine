// src/Core/PlumeApplication.cpp
#include "PlumeApplication.h"

#include <iostream>
#include <glad/glad.h>
#include <SDL2/SDL.h>
#include "../Renderer/Buffer.h" // On a besoin d'inclure Buffer.h pour VertexBuffer

const int WINDOW_WIDTH = 1280;
const int WINDOW_HEIGHT = 720;

// Code des shaders
const std::string vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 aPos;
    void main() {
       gl_Position = vec4(aPos, 1.0);
    }
)";
const std::string fragmentShaderSource = R"(
    #version 330 core
    out vec4 FragColor;
    void main() {
       FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
    }
)";

PlumeApplication::PlumeApplication() {
    Init();
}

PlumeApplication::~PlumeApplication() {
    Shutdown();
}

void PlumeApplication::Init() {
    // --- INITIALISATION DE SDL ---
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        std::cerr << "Erreur SDL_Init: " << SDL_GetError() << std::endl;
        return;
    }

    // --- CONFIGURATION D'OPENGL ---
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);

    // --- CRÉATION DE LA FENÊTRE ---
    m_Window = SDL_CreateWindow("Plume Engine v0.1", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL);
    if (!m_Window) {
        std::cerr << "Erreur SDL_CreateWindow: " << SDL_GetError() << std::endl;
        return;
    }

    // --- CRÉATION DU CONTEXTE OPENGL ---
    m_GLContext = SDL_GL_CreateContext(m_Window);
    if (!m_GLContext) {
        std::cerr << "Erreur SDL_GL_CreateContext: " << SDL_GetError() << std::endl;
        return;
    }

    // --- INITIALISATION DE GLAD ---
    if (!gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress)) {
        std::cerr << "Erreur gladLoadGLLoader" << std::endl;
        return;
    }
    std::cout << "OpenGL Version: " << glGetString(GL_VERSION) << std::endl;

    // --- PRÉPARATION DU RENDU ---
    
    // 1. Créer le Shader
    m_Shader = std::make_unique<Shader>(vertexShaderSource, fragmentShaderSource);

    // 2. Créer le Vertex Array
    m_TriangleVA = std::make_shared<VertexArray>();

    // 3. Créer le Vertex Buffer
    float vertices[] = {
        -0.5f, -0.5f, 0.0f, // Sommet 1
         0.5f, -0.5f, 0.0f, // Sommet 2
         0.0f,  0.5f, 0.0f  // Sommet 3
    };
    std::shared_ptr<VertexBuffer> vb = std::make_shared<VertexBuffer>(vertices, static_cast<uint32_t>(sizeof(vertices)));

    // DÉFINIR LE LAYOUT DU BUFFER
    vb->SetLayout({
        { ShaderDataType::Float3, "a_Position" }
    });

    // 4. Lier le Vertex Buffer au Vertex Array
    m_TriangleVA->AddVertexBuffer(vb);
}

void PlumeApplication::Run() {
    while (m_IsRunning) {
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                m_IsRunning = false;
            }
        }

        // --- DESSIN ---
        glClearColor(0.1f, 0.2f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        m_Shader->Bind();
        m_TriangleVA->Bind();
        glDrawArrays(GL_TRIANGLES, 0, 3);

        SDL_GL_SwapWindow(m_Window);
    }
}

void PlumeApplication::Shutdown() {
    // Le nettoyage est maintenant automatique grâce aux destructeurs et pointeurs intelligents !
    SDL_GL_DeleteContext(m_GLContext);
    SDL_DestroyWindow(m_Window);
    SDL_Quit();
    std::cout << "Fermeture de Plume Engine." << std::endl;
}