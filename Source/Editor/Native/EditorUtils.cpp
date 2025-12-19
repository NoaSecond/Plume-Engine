#include "EditorUtils.h"
#include <Core/Engine.h>
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Rendering/Renderer.h>
#include <fstream>
#include <algorithm>
#include <shobjidl.h> 
#include <windows.h>

namespace Plume {
namespace EditorUtils {

    std::string path_to_utf8(const fs::path& p) {
        auto u8 = p.u8string();
        return std::string(reinterpret_cast<const char*>(u8.c_str()));
    }

    fs::path utf8_to_path(const std::string& s) {
#pragma warning(push)
#pragma warning(disable: 4996) 
        return fs::u8path(s);
#pragma warning(pop)
    }

    std::string sanitize_filename(const std::string& input) {
        std::string out;
        for (char c : input) {
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_') {
                out += c;
            }
        }
        if (out.empty()) out = "unnamed_asset";
        return out;
    }

    bool ProcessImportBuffer(const std::string& originalName, const char* data, size_t size, const fs::path& contentDir) {
        fs::path srcPath(utf8_to_path(originalName));
        std::string ext = path_to_utf8(srcPath.extension());
        std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c){ return (unsigned char)std::tolower(c); });
        
        std::string stem = path_to_utf8(srcPath.stem());
        std::string safeStem = sanitize_filename(stem);

        std::string type = "";
        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".tga" || ext == ".bmp" || ext == ".psd" || ext == ".hdr" || ext == ".pic") type = "Texture";
        else if (ext == ".wav" || ext == ".mp3" || ext == ".ogg") type = "SoundWave";
        else if (ext == ".fbx" || ext == ".obj" || ext == ".glb" || ext == ".gltf") type = "StaticMesh";

        if (!type.empty()) {
            std::string prefix = "";
            if (type == "Texture") prefix = "T_";
            else if (type == "SoundWave") prefix = "SW_";
            else if (type == "StaticMesh") prefix = "SM_";
            
            if (!prefix.empty()) {
                if (safeStem.size() < prefix.size() || safeStem.substr(0, prefix.size()) != prefix) {
                    safeStem = prefix + safeStem;
                }
            }

            fs::path dest = contentDir / utf8_to_path(safeStem + ".plumeasset");
            std::ofstream ofs(dest, std::ios::binary);
            if (ofs.is_open()) {
                ofs.write("PLAS", 4);
                uint32_t v = 1; ofs.write((char*)&v, 4);
                
                json meta; 
                meta["type"] = type;
                meta["original_ext"] = ext;
                
                std::string ms = meta.dump();
                uint32_t ml = (uint32_t)ms.size();
                ofs.write((char*)&ml, 4);
                ofs.write(ms.data(), ml);
                ofs.write(data, size);
                ofs.flush();
                ofs.close();
                return true;
            }
        } else {
            fs::path dest = contentDir / utf8_to_path(safeStem + ext);
            std::ofstream ofs(dest, std::ios::binary);
            if (ofs.is_open()) {
                ofs.write(data, size);
                ofs.close();
                return true;
            }
        }
        return false;
    }

    bool ProcessImportFile(const fs::path& src, const fs::path& contentDir) {
        if(!fs::exists(src)) return false;
        try {
            std::ifstream ifs(src, std::ios::binary | std::ios::ate);
            if (ifs.is_open()) {
                std::streamsize size = ifs.tellg();
                ifs.seekg(0, std::ios::beg);
                std::vector<char> buffer(size);
                if (ifs.read(buffer.data(), size)) {
                    return ProcessImportBuffer(path_to_utf8(src.filename()), buffer.data(), (size_t)size, contentDir);
                }
            }
        } catch(...) {}
        return false;
    }

    std::wstring utf8_to_wstr(const std::string& str) {
        if (str.empty()) return std::wstring();
        int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
        std::wstring wstrTo(size_needed, 0);
        MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
        return wstrTo;
    }

    std::string base64_decode(const std::string &in) {
        std::string out;
        std::vector<int> T(256, -1);
        for (int i = 0; i < 64; i++) T["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[i]] = i;

        int val = 0, valb = -8;
        for (unsigned char c : in) {
            if (T[c] == -1) break;
            val = (val << 6) + T[c];
            valb += 6;
            if (valb >= 0) {
                out.push_back(char((val >> valb) & 0xFF));
                valb -= 8;
            }
        }
        return out;
    }

    void sendResult(AppState* appState, bool success, const std::string& message, const json& data) {
        if (!appState->webview) return;
        json res;
        res["type"] = "result";
        res["success"] = success;
        res["message"] = message;
        if (!data.is_null()) res["data"] = data;
        std::string out = res.dump();
        std::wstring wides = utf8_to_wstr(out);
        appState->webview->PostWebMessageAsJson(wides.c_str());
    }

    json buildNode(const fs::path& p) {
        json it;
        std::string name = path_to_utf8(p.filename());
        std::string id = name + "_" + std::to_string(std::hash<std::string>{}(path_to_utf8(p)));
        
        std::string type = fs::is_directory(p) ? "folder" : "file";
        std::string pathStr = path_to_utf8(p);
        for (auto &c : pathStr) if (c == '\\') c = '/';
        
        it["id"] = id;
        it["name"] = name;
        it["path"] = pathStr;
        
        if (!fs::is_directory(p) && p.extension() == ".plumeasset") {
            try {
                std::ifstream ifs(p, std::ios::binary);
                if (ifs.is_open()) {
                    char magic[5] = {0};
                    ifs.read(magic, 4);
                    if (std::string(magic) == "PLAS") {
                        uint32_t ver = 0;
                        uint32_t len = 0;
                        ifs.read(reinterpret_cast<char*>(&ver), 4);
                        ifs.read(reinterpret_cast<char*>(&len), 4);
                        if (len > 0 && len < 10485760) {
                            std::string metaStr; 
                            metaStr.resize(len);
                            ifs.read(&metaStr[0], len);
                            json assetJson = json::parse(metaStr);
                            if (assetJson.contains("type")) type = assetJson["type"].get<std::string>();
                            it["meta"] = assetJson;
                        }
                    } else {
                        ifs.seekg(0);
                        json assetJson;
                        ifs >> assetJson;
                        if (assetJson.contains("type")) type = assetJson["type"].get<std::string>();
                        it["meta"] = assetJson;
                    }
                }
            } catch(...) {}
        } else if (fs::is_directory(p)) {
            it["type"] = "folder";
            try {
                fs::path meta = p / ".plume_meta";
                if (fs::exists(meta)) {
                    std::ifstream ifs(meta);
                    if (ifs.is_open()) {
                        json metaJson;
                        ifs >> metaJson;
                        it["meta"] = metaJson;
                    }
                }
            } catch(...) {}
        }
        
        it["type"] = type;
        return it;
    }

    json buildTree(const fs::path& p) {
        json node = buildNode(p);
        if (fs::is_directory(p)) {
            node["children"] = json::array();
            try {
                for (auto& c : fs::directory_iterator(p)) {
                    node["children"].push_back(buildTree(c.path()));
                }
            } catch(...) {}
        }
        return node;
    }

    void sendContentListFor(AppState* appState, const std::string& pathValue, bool recursive) {
        if (!appState->webview) return;

        fs::path base = fs::path(appState->uiFolder).parent_path();
        std::string rel = pathValue.empty() ? std::string("Content") : pathValue;
        fs::path target;
        
        if (rel.find("://") != std::string::npos) {
             target = utf8_to_path(rel);
        } else {
             target = base / utf8_to_path(rel);
        }

        json list = json::object();
        list["type"] = "content-list";
        list["path"] = rel;
        list["items"] = json::array();
        list["recursive"] = recursive;

        try {
            if (fs::exists(target) && fs::is_directory(target)) {
                if (recursive) {
                    for (auto& entry : fs::directory_iterator(target)) {
                        try {
                            list["items"].push_back(buildTree(entry.path()));
                        } catch(...) {}
                    }
                } else {
                    for (auto& entry : fs::directory_iterator(target)) {
                        try {
                            list["items"].push_back(buildNode(entry.path()));
                        } catch(...) {
                            json fallback;
                            fallback["id"] = "error_" + entry.path().filename().string();
                            fallback["name"] = entry.path().filename().string();
                            fallback["path"] = entry.path().string();
                            fallback["type"] = "file";
                            list["items"].push_back(fallback);
                        }
                    }
                }
            }
        } catch(...) {}

        std::string out = list.dump();
        std::wstring wides = utf8_to_wstr(out);
        appState->webview->PostWebMessageAsJson(wides.c_str());
    }

    void SaveEditorConfig(AppState* appState) {
        if (!appState || appState->uiFolder.empty()) return;
        try {
            fs::path uiFolderPath(appState->uiFolder);
            fs::path configPath = uiFolderPath.parent_path().parent_path() / "EditorConfig.ini";
            
            std::ofstream file(configPath);
            if (file.is_open()) {
                file << "[Editor]\n";
                file << "vsync=" << (appState->vsync ? "1" : "0") << "\n";
                file << "fps=" << (appState->showFPS ? "1" : "0") << "\n";
                file << "maxfps=" << appState->maxFPS << "\n";
                file << "theme=" << appState->theme << "\n";
            }
        } catch (...) {}
    }

    void ExportThemeData(AppState* appState) {
        if (!appState || appState->uiFolder.empty()) return;

        // Path finding logic for Assets folder
        fs::path exePath = fs::current_path();
        fs::path assetsPath = exePath / ".." / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / "Assets";

        fs::path themeJsonPath = assetsPath / "Themes" / (appState->theme + ".json");
        json themeData;
        
        if (fs::exists(themeJsonPath)) {
            std::ifstream f(themeJsonPath);
            if (f.is_open()) {
                try { f >> themeData; } catch(...) {}
            }
        }

        // Fallback for minimalist splash/UI compatibility if JSON fails
        if (themeData.empty()) {
            themeData["name"] = appState->theme;
            std::string accentColor = "#4FC3F7";
            if (appState->theme == "nebula-midnight") accentColor = "#DA70D6";
            else if (appState->theme == "feather-light") accentColor = "#64B5F6";
            themeData["colors"]["accent"]["primary"] = accentColor;
        }

        std::string dataPath = appState->uiFolder + "/theme_data.js";
        std::string tempPath = dataPath + ".tmp";
        std::ofstream file(tempPath);
        if (file.is_open()) {
            file << "window.PLUME_THEME_DATA = " << themeData.dump() << ";";
            file.close();
            try {
                if (fs::exists(dataPath)) fs::remove(dataPath);
                fs::rename(tempPath, dataPath);
            } catch(...) {}
        }
    }

    void ExportThemeList(AppState* appState) {
        if (!appState || appState->uiFolder.empty()) return;

        fs::path exePath = fs::current_path();
        fs::path assetsPath = exePath / ".." / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / "Assets";

        fs::path themesPath = assetsPath / "Themes";
        json themeList = json::array();

        if (fs::exists(themesPath) && fs::is_directory(themesPath)) {
            for (auto& entry : fs::directory_iterator(themesPath)) {
                if (entry.path().extension() == ".json") {
                    try {
                        std::ifstream f(entry.path());
                        if (f.is_open()) {
                            json j;
                            f >> j;
                            if (j.contains("name")) {
                                json item;
                                item["name"] = j["name"];
                                item["displayName"] = j.value("displayName", j["name"].get<std::string>());
                                item["description"] = j.value("description", "");
                                if (j.contains("colors")) item["colors"] = j["colors"];
                                if (j.contains("shadows")) item["shadows"] = j["shadows"];
                                if (j.contains("borderRadius")) item["borderRadius"] = j["borderRadius"];
                                themeList.push_back(item);
                            }
                        }
                    } catch(...) {}
                }
            }
        }

        std::string dataPath = appState->uiFolder + "/theme_list.js";
        std::string tempPath = dataPath + ".tmp";
        std::ofstream file(tempPath);
        if (file.is_open()) {
            file << "window.PLUME_THEME_LIST = " << themeList.dump() << ";";
            file.close();
            try {
                if (fs::exists(dataPath)) fs::remove(dataPath);
                fs::rename(tempPath, dataPath);
            } catch(...) {}
        }
    }

    json LoadThemeJson(const std::string& themeName) {
        fs::path exePath = fs::current_path();
        fs::path assetsPath = exePath / ".." / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / ".." / "Assets";
        if (!fs::exists(assetsPath)) assetsPath = exePath / "Assets";

        fs::path themeJsonPath = assetsPath / "Themes" / (themeName + ".json");
        json themeData;
        if (fs::exists(themeJsonPath)) {
            std::ifstream f(themeJsonPath);
            if (f.is_open()) {
                try { f >> themeData; } catch(...) {}
            }
        }
        return themeData;
    }

}
}
