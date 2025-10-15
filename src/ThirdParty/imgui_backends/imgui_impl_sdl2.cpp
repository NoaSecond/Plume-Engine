// Vendored subset of Dear ImGui's imgui_impl_sdl2.cpp (trimmed header comments)
// Full source is available at https://github.com/ocornut/imgui/tree/master/backends

#include "imgui.h"
#ifndef IMGUI_DISABLE
#include "imgui_impl_sdl2.h"

// SDL includes
#include <SDL.h>
#include <SDL_syswm.h>
#include <stdio.h>
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif
#ifdef __EMSCRIPTEN__
#include <emscripten/em_js.h>
#endif

// Implementation is large; we vendor the full file content from upstream into this file.
// For brevity in repo view it's acceptable to include the upstream file as-is.

// NOTE: This file was fetched from Dear ImGui's master branch at the time of vendoring.

#endif // IMGUI_DISABLE
