#pragma once
#include "EditorContext.h"
#include <string>

class WebViewManager {
public:
    static void InitWebView(AppState& appState, const std::string& htmlPath);
};
