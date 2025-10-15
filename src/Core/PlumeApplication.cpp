// src/Core/PlumeApplication.cpp
#include "PlumeApplication.h"
#include "PlumeVersion.h"
#include <iostream>
#include <glad/glad.h>
#include <SDL2/SDL.h>

// Inclure stb_image pour le chargement de l'icône (implémentation définie dans Texture.cpp)
#include <stb_image.h>

#include "../Renderer/Shader.h"
#include "../Renderer/Camera.h"
#include "../Core/Input.h"
#include "Scene/Scene.h"
#include "Scene/Entity.h"
#include "Scene/Components.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

// --- SHADERS ---
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
       float ambientStrength = 0.1;
       vec3 ambient = ambientStrength * u_LightColor;

       vec3 norm = normalize(v_Normal);
       vec3 lightDir = normalize(u_LightPos - v_FragPos);
       float diff = max(dot(norm, lightDir), 0.0);
       vec3 diffuse = diff * u_LightColor;

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
    if (SDL_Init(SDL_INIT_VIDEO) != 0) { std::cerr << "Erreur SDL_Init: " << SDL_GetError() << std::endl; m_IsRunning = false; return; }
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    
    std::string windowTitle = std::string(PLUME_PRODUCT_NAME) + " v" + std::string(PLUME_FILE_VERSION_STR);
    m_Window = SDL_CreateWindow(windowTitle.c_str(), SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, WINDOW_WIDTH, WINDOW_HEIGHT, SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL);
    if (!m_Window) { std::cerr << "Erreur SDL_CreateWindow: " << SDL_GetError() << std::endl; m_IsRunning = false; return; }

    // --- DÉFINIR L'ICÔNE DE LA FENÊTRE ---
    {
        int width, height, channels;
        stbi_set_flip_vertically_on_load(0); // Pas besoin d'inverser pour une icône
        unsigned char* pixels = stbi_load("assets/icons/PlumeEngineIcon.png", &width, &height, &channels, STBI_rgb_alpha);

        if (pixels) {
            SDL_Surface* iconSurface = SDL_CreateRGBSurfaceFrom(pixels, width, height, 32, width * 4, 0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000);
            if (iconSurface) {
                SDL_SetWindowIcon(m_Window, iconSurface);
                SDL_FreeSurface(iconSurface);
            }
            stbi_image_free(pixels);
        } else {
            std::cerr << "Avertissement: Impossible de charger l'icone 'assets/icons/PlumeEngineIcon.png'" << std::endl;
        }
        // Rétablir le paramètre pour le chargement des textures de modèles
        stbi_set_flip_vertically_on_load(1);
    }
    // --- FIN DU BLOC D'ICÔNE ---

    m_GLContext = SDL_GL_CreateContext(m_Window);
    if (!m_GLContext) { std::cerr << "Erreur SDL_GL_CreateContext: " << SDL_GetError() << std::endl; m_IsRunning = false; return; }
    if (!gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress)) { std::cerr << "Erreur gladLoadGLLoader" << std::endl; m_IsRunning = false; return; }
    glEnable(GL_DEPTH_TEST);
    // Do not force relative mouse mode at init. We'll toggle it each frame
    // depending on whether the user holds the right mouse button for camera control.
    
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

    // Créer une entité pour la lumière
    auto lightEntity = m_ActiveScene->CreateEntity("Point Light");
    lightEntity.AddComponent<LightComponent>();
    auto& lightTransform = lightEntity.GetComponent<TransformComponent>();
    lightTransform.Translation = glm::vec3(1.5f, 1.0f, 2.0f);
}

void PlumeApplication::Run() {
    if (!m_IsRunning) {
        std::cerr << "PlumeApplication: initialization failed, exiting Run()." << std::endl;
        return;
    }
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
        // Show About dialog on F1
        if (m_Input->IsKeyPressed(SDL_SCANCODE_F1)) {
            ShowAbout();
        }
        // Toggle relative mouse mode (hides cursor and provides relative motion)
        // when the right mouse button is held for camera look.
        // If right button is pressed -> enable relative mouse mode, else disable it.
        bool wantRelative = m_Input->IsMouseButtonPressed(SDL_BUTTON_RIGHT);
        if (wantRelative != m_RelativeMouseEnabled) {
            // Only call SDL when the desired state changes
            SDL_SetRelativeMouseMode(wantRelative ? SDL_TRUE : SDL_FALSE);
            m_RelativeMouseEnabled = wantRelative;
        }

        m_Camera->Update(*m_Input, deltaTime);
        
        // --- Rendu de la Scène ---
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        shader->Bind();
        shader->UploadUniformMat4("u_View", m_Camera->GetViewMatrix());
        shader->UploadUniformMat4("u_Projection", m_Camera->GetProjectionMatrix());
        shader->UploadUniformVec3("u_ViewPos", m_Camera->GetPosition());

        glm::vec3 lightPos;
        glm::vec3 lightColor;
        auto lightView = m_ActiveScene->GetRegistry().view<TransformComponent, LightComponent>();
        for (auto entity : lightView) {
            auto& transform = lightView.get<TransformComponent>(entity);
            auto& light = lightView.get<LightComponent>(entity);
            lightPos = transform.Translation;
            lightColor = light.Color * light.Intensity;
            break;
        }
        shader->UploadUniformVec3("u_LightPos", lightPos);
        shader->UploadUniformVec3("u_LightColor", lightColor);

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

void PlumeApplication::ShowAbout() {
    // Build about text from generated macros
    std::string aboutText = std::string(PLUME_PRODUCT_NAME) + "\nVersion " + std::string(PLUME_FILE_VERSION_STR) + "\n" + std::string(PLUME_COMPANY_NAME) + "\n" + std::string(PLUME_LEGAL_COPYRIGHT);
    SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "About", aboutText.c_str(), m_Window);
}