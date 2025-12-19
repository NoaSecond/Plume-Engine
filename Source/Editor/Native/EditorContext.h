#pragma once
#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <wrl.h>
#include <string>
#include "WebView2.h"
#include <Core/Engine.h>
#include <mutex>
#include <set>

using namespace Microsoft::WRL;

struct AppState {
    HWND hwnd = nullptr;
    HWND viewport = nullptr;
    ComPtr<ICoreWebView2Controller> controller;
    ComPtr<ICoreWebView2> webview;
    ComPtr<ICoreWebView2Environment> env;
    Plume::Engine* engine = nullptr;
    std::string uiFolder;

    // WebView visibility toggle state
    bool webviewVisible = true;
    bool lastCtrlT = false;

    // Editor configuration loaded from EditorConfig.ini
    bool showFPS = false;
    bool vsync = true;
    int maxFPS = 144;
    std::string theme = "plume-dark";
    
    // Viewport State
    struct {
        float x = 0, y = 0, width = 800, height = 600;
    } viewportBounds;

    bool isRenderingEnabled = true;

    std::mutex keysMutex;
    std::set<std::string> pressedKeys;
    bool shouldClose = false;
};
