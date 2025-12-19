#pragma once
#include "EditorContext.h"
#include <string>

class EditorActionHandler {
public:
    static void HandleMessage(AppState& appState, const std::string& messageJSON);
};
