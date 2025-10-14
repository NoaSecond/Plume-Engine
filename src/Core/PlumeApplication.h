// src/Core/PlumeApplication.h
#pragma once

#include <memory>
#include "../Renderer/Shader.h"
#include "../Renderer/VertexArray.h" // <-- INCLURE VertexArray

struct SDL_Window;
typedef void* SDL_GLContext;

class PlumeApplication {
public:
    PlumeApplication();
    ~PlumeApplication();

    void Run();

private:
    void Init();
    void Shutdown();

    SDL_Window* m_Window = nullptr;
    SDL_GLContext m_GLContext = nullptr;
    bool m_IsRunning = true;

    // Objets de rendu (maintenant avec nos nouvelles classes)
    std::unique_ptr<Shader> m_Shader;
    std::shared_ptr<VertexArray> m_TriangleVA; // <-- MODIFIÉ
};