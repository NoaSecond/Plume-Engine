// src/Editor/EditorLayer.h
#pragma once

#include <memory>
#include <string>
#include <vector>
#include <SDL2/SDL.h>
#include <glm/glm.hpp>
#include "../Scene/Scene.h"
#include "../Renderer/Framebuffer.h"
#include <map>

// Forward declare GLuint
typedef unsigned int GLuint;

class EditorLayer {
public:
    EditorLayer(SDL_Window* window);
    ~EditorLayer();

    void OnAttach();
    void OnDetach();
    void OnEvent(const SDL_Event& event);
    void OnUpdate();
    void OnImGuiRender();

    void SetScene(Scene* scene) { m_Scene = scene; }

private:
    void DrawDockspace();
    void DrawViewport();
    void DrawOutliner();
    void DrawContentBrowser();
    void DrawProperties();
    void SetLastModelMeshCount(int count) { m_LastModelMeshCount = count; }

    SDL_Window* m_Window = nullptr;
    Scene* m_Scene = nullptr;
    std::unique_ptr<Framebuffer> m_Framebuffer;
    Framebuffer* GetFramebuffer() { return m_Framebuffer.get(); }
    uint32_t m_ViewportWidth = 1280, m_ViewportHeight = 720;
    std::pair<uint32_t,uint32_t> GetViewportSize() const { return { m_ViewportWidth, m_ViewportHeight }; }
    entt::entity m_SelectedEntity{ entt::null };
    std::vector<std::string> m_Assets;
    std::map<std::string, GLuint> m_ThumbnailCache;
    void RefreshAssets();
    // UI state
    bool m_ShowViewport = true;
    bool m_ShowOutliner = true;
    bool m_ShowContentBrowser = true;
    bool m_ShowProperties = true;
    bool m_DockLayoutInitialized = false;
    int m_LastModelMeshCount = 0;
};
