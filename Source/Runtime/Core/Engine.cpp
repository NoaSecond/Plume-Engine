#include "Engine.h"
#include <thread>
#include <chrono>

namespace Plume {
    Engine::Engine() {}
    Engine::~Engine() { Shutdown(); }

    void Engine::Init() {
        m_Scene = std::make_unique<Scene>();
        m_Scene->CreateEntity("Scene_Root", EntityType::Folder);
        m_Scene->CreateEntity("Sun_Light", EntityType::Light, "Directional");
        m_Scene->CreateEntity("Main_Camera", EntityType::Camera);
        m_Scene->CreateEntity("Rotating_Cube_CPP", EntityType::Mesh, "Cube");
        m_IsRunning = true;
    }

    void Engine::Run() {
        auto lastTime = std::chrono::high_resolution_clock::now();
        while (m_IsRunning) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float deltaTime = std::chrono::duration<float>(currentTime - lastTime).count();
            lastTime = currentTime;
            if (m_Scene) m_Scene->OnUpdate(deltaTime);
            std::this_thread::sleep_for(std::chrono::milliseconds(16));
        }
    }
    
    void Engine::Shutdown() { m_IsRunning = false; }
}
