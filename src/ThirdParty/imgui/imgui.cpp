// Minimal stub of imgui.cpp to satisfy build when local vendored sources are used.
// This file intentionally implements a tiny subset used by the engine. For full
// ImGui functionality, vendor the upstream files using scripts/vendor_imgui.ps1.

#include "imgui.h"
#include <iostream>

namespace ImGui {

void CreateContext() { /* no-op stub */ }
void DestroyContext() { /* no-op stub */ }
void NewFrame() { /* no-op stub */ }
void Render() { /* no-op stub */ }
void EndFrame() { /* no-op stub */ }

bool Begin(const char* /*name*/, bool* /*p_open*/, int /*flags*/) { return true; }
void End() { }

void Text(const char* fmt, ...) {
    va_list args; va_start(args, fmt);
    vprintf(fmt, args);
    printf("\n");
    va_end(args);
}

void Image(void* /*tex_id*/, const ImVec2& /*size*/) { }

} // namespace ImGui
