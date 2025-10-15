// src/Editor/EditorLayer.cpp
#include "EditorLayer.h"

#ifdef PLUME_ENABLE_IMGUI
#include <imgui.h>
#include <imgui_impl_sdl.h>
#include <imgui_impl_opengl3.h>
#endif
#include <filesystem>
#include <iostream>
#include <stb_image.h>
#include "../Renderer/Model/Model.h"

EditorLayer::EditorLayer(SDL_Window* window)
    : m_Window(window) {
}

EditorLayer::~EditorLayer() {}

void EditorLayer::OnAttach() {
    // Create framebuffer with initial size
    m_Framebuffer = std::make_unique<Framebuffer>();
    m_Framebuffer->Create(m_ViewportWidth, m_ViewportHeight);
    RefreshAssets();
    std::cout << "EditorLayer attached: framebuffer tex=" << m_Framebuffer->GetColorAttachment() << " size=" << m_ViewportWidth << "x" << m_ViewportHeight << std::endl;
}

void EditorLayer::OnDetach() {
    m_Framebuffer.reset();
}

void EditorLayer::OnEvent(const SDL_Event& event) {
    // Forward to ImGui impl if needed
#ifdef PLUME_ENABLE_IMGUI
    ImGui_ImplSDL2_ProcessEvent(&event);
#endif
}

void EditorLayer::OnUpdate() {
    // Nothing for now. The outer app will render the scene into the framebuffer before ImGui rendering.
}

void EditorLayer::RefreshAssets() {
    m_Assets.clear();
    const std::filesystem::path assetsPath = "assets";
    if (!std::filesystem::exists(assetsPath)) return;
    for (auto& p : std::filesystem::recursive_directory_iterator(assetsPath)) {
        if (p.is_regular_file()) {
            m_Assets.push_back(p.path().string());
        }
    }

    // Load thumbnails for image files
    for (auto& path : m_Assets) {
        std::filesystem::path p(path);
        std::string ext = p.extension().string();
        for (auto & c: ext) c = (char)tolower(c);
        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
            if (m_ThumbnailCache.find(path) != m_ThumbnailCache.end()) continue;
            int w,h,channels;
            stbi_set_flip_vertically_on_load(1);
            unsigned char* data = stbi_load(path.c_str(), &w, &h, &channels, STBI_rgb_alpha);
            if (data) {
                GLuint tex;
                glGenTextures(1, &tex);
                glBindTexture(GL_TEXTURE_2D, tex);
                glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
                glGenerateMipmap(GL_TEXTURE_2D);
                glBindTexture(GL_TEXTURE_2D, 0);
                stbi_image_free(data);
                m_ThumbnailCache[path] = tex;
            }
        }
    }
}

