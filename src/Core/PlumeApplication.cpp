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

// --- SHADERS MIS À JOUR POUR L'ÉCLAIRAGE ---
const std::string vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 a_Position;
    layout (location = 1) in vec3 a_Normal;
    layout (location = 2) in vec2 a_TexCoords;

    uniform mat4 u_Model;
    uniform mat4 u_View;
    uniform mat4 u_Projection;

    out vec2 v_TexCoords;
    out vec3 v_Normal;
    out vec3 v_FragPos;

    void main() {
       gl_Position = u_Projection * u_View * u_Model * vec4(a_Position, 1.0);
       v_TexCoords = a_TexCoords;
       
       // On transforme la position du fragment et la normale dans l'espace du monde
       v_FragPos = vec3(u_Model * vec4(a_Position, 1.0));
       v_Normal = mat3(transpose(inverse(u_Model))) * a_Normal;
    }
)";

const std::string fragmentShaderSource = R"(
    #version 330 core
    in vec2 v_TexCoords;
    in vec3 v_Normal;
    in vec3 v_FragPos;
    
    out vec4 FragColor;

    uniform sampler2D u_TextureDiffuse;
    uniform vec3 u_LightPos;
    uniform vec3 u_LightColor;
    uniform vec3 u_ViewPos;

    void main() {
       // Lumière ambiante
       float ambientStrength = 0.1;
       vec3 ambient = ambientStrength * u_LightColor;

       // Lumière diffuse
       vec3 norm = normalize(v_Normal);
       vec3 lightDir = normalize(u_LightPos - v_FragPos);
       float diff = max(dot(norm, lightDir), 0.0);
       vec3 diffuse = diff * u_LightColor;

       // (La lumière spéculaire sera ajoutée plus tard)

       vec4 texColor = texture(u_TextureDiffuse, v_TexCoords);
       vec3 result = (ambient + diffuse) * texColor.rgb;
       FragColor = vec4(result, 1.0);
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
    if (!backpackModel->GetMeshes().empty()) {
        modelEntity.AddComponent<ModelComponent>(backpackModel);
        auto& transform = modelEntity.GetComponent<TransformComponent>();
        transform.Scale = glm::vec3(0.5f);
    } else {
        std::cerr << "ERREUR: Le modele n'a pas pu etre charge : " << modelPath << std::endl;
    }

    // NOUVEAU : Créer une entité pour la lumière
    auto lightEntity = m_ActiveScene->CreateEntity("Point Light");
    lightEntity.AddComponent<LightComponent>();
    auto& lightTransform = lightEntity.GetComponent<TransformComponent>();
    lightTransform.Translation = glm::vec3(1.5f, 1.0f, 2.0f);
}

void PlumeApplication::Run() {
    std::unique_ptr<Shader> shader = std::make_unique<Shader>(vertexShaderSource, fragmentShaderSource);
    
    uint64_t lastFrameTime = SDL_GetPerformanceCounter();
    while (m_IsRunning) {
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
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f); // Fond un peu plus sombre
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        shader->Bind();
        shader->UploadUniformMat4("u_View", m_Camera->GetViewMatrix());
        shader->UploadUniformMat4("u_Projection", m_Camera->GetProjectionMatrix());
        shader->UploadUniformVec3("u_ViewPos", m_Camera->GetPosition());

        // Trouver la lumière et envoyer ses infos au shader
        glm::vec3 lightPos;
        glm::vec3 lightColor;
        auto lightView = m_ActiveScene->GetRegistry().view<TransformComponent, LightComponent>();
        for (auto entity : lightView) {
            auto& transform = lightView.get<TransformComponent>(entity);
            auto& light = lightView.get<LightComponent>(entity);
            lightPos = transform.Translation;
            lightColor = light.Color * light.Intensity;
            break; // On ne gère qu'une seule lumière pour l'instant
        }
        shader->UploadUniformVec3("u_LightPos", lightPos);
        shader->UploadUniformVec3("u_LightColor", lightColor);

        // Rendu des modèles
        auto modelView = m_ActiveScene->GetRegistry().view<TransformComponent, ModelComponent>();
        for (auto entity : modelView) {
            auto& transform = modelView.get<TransformComponent>(entity);
            auto& modelComp = modelView.get<ModelComponent>(entity);
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