#include "EditorActionHandler.h"
#include "EditorCommand.h"
#include "EditorUtils.h"

using json = nlohmann::json;

void EditorActionHandler::HandleMessage(AppState& appState, const std::string& message) {
    try {
        auto j = json::parse(message);
        std::string action = j.value("action", "");
        if (!action.empty()) {
            EditorActionRegistry::Get().Dispatch(action, appState, j);
        }
    } catch (...) {
        // Log error parsing message
    }
}
