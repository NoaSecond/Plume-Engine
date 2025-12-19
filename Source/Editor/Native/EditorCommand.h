#pragma once
#include "EditorContext.h"
#include "../ThirdParty/nlohmann_json.hpp"
#include <map>
#include <string>
#include <memory>

class EditorCommand {
public:
    virtual ~EditorCommand() = default;
    virtual void Execute(AppState& appState, const nlohmann::json& payload) = 0;
};

class EditorActionRegistry {
public:
    static EditorActionRegistry& Get() {
        static EditorActionRegistry instance;
        return instance;
    }

    void RegisterCommand(const std::string& action, std::unique_ptr<EditorCommand> command) {
        m_Commands[action] = std::move(command);
    }

    void Dispatch(const std::string& action, AppState& appState, const nlohmann::json& payload) {
        auto it = m_Commands.find(action);
        if (it != m_Commands.end()) {
            it->second->Execute(appState, payload);
        }
    }

private:
    std::map<std::string, std::unique_ptr<EditorCommand>> m_Commands;
};
