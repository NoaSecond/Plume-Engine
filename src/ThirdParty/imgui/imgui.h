// dear imgui, v1.92.4
// (headers)
// See docs and repo: https://github.com/ocornut/imgui

#pragma once

// Configuration file with compile-time options
// (edit imconfig.h or '#define IMGUI_USER_CONFIG "myfilename.h" from your build system)
#ifdef IMGUI_USER_CONFIG
#include IMGUI_USER_CONFIG
#endif
#include "imconfig.h"

#ifndef IMGUI_DISABLE

//-----------------------------------------------------------------------------
// [SECTION] Header mess
//-----------------------------------------------------------------------------

// Includes
#include <float.h>                  // FLT_MIN, FLT_MAX
#include <stdarg.h>                 // va_list, va_start, va_end
#include <stddef.h>                 // ptrdiff_t, NULL
#include <string.h>                // memset, memmove, memcpy, strlen, strchr, strcpy, strcmp

// Define attributes of all API symbols declarations (e.g. for DLL under Windows)
// IMGUI_API is used for core imgui functions, IMGUI_IMPL_API is used for the default
// backends files (imgui_impl_xxx.h)
#ifndef IMGUI_API
#define IMGUI_API
#endif
#ifndef IMGUI_IMPL_API
#define IMGUI_IMPL_API IMGUI_API
#endif

// Helper Macros
#ifndef IM_ASSERT
#include <assert.h>
#define IM_ASSERT(_EXPR)            assert(_EXPR)                               // You can override the default assert handler by editing imconfig.h
#endif
#define IM_ARRAYSIZE(_ARR)          ((int)(sizeof(_ARR) / sizeof(*(_ARR))))     // Size of a static C-style array. Don't use on pointers!
#define IM_UNUSED(_VAR)            ((void)(_VAR))                              // Used to silence "unused variable" warnings.

// Check that version and structures layouts are matching between compiled imgui code and caller.
#define IMGUI_CHECKVERSION()        ImGui::DebugCheckVersionAndDataLayout(IMGUI_VERSION, sizeof(ImGuiIO), sizeof(ImGuiStyle), sizeof(ImVec2), sizeof(ImVec4), sizeof(ImDrawVert), sizeof(ImDrawIdx))

// Library Version
#define IMGUI_VERSION       "1.92.4"
#define IMGUI_VERSION_NUM   19240
#define IMGUI_HAS_TABLE             // Added BeginTable() - from IMGUI_VERSION_NUM >= 18000
#define IMGUI_HAS_TEXTURES          // Added ImGuiBackendFlags_RendererHasTextures - from IMGUI_VERSION_NUM >= 19198

// Forward declarations and basic types
struct ImVec2 { float x, y; ImVec2() { x = y = 0.0f; } ImVec2(float _x, float _y) { x = _x; y = _y; } };
struct ImVec4 { float x, y, z, w; ImVec4() { x = y = z = w = 0.0f; } ImVec4(float _x, float _y, float _z, float _w) { x = _x; y = _y; z = _z; w = _w; } };

typedef unsigned int ImGuiID;
typedef unsigned short ImDrawIdx;   // Default index type

// ImTextureID typedefs (opaque pointer or integer depending on backend)
typedef void* ImTextureID;

// Basic structs used by backends
struct ImDrawVert
{
    ImVec2 pos;
    ImVec2 uv;
    unsigned int col;
};

// Forward declarations
struct ImDrawList; struct ImDrawData; struct ImFont; struct ImFontAtlas; struct ImGuiIO; struct ImGuiStyle;
// Texture API forward declarations (used by some backends)
struct ImTextureData; enum ImTextureFormat; enum ImTextureStatus;

//-----------------------------------------------------------------------------
// [SECTION] Dear ImGui end-user API functions
//-----------------------------------------------------------------------------

namespace ImGui
{
    // Context creation and access
    IMGUI_API void          CreateContext(ImFontAtlas* shared_font_atlas = NULL);
    IMGUI_API void          DestroyContext();
    IMGUI_API void*         GetCurrentContext();
    IMGUI_API void          SetCurrentContext(void* ctx);

    // Main
    IMGUI_API ImGuiIO&      GetIO();
    IMGUI_API ImGuiStyle&   GetStyle();
    IMGUI_API void          NewFrame();
    IMGUI_API void          EndFrame();
    IMGUI_API void          Render();
    IMGUI_API ImDrawData*   GetDrawData();

    // Windows
    IMGUI_API bool          Begin(const char* name, bool* p_open = NULL, int flags = 0);
    IMGUI_API void          End();

    // Widgets
    IMGUI_API void          Text(const char* fmt, ...);
    IMGUI_API void          Image(ImTextureID user_texture_id, const ImVec2& size, const ImVec2& uv0 = ImVec2(0,0), const ImVec2& uv1 = ImVec2(1,1), const ImVec4& tint_col = ImVec4(1,1,1,1), const ImVec4& border_col = ImVec4(0,0,0,0));

    // Debug
    IMGUI_API const char*   GetVersion();

    // Misc
    IMGUI_API void          ShowDemoWindow(bool* p_open = NULL);
    IMGUI_API void          ShowMetricsWindow(bool* p_open = NULL);
}

#endif // IMGUI_DISABLE
