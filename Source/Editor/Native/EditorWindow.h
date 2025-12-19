#pragma once
#include "EditorContext.h"

class EditorWindow {
public:
    static bool CreateAppWindow(AppState& appState);
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    static void SetAppState(AppState* appState);
};