void EditorLayer::DrawDockspace() {
#ifdef PLUME_ENABLE_IMGUI
    ImGuiWindowFlags window_flags = ImGuiWindowFlags_MenuBar | ImGuiWindowFlags_NoDocking;
    const ImGuiViewport* viewport = ImGui::GetMainViewport();
    ImGui::SetNextWindowPos(viewport->WorkPos);
    ImGui::SetNextWindowSize(viewport->WorkSize);
    ImGui::SetNextWindowViewport(viewport->ID);
    window_flags |= ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove;
    window_flags |= ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoNavFocus;

    ImGui::PushStyleVar(ImGuiStyleVar_WindowRounding, 0.0f);
    ImGui::PushStyleVar(ImGuiStyleVar_WindowBorderSize, 0.0f);
    ImGui::Begin("DockSpaceWindow", nullptr, window_flags);
    ImGui::PopStyleVar(2);
    // Menu bar
    if (ImGui::BeginMenuBar()) {
        if (ImGui::BeginMenu("View")) {
            ImGui::MenuItem("Viewport", nullptr, &m_ShowViewport);
            ImGui::MenuItem("Outliner", nullptr, &m_ShowOutliner);
            ImGui::MenuItem("Content Browser", nullptr, &m_ShowContentBrowser);
            ImGui::MenuItem("Properties", nullptr, &m_ShowProperties);
            ImGui::EndMenu();
        }
        ImGui::EndMenuBar();
    }

    ImGuiID dockspace_id = ImGui::GetID("MyDockSpace");
    // Setup a default dock layout once
    if (!m_DockLayoutInitialized) {
        m_DockLayoutInitialized = true;
        ImGui::DockBuilderRemoveNode(dockspace_id); // clear any previous layout
        ImGui::DockBuilderAddNode(dockspace_id, ImGuiDockNodeFlags_DockSpace);
        ImGui::DockBuilderSetNodeSize(dockspace_id, viewport->WorkSize);

        ImGuiID dock_main_id = dockspace_id;
        ImGuiID dock_id_right = ImGui::DockBuilderSplitNode(dock_main_id, ImGuiDir_Right, 0.25f, nullptr, &dock_main_id);
        ImGuiID dock_id_bottom = ImGui::DockBuilderSplitNode(dock_main_id, ImGuiDir_Down, 0.20f, nullptr, &dock_main_id);

        ImGui::DockBuilderDockWindow("Viewport", dock_main_id);
        ImGui::DockBuilderDockWindow("Outliner", dock_id_right);
        ImGui::DockBuilderDockWindow("Properties", dock_id_right);
        ImGui::DockBuilderDockWindow("Content Browser", dock_id_bottom);

        ImGui::DockBuilderFinish(dockspace_id);
    }

    ImGui::DockSpace(dockspace_id, ImVec2(0.0f, 0.0f));

    ImGui::End();
#endif
}

void EditorLayer::DrawViewport() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowViewport) return;
    ImGui::Begin("Viewport");
    // Show framebuffer texture
    ImVec2 avail = ImGui::GetContentRegionAvail();
    uint32_t width = (uint32_t)avail.x;
    uint32_t height = (uint32_t)avail.y;
    if (width != m_ViewportWidth || height != m_ViewportHeight) {
        m_ViewportWidth = width; m_ViewportHeight = height;
        m_Framebuffer->Resize(m_ViewportWidth, m_ViewportHeight);
        // TODO: update camera projection aspect if necessary
    }

    GLuint tex = m_Framebuffer->GetColorAttachment();
    ImGui::Image((void*)(intptr_t)tex, avail, ImVec2(0,1), ImVec2(1,0));
    // Debug overlay: show texture id and viewport size
    ImGui::SetCursorScreenPos(ImGui::GetWindowPos() + ImVec2(8, 8));
    ImGui::BeginChild("ViewportDebug", ImVec2(200, 50), false, ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoInputs);
    ImGui::Text("Tex: %u", tex);
    ImGui::Text("Size: %u x %u", m_ViewportWidth, m_ViewportHeight);
    ImGui::Text("Meshes drawn: %d", m_LastModelMeshCount);
    ImGui::Text("F2: toggle render->framebuffer / backbuffer");
    ImGui::EndChild();
#endif
#ifdef PLUME_ENABLE_IMGUI
    ImGui::End();
#endif
}

void EditorLayer::DrawOutliner() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowOutliner) return;
    ImGui::Begin("Outliner");
    if (!m_Scene) {
        ImGui::TextDisabled("No scene");
        ImGui::End();
        return;
    }

    auto view = m_Scene->GetRegistry().view<TagComponent>();
    for (auto entity : view) {
        const auto& tag = m_Scene->GetRegistry().get<TagComponent>(entity);
        bool selected = (m_SelectedEntity == entity);
        if (ImGui::Selectable(tag.Tag.c_str(), selected)) {
            m_SelectedEntity = entity;
        }
    }

    // Accept dropped assets onto the outliner (create entity)
    if (ImGui::BeginDragDropTarget()) {
        if (const ImGuiPayload* payload = ImGui::AcceptDragDropPayload("ASSET_PATH")) {
            const char* path = (const char*)payload->Data;
            std::filesystem::path p(path);
            std::string name = p.filename().string();
            Entity e = m_Scene->CreateEntity(name);
            std::string ext = p.extension().string();
            for (auto & c: ext) c = (char)tolower(c);
            if (ext == ".obj") {
                auto model = std::make_shared<Model>(path);
                if (!model->GetMeshes().empty()) {
                    e.AddComponent<ModelComponent>(model);
                }
            }
        }
        ImGui::EndDragDropTarget();
    }

    ImGui::End();
#endif
}

void EditorLayer::DrawContentBrowser() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowContentBrowser) return;
    ImGui::Begin("Content Browser");
    if (ImGui::Button("Refresh")) RefreshAssets();
    ImGui::Separator();

    // Grid of thumbnails
    const float padding = 8.0f;
    const float thumbnailSize = 64.0f;
    float panelWidth = ImGui::GetContentRegionAvail().x;
    int columnCount = std::max(1, (int)(panelWidth / (thumbnailSize + padding)));
    ImGui::BeginChild("ContentBrowserChild", ImVec2(0, -ImGui::GetFrameHeightWithSpacing()), true);
    int index = 0;
    for (auto& asset : m_Assets) {
        if (index % columnCount != 0) ImGui::SameLine();

        std::filesystem::path p(asset);
        std::string filename = p.filename().string();
        GLuint tex = 0;
        auto it = m_ThumbnailCache.find(asset);
        if (it != m_ThumbnailCache.end()) tex = it->second;

        ImGui::PushID(asset.c_str());
        if (tex) {
            ImGui::Image((void*)(intptr_t)tex, ImVec2(thumbnailSize, thumbnailSize));
        } else {
            // Placeholder box
            ImGui::Dummy(ImVec2(thumbnailSize, thumbnailSize));
            ImGui::SameLine(0, 0);
            ImGui::TextDisabled("%s", "");
            ImGui::SameLine();
        }

        if (ImGui::BeginDragDropSource(ImGuiDragDropFlags_None)) {
            ImGui::SetDragDropPayload("ASSET_PATH", asset.c_str(), asset.size()+1);
            ImGui::Text("%s", filename.c_str());
            ImGui::EndDragDropSource();
        }

        if (ImGui::IsItemClicked()) {
            // mark selection (not stored yet)
        }

        ImGui::TextWrapped("%s", filename.c_str());
        ImGui::PopID();
        index++;
    }
    ImGui::EndChild();

    ImGui::End();
#endif
}

void EditorLayer::OnImGuiRender() {
    DrawDockspace();
    DrawOutliner();
    DrawContentBrowser();
    DrawViewport();
    DrawProperties();
}

void EditorLayer::DrawProperties() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowProperties) return;
    ImGui::Begin("Properties");
    if (!m_Scene) {
        ImGui::TextDisabled("No scene");
        ImGui::End();
        return;
    }

    if (m_SelectedEntity == entt::null) {
        ImGui::TextDisabled("No entity selected");
        ImGui::End();
        return;
    }

    // Wrap selected entity handle into Entity helper
    Entity e(m_SelectedEntity, m_Scene);

    // TagComponent
    if (e.HasComponent<TagComponent>()) {
        auto& tag = e.GetComponent<TagComponent>();
        char buffer[256];
        strncpy(buffer, tag.Tag.c_str(), sizeof(buffer));
        buffer[sizeof(buffer)-1] = '\0';
        if (ImGui::InputText("Name", buffer, sizeof(buffer))) {
            tag.Tag = std::string(buffer);
        }
    }

    // TransformComponent
    if (e.HasComponent<TransformComponent>()) {
        auto& transform = e.GetComponent<TransformComponent>();
        ImGui::Separator();
        ImGui::Text("Transform");
        ImGui::DragFloat3("Translation", &transform.Translation.x, 0.1f);
        ImGui::DragFloat3("Rotation", &transform.Rotation.x, 0.01f);
        ImGui::DragFloat3("Scale", &transform.Scale.x, 0.01f);
    }

    ImGui::End();
#endif
}
