#pragma once
#include "EditorContext.h"
#include "../ThirdParty/nlohmann_json.hpp"
#include <string>
#include <filesystem>

namespace Plume {
namespace EditorUtils {
    namespace fs = std::filesystem;
    using json = nlohmann::json;

    std::string path_to_utf8(const fs::path& p);
    fs::path utf8_to_path(const std::string& s);
    std::string sanitize_filename(const std::string& input);
    bool ProcessImportBuffer(const std::string& originalName, const char* data, size_t size, const fs::path& contentDir);
    bool ProcessImportFile(const fs::path& src, const fs::path& contentDir);
    std::wstring utf8_to_wstr(const std::string& str);
    std::string base64_decode(const std::string &in);
    void sendResult(AppState* appState, bool success, const std::string& message, const json& data = nullptr);
    json buildNode(const fs::path& p);
    json buildTree(const fs::path& p);
    void sendContentListFor(AppState* appState, const std::string& pathValue, bool recursive = false);
    void SaveEditorConfig(AppState* appState);
    void ExportThemeData(AppState* appState);
    void ExportThemeList(AppState* appState);
    json LoadThemeJson(const std::string& themeName);
}
}
