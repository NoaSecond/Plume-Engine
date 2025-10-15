// Dear ImGui SDL2 platform backend (vendored from https://github.com/ocornut/imgui)
#pragma once
#include "imgui.h" // IMGUI_IMPL_API
#ifndef IMGUI_DISABLE

struct SDL_Window;
struct SDL_Renderer;
struct _SDL_GameController;
typedef union SDL_Event SDL_Event;

IMGUI_IMPL_API bool    ImGui_ImplSDL2_InitForOpenGL(SDL_Window* window, void* sdl_gl_context);
IMGUI_IMPL_API bool    ImGui_ImplSDL2_InitForVulkan(SDL_Window* window);
IMGUI_IMPL_API bool    ImGui_ImplSDL2_InitForD3D(SDL_Window* window);
IMGUI_IMPL_API bool    ImGui_ImplSDL2_InitForMetal(SDL_Window* window);
IMGUI_IMPL_API bool     ImGui_ImplSDL2_InitForSDLRenderer(SDL_Window* window, SDL_Renderer* renderer);
IMGUI_IMPL_API bool    ImGui_ImplSDL2_InitForOther(SDL_Window* window);
IMGUI_IMPL_API void    ImGui_ImplSDL2_Shutdown();
IMGUI_IMPL_API void     ImGui_ImplSDL2_NewFrame();
IMGUI_IMPL_API bool    ImGui_ImplSDL2_ProcessEvent(const SDL_Event* event);

// DPI-related helpers (optional)
IMGUI_IMPL_API float    ImGui_ImplSDL2_GetContentScaleForWindow(SDL_Window* window);
IMGUI_IMPL_API float    ImGui_ImplSDL2_GetContentScaleForDisplay(int display_index);

// Gamepad selection automatically starts in AutoFirst mode.
enum ImGui_ImplSDL2_GamepadMode { ImGui_ImplSDL2_GamepadMode_AutoFirst, ImGui_ImplSDL2_GamepadMode_AutoAll, ImGui_ImplSDL2_GamepadMode_Manual };
IMGUI_IMPL_API void    ImGui_ImplSDL2_SetGamepadMode(ImGui_ImplSDL2_GamepadMode mode, struct _SDL_GameController** manual_gamepads_array = nullptr, int manual_gamepads_count = -1);

#endif // #ifndef IMGUI_DISABLE
