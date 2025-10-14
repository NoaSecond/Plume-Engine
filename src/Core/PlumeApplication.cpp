// src/Core/PlumeApplication.cpp
#include "PlumeApplication.h"
#include <iostream>
#include <glad/glad.h>
#include <SDL2/SDL.h>
#include "../Renderer/Shader.h"
#include "../Renderer/Camera.h"
#include "../Core/Input.h"
#include "Scene/Scene.h"
#include "Scene/Entity.h"
#include "Scene/Components.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

const std::string vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 a_Position;
    layout (location = 1) in vec3 a_Normal;
    layout (location = 2) in vec2 a_TexCoords;

    uniform mat4 u_Model;
    uniform mat4 u_View;
    uniform mat4 u_Projection;

    out vec2 v_TexCoords;

    void main() {
       gl_Position = u_Projection * u_View * u_Model * vec4(a_Position, 1.0);
       v_TexCoords = a_TexCoords;
    }
)";

const std::string fragmentShaderSource = R"(
    #version 330 core
    in vec2 v_TexCoords;
    out vec4 FragColor;

    uniform sampler2D u_TextureDiffuse;

    void main() {
       FragColor = texture(u_TextureDiffuse, v_TexCoords);
    }
)";

const int WINDOW_WIDTH = 1280;
const int WINDOW_HEIGHT = 720;

PlumeApplication::PlumeApplication() { Init(); }
PlumeApplication::~PlumeApplication() { Shutdown(); }

void PlumeApplication::Init() {
    // ... (Initialisation de SDL, Glad, etc.)
    if (SDL_Init(SDL_INIT_VIDEO) != 0) { std::cerr << "Erreur SDL_Init: " << SDL_GetError() << std::endl; return; }
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    m_Window = SDL_CreateWindow("Plume Engine v0.1", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL);
    if (!m_Window) { std::cerr << "Erreur SDL_CreateWindow: " << SDL_GetError() << std::endl; return; }
    m_GLContext = SDL_GL_CreateContext(m_Window);
    if (!m_GLContext) { std::cerr << "Erreur SDL_GL_CreateContext: " << SDL_GetError() << std::endl; return; }
    if (!gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress)) { std::cerr << "Erreur gladLoadGLLoader" << std::endl; return; }
    glEnable(GL_DEPTH_TEST);
    SDL_SetRelativeMouseMode(SDL_TRUE);
    
    m_Input = new Input();
    m_Camera = new Camera(45.0f, (float)WINDOW_WIDTH / (float)WINDOW_HEIGHT, 0.1f, 100.0f);
    m_ActiveScene = std::make_unique<Scene>();

    // --- CHARGEMENT DU MODÈLE ---
    auto modelEntity = m_ActiveScene->CreateEntity("Backpack");
    std::string modelPath = "assets/models/backpack/12305_backpack_v2_l3.obj";
    auto backpackModel = std::make_shared<Model>(modelPath);
    if (backpackModel->GetMeshes().empty()) {
        std::cerr << "ERREUR CRITIQUE: Le modele n'a pas pu etre charge depuis le chemin : " << modelPath << std::endl;
    } else {
        modelEntity.AddComponent<ModelComponent>(backpackModel);
        auto& transform = modelEntity.GetComponent<TransformComponent>();
        transform.Scale = glm::vec3(0.5f);
    }
}

void PlumeApplication::Run() {
    std::unique_ptr<Shader> shader = std::make_unique<Shader>(vertexShaderSource, fragmentShaderSource);
    
    uint64_t lastFrameTime = SDL_GetPerformanceCounter();
    while (m_IsRunning) {
        // ... (Gestion du deltaTime, des inputs et de la caméra)
        uint64_t now = SDL_GetPerformanceCounter();
        float deltaTime = (float)((now - lastFrameTime) * 1000 / (double)SDL_GetPerformanceFrequency()) / 1000.0f;
        lastFrameTime = now;
        m_Input->BeginNewFrame();
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) { m_IsRunning = false; }
            m_Input->Update(event);
        }
        m_Camera->Update(*m_Input, deltaTime);

        // --- Rendu de la Scène ---
        glClearColor(0.1f, 0.2f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        shader->Bind();
        shader->UploadUniformMat4("u_View", m_Camera->GetViewMatrix());
        shader->UploadUniformMat4("u_Projection", m_Camera->GetProjectionMatrix());

        auto view = m_ActiveScene->GetRegistry().view<TransformComponent, ModelComponent>();
        for (auto entity : view) {
            auto& transform = view.get<TransformComponent>(entity);
            auto& modelComp = view.get<ModelComponent>(entity);
            shader->UploadUniformMat4("u_Model", transform.GetTransform());
            modelComp.model->Draw(*shader);
        }

        SDL_GL_SwapWindow(m_Window);
    }
}

void PlumeApplication::Shutdown() {
    delete m_Camera;
    delete m_Input;
    SDL_GL_DeleteContext(m_GLContext);
    SDL_DestroyWindow(m_Window);
    SDL_Quit();
    std::cout << "Fermeture de Plume Engine." << std::endl;
}