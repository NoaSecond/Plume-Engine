// Dear ImGui OpenGL3 renderer backend (vendored)
#pragma once
#include "imgui.h" // IMGUI_IMPL_API
#ifndef IMGUI_DISABLE

IMGUI_IMPL_API bool    ImGui_ImplOpenGL3_Init(const char* glsl_version = nullptr);
IMGUI_IMPL_API void    ImGui_ImplOpenGL3_Shutdown();
IMGUI_IMPL_API void    ImGui_ImplOpenGL3_NewFrame();
IMGUI_IMPL_API void     ImGui_ImplOpenGL3_RenderDrawData(ImDrawData* draw_data);

// (Optional) Called by Init/NewFrame/Shutdown
IMGUI_IMPL_API bool    ImGui_ImplOpenGL3_CreateDeviceObjects();
IMGUI_IMPL_API void    ImGui_ImplOpenGL3_DestroyDeviceObjects();

// (Advanced) Use to control texture updates
IMGUI_IMPL_API void    ImGui_ImplOpenGL3_UpdateTexture(ImTextureData* tex);

#endif // #ifndef IMGUI_DISABLE
