// src/Editor/EditorLayer.cpp
#include "EditorLayer.h"

#ifdef PLUME_ENABLE_IMGUI
#include <imgui.h>
#if __has_include(<imgui_impl_sdl.h>)
#include <imgui_impl_sdl.h>
#elif __has_include(<imgui_impl_sdl2.h>)
#include <imgui_impl_sdl2.h>
#else
#error "imgui SDL backend header not found (imgui_impl_sdl.h or imgui_impl_sdl2.h)"
#endif
#include <imgui_impl_opengl3.h>
#include <imgui_internal.h> // Nécessaire pour ImGui::DockBuilder
#endif
#include <filesystem>
#include <iostream>
#include <stb_image.h>
#include "../Renderer/Model/Model.h"

// NOUVEAU: Ajout des includes manquants
#include "../Scene/Components.h"
#include "../Core/Input.h"
#include "PlumeVersion.h" // FIX C1083: Changement de "../Version/PlumeVersion.h" à "PlumeVersion.h"
#include "../Scene/Entity.h"
#include <glm/gtc/type_ptr.hpp> // Nécessaire pour DragFloat3 sur les vec3 de glm


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
    
    // Force le layout à se réinitialiser à la première frame
    ResetDockLayout(); 
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

void EditorLayer::ResetDockLayout() {
#ifdef PLUME_ENABLE_IMGUI
    m_DockLayoutInitialized = false;
    // Forcer l'éditeur à ignorer le layout sauvegardé dans le fichier ImGui.ini
    ImGuiContext* context = ImGui::GetCurrentContext();
    if (context) {
        // Ceci force la recréation du layout au prochain appel à DockSpace/DockBuilder
        context->SettingsLoaded = false; 
    }
#endif
}

void EditorLayer::DrawDockspace() {
#ifdef PLUME_ENABLE_IMGUI
    // Use the recommended helper to create a full-viewport dockspace.
    ImGuiViewport* viewport = ImGui::GetMainViewport();
    ImGui::SetNextWindowPos(viewport->WorkPos);
    ImGui::SetNextWindowSize(viewport->WorkSize);
    ImGui::SetNextWindowViewport(viewport->ID);

    ImGuiWindowFlags window_flags = ImGuiWindowFlags_MenuBar | ImGuiWindowFlags_NoDocking;
    window_flags |= ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove;
    window_flags |= ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoNavFocus | ImGuiWindowFlags_NoBackground;

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
            // Option de réinitialisation du layout
            if (ImGui::MenuItem("Reset Layout")) {
                ResetDockLayout();
            }
            ImGui::EndMenu();
        }
        ImGui::EndMenuBar();
    }

    // Create DockSpace over the main viewport
    ImGuiID dockspace_id = ImGui::GetID("MyDockSpace");

    if (!m_DockLayoutInitialized) {
        m_DockLayoutInitialized = true;
        ImGui::DockBuilderRemoveNode(dockspace_id);
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

    ImGui::DockSpaceOverViewport(dockspace_id, viewport, ImGuiDockNodeFlags_None);

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
    // FIX C2665/C2065: Cast ImTextureID pour Image
    ImGui::Image((ImTextureID)(intptr_t)tex, avail, ImVec2(0,1), ImVec2(1,0));
    // Debug overlay: show texture id and viewport size
    // FIX C349: Remplacement de l'addition d'ImVec2 par une addition manuelle
    ImVec2 windowPos = ImGui::GetWindowPos(); 
    ImGui::SetCursorScreenPos(ImVec2(windowPos.x + 8.0f, windowPos.y + 8.0f)); 
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
    
    // FIX C2039: Utilisation correcte de entt::registry::view
    if (m_Scene) {
        auto view = m_Scene->GetRegistry().view<TagComponent>();
        for (auto entityID : view) {
            Entity entity(entityID, m_Scene);
            auto& tag = entity.GetComponent<TagComponent>().Tag;
            bool isSelected = m_SelectedEntity == entityID;
            if (ImGui::Selectable(tag.c_str(), isSelected)) {
                m_SelectedEntity = entityID;
            }
            if (ImGui::IsItemClicked(ImGuiMouseButton_Right)) {
                // TODO: Context Menu
            }
        }
    }

    ImGui::End();
#endif
}

void EditorLayer::DrawContentBrowser() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowContentBrowser) return;
    ImGui::Begin("Content Browser");
    if (ImGui::Button("Refresh")) RefreshAssets(); // Ajout du bouton Refresh manquant
    ImGui::Separator();
    
    // Placeholder pour l'affichage en grille
    const float padding = 8.0f;
    const float thumbnailSize = 64.0f;
    float panelWidth = ImGui::GetContentRegionAvail().x;
    int columnCount = std::max(1, (int)(panelWidth / (thumbnailSize + padding)));
    ImGui::BeginChild("ContentBrowserChild", ImVec2(0, -ImGui::GetFrameHeightWithSpacing()), true);
    int index = 0;
    
    for (const auto& path : m_Assets) {
        if (index % columnCount != 0) ImGui::SameLine();

        std::filesystem::path p(path);
        std::string filename = p.filename().string();
        
        GLuint thumbnail = 0;
        if (m_ThumbnailCache.count(path)) {
            thumbnail = m_ThumbnailCache.at(path);
        }

        ImGui::PushID(path.c_str());
        
        // FIX C167, C413, C165: Utilisation de la signature moderne ImageButton
        if (thumbnail > 0) {
            // Utilise le nom de fichier comme ID string pour l'ImageButton,
            // combiné avec PushID(path) pour assurer l'unicité globale
            ImGui::ImageButton(filename.c_str(), (ImTextureID)(intptr_t)thumbnail, ImVec2(thumbnailSize, thumbnailSize));
        } else {
            ImGui::Button("Asset", ImVec2(thumbnailSize, thumbnailSize));
        }

        if (ImGui::IsItemHovered()) {
            ImGui::SetTooltip("%s", path.c_str());
        }

        if (ImGui::BeginDragDropSource(ImGuiDragDropFlags_None)) {
            // For dragging files into the viewport/outliner
            const char* item_path = path.c_str();
            // L'implémentation de la détection de type d'asset est manquante, on passe le chemin brut
            ImGui::SetDragDropPayload("ASSET_PATH", item_path, (strlen(item_path) + 1)); 
            ImGui::Text("Dragging %s", filename.c_str());
            ImGui::EndDragDropSource();
        }

        ImGui::TextWrapped("%s", filename.c_str());
        
        ImGui::PopID();
        index++;
    }
    ImGui::EndChild();
    
    ImGui::End();
#endif
}

void EditorLayer::DrawProperties() {
#ifdef PLUME_ENABLE_IMGUI
    if (!m_ShowProperties) return;
    ImGui::Begin("Properties");
    
    // FIX C2065/C2079: Composants maintenant inclus
    if (m_SelectedEntity != entt::null) {
        Entity entity(m_SelectedEntity, m_Scene);
        
        if (entity.HasComponent<TagComponent>()) {
            auto& tag = entity.GetComponent<TagComponent>().Tag;
            char buffer[256];
            strncpy(buffer, tag.c_str(), sizeof(buffer));
            buffer[sizeof(buffer)-1] = '\0';
            if (ImGui::InputText("Name", buffer, sizeof(buffer))) {
                tag = std::string(buffer);
            }
        }
        
        ImGui::Separator();
        
        // Draw Transform Component
        // FIX C2664: utilisation de glm::value_ptr pour DragFloat3
        if (entity.HasComponent<TransformComponent>()) {
            if (ImGui::CollapsingHeader("Transform", ImGuiTreeNodeFlags_DefaultOpen)) {
                auto& tc = entity.GetComponent<TransformComponent>();
                ImGui::DragFloat3("Translation", glm::value_ptr(tc.Translation), 0.1f);
                ImGui::DragFloat3("Rotation", glm::value_ptr(tc.Rotation), 0.01f);
                ImGui::DragFloat3("Scale", glm::value_ptr(tc.Scale), 0.01f);
            }
        }
        
        // Draw Light Component
        if (entity.HasComponent<LightComponent>()) {
            if (ImGui::CollapsingHeader("Light", ImGuiTreeNodeFlags_DefaultOpen)) {
                auto& lc = entity.GetComponent<LightComponent>();
                ImGui::ColorEdit3("Color", glm::value_ptr(lc.Color));
                ImGui::DragFloat("Intensity", &lc.Intensity, 0.1f, 0.0f, 10.0f);
            }
        }

        // Draw Model Component
        if (entity.HasComponent<ModelComponent>()) {
            if (ImGui::CollapsingHeader("Model", ImGuiTreeNodeFlags_DefaultOpen)) {
                auto& mc = entity.GetComponent<ModelComponent>();
                ImGui::Text("Mesh Count: %zu", mc.model->GetMeshes().size());
            }
        }
        
    } else {
        ImGui::Text("No entity selected.");
    }
    
    ImGui::End();
#endif
}

void EditorLayer::OnImGuiRender() {
#ifdef PLUME_ENABLE_IMGUI
    // Full screen dockspace setup
    DrawDockspace();
    
    // Panels
    DrawViewport();
    DrawOutliner();
    DrawContentBrowser();
    DrawProperties();

    // Removed temporary demo and debug logging

    // Debug / Info Windows (e.g. About)
    // NOTE: Input::Is... est retiré d'ici car Input n'est pas statique
#endif
}