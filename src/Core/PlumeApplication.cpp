// src/Core/PlumeApplication.cpp
#include "PlumeApplication.h"

#include <iostream>
#include <glad/glad.h>
#include <SDL2/SDL.h>
#include "../Renderer/Buffer.h"

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

const int WINDOW_WIDTH = 1280;
const int WINDOW_HEIGHT = 720;

// Les sources des shaders pour la 3D
const std::string vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 a_Position;
    layout (location = 1) in vec3 a_Color;

    uniform mat4 u_Model;
    uniform mat4 u_View;
    uniform mat4 u_Projection;

    out vec3 v_Color;

    void main() {
       gl_Position = u_Projection * u_View * u_Model * vec4(a_Position, 1.0);
       v_Color = a_Color;
    }
)";

const std::string fragmentShaderSource = R"(
    #version 330 core
    in vec3 v_Color;
    out vec4 FragColor;

    void main() {
       FragColor = vec4(v_Color, 1.0f);
    }
)";

PlumeApplication::PlumeApplication() {
    Init();
}

PlumeApplication::~PlumeApplication() {
    Shutdown();
}

void PlumeApplication::Init() {
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        std::cerr << "Erreur SDL_Init: " << SDL_GetError() << std::endl;
        return;
    }
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    m_Window = SDL_CreateWindow("Plume Engine v0.1", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL);
    if (!m_Window) {
        std::cerr << "Erreur SDL_CreateWindow: " << SDL_GetError() << std::endl;
        return;
    }
    m_GLContext = SDL_GL_CreateContext(m_Window);
    if (!m_GLContext) {
        std::cerr << "Erreur SDL_GL_CreateContext: " << SDL_GetError() << std::endl;
        return;
    }
    if (!gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress)) {
        std::cerr << "Erreur gladLoadGLLoader" << std::endl;
        return;
    }
    std::cout << "OpenGL Version: " << glGetString(GL_VERSION) << std::endl;

    glEnable(GL_DEPTH_TEST);
    // Cacher le curseur et le "capturer" dans la fenêtre pour un mouvement de caméra fluide
    SDL_SetRelativeMouseMode(SDL_TRUE);

    // --- PRÉPARATION ---
    m_Input = std::make_unique<Input>();
    m_Camera = std::make_unique<Camera>(45.0f, (float)WINDOW_WIDTH / (float)WINDOW_HEIGHT, 0.1f, 100.0f);

    m_Shader = std::make_unique<Shader>(vertexShaderSource, fragmentShaderSource);
    m_CubeVA = std::make_shared<VertexArray>();

    float vertices[] = {
        -0.5f, -0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
         0.5f, -0.5f, -0.5f,  0.0f, 1.0f, 0.0f,
         0.5f,  0.5f, -0.5f,  0.0f, 0.0f, 1.0f,
        -0.5f,  0.5f, -0.5f,  1.0f, 1.0f, 0.0f,
        -0.5f, -0.5f,  0.5f,  1.0f, 0.0f, 1.0f,
         0.5f, -0.5f,  0.5f,  0.0f, 1.0f, 1.0f,
         0.5f,  0.5f,  0.5f,  1.0f, 1.0f, 1.0f,
        -0.5f,  0.5f,  0.5f,  0.0f, 0.0f, 0.0f
    };
    std::shared_ptr<VertexBuffer> vb = std::make_shared<VertexBuffer>(vertices, static_cast<uint32_t>(sizeof(vertices)));
    vb->SetLayout({
        { ShaderDataType::Float3, "a_Position" },
        { ShaderDataType::Float3, "a_Color" }
    });
    m_CubeVA->AddVertexBuffer(vb);

    uint32_t indices[] = {
        0, 1, 2, 2, 3, 0,
        4, 5, 6, 6, 7, 4,
        3, 2, 6, 6, 7, 3,
        0, 1, 5, 5, 4, 0,
        0, 3, 7, 7, 4, 0,
        1, 2, 6, 6, 5, 1
    };
    std::shared_ptr<IndexBuffer> ib = std::make_shared<IndexBuffer>(indices, static_cast<uint32_t>(sizeof(indices) / sizeof(uint32_t)));
    m_CubeVA->SetIndexBuffer(ib);
}

void PlumeApplication::Run() {
    uint64_t lastFrameTime = SDL_GetPerformanceCounter();

    while (m_IsRunning) {
        // Calcul du DeltaTime pour un mouvement indépendant de la vitesse de l'ordinateur
        uint64_t now = SDL_GetPerformanceCounter();
        float deltaTime = (float)((now - lastFrameTime) * 1000 / (double)SDL_GetPerformanceFrequency()) / 1000.0f;
        lastFrameTime = now;

        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) { m_IsRunning = false; }
            // Mettre à jour notre gestionnaire d'input avec les nouveaux événements
            m_Input->Update(event);
        }

        // Mettre à jour la caméra en fonction des entrées
        m_Camera->Update(*m_Input, deltaTime);

        // --- Rendu ---
        glClearColor(0.1f, 0.2f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        m_Shader->Bind();

        // Le cube ne tourne plus tout seul, sa position est statique (matrice identité)
        glm::mat4 model = glm::mat4(1.0f); 
        
        m_Shader->UploadUniformMat4("u_Model", model);
        m_Shader->UploadUniformMat4("u_View", m_Camera->GetViewMatrix());
        m_Shader->UploadUniformMat4("u_Projection", m_Camera->GetProjectionMatrix());

        m_CubeVA->Bind();
        glDrawElements(GL_TRIANGLES, m_CubeVA->GetIndexBuffer()->GetCount(), GL_UNSIGNED_INT, nullptr);

        SDL_GL_SwapWindow(m_Window);
    }
}

void PlumeApplication::Shutdown() {
    SDL_GL_DeleteContext(m_GLContext);
    SDL_DestroyWindow(m_Window);
    SDL_Quit();
    std::cout << "Fermeture de Plume Engine." << std::endl;
}