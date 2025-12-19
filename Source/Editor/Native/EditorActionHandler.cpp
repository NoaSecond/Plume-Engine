#include "EditorActionHandler.h"
#include <Core/Engine.h>
#include <Core/PluginManager.h>
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Rendering/Renderer.h>
#include "ThirdParty/nlohmann_json.hpp"
#include <cmath>
#include <filesystem>
#include <fstream>
#include <shobjidl.h> 
#include <shellapi.h>
#include <commdlg.h>
#include <windows.h>
#include <sstream>

using json = nlohmann::json;
namespace fs = std::filesystem;

// Helper to convert UTF-8 to Wide String
static std::wstring utf8_to_wstr(const std::string& str) {
    if (str.empty()) return std::wstring();
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

// Helper for Base64 decoding
static std::string base64_decode(const std::string &in) {
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

static void sendResult(AppState* appState, bool success, const std::string& message, const json& data = nullptr) {
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

static json buildNode(const fs::path& p) {
    json it;
    std::string name = p.filename().string();
    std::string id = name + "_" + std::to_string(std::hash<std::string>{}(p.string()));
    
    std::string type = fs::is_directory(p) ? "folder" : "file";
    std::string pathStr = p.string();
    for (auto &c : pathStr) if (c == '\\') c = '/';
    
    it["id"] = id;
    it["name"] = name;
    it["path"] = pathStr;
    
    if (!fs::is_directory(p) && p.extension() == ".plumeasset") {
        try {
            std::ifstream ifs(p.string(), std::ios::binary);
            if (ifs.is_open()) {
                char magic[5] = {0};
                ifs.read(magic, 4);
                if (std::string(magic) == "PLAS") {
                    uint32_t ver = 0;
                    uint32_t len = 0;
                    ifs.read(reinterpret_cast<char*>(&ver), 4);
                    ifs.read(reinterpret_cast<char*>(&len), 4);
                    if (len > 0) {
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
                std::ifstream ifs(meta.string());
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

static json buildTree(const fs::path& p) {
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

static void sendContentListFor(AppState* appState, const std::string& pathValue, bool recursive = false) {
    if (!appState->webview) return;

    fs::path base = fs::path(appState->uiFolder).parent_path();
    std::string rel = pathValue.empty() ? std::string("Content") : pathValue;
    fs::path target;
    
    if (rel.find("://") != std::string::npos) {
         target = fs::path(rel);
    } else {
         target = base / rel;
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
                    list["items"].push_back(buildTree(entry.path()));
                }
            } else {
                for (auto& entry : fs::directory_iterator(target)) {
                    list["items"].push_back(buildNode(entry.path()));
                }
            }
        }
    } catch(...) {}

    std::string out = list.dump();
    std::wstring wides = utf8_to_wstr(out);
    appState->webview->PostWebMessageAsJson(wides.c_str());

}

static void SaveEditorConfig(AppState* appState) {
    if (!appState || appState->uiFolder.empty()) return;
    try {
        fs::path uiFolderPath(appState->uiFolder);
        // Default to saving in the root project folder (parent of parent of UI) assuming standard layout
        fs::path configPath = uiFolderPath.parent_path().parent_path() / "EditorConfig.ini";
        
        std::ofstream file(configPath);
        if (file.is_open()) {
            file << "[Editor]\n";
            file << "vsync=" << (appState->vsync ? "1" : "0") << "\n";
            file << "fps=" << (appState->showFPS ? "1" : "0") << "\n";
            file << "maxfps=" << appState->maxFPS << "\n";
        }
    } catch (...) {}
}


void EditorActionHandler::HandleMessage(AppState& appStateRef, const std::string& message) {
    AppState* appState = &appStateRef;
    try {
        auto j = json::parse(message);
        std::string action = j["action"];

        if (action == "plume_dom_ready" || action == "plume_dom_heartbeat") {
            try {
                json out;
                out["action"] = "ui_config";
                out["uiConfig"] = json::object();
                out["uiConfig"]["showFPS"] = appState->showFPS ? 1 : 0;
                out["uiConfig"]["vsync"] = appState->vsync ? 1 : 0;
                out["uiConfig"]["maxFPS"] = appState->maxFPS;
                std::string s = out.dump();
                std::wstring w = utf8_to_wstr(s);
                if (appState->webview) appState->webview->PostWebMessageAsJson(w.c_str());
            } catch(...) {}
            return;
        }

        if (action == "start-drag") {
            ReleaseCapture();
            SendMessage(appState->hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
            return;
        }
        if (action == "minimize") { ShowWindow(appState->hwnd, SW_MINIMIZE); return; }
        if (action == "maximize") { 
            ShowWindow(appState->hwnd, IsZoomed(appState->hwnd) ? SW_RESTORE : SW_MAXIMIZE); 
            return; 
        }
        if (action == "close") { 
            appState->shouldClose = true; 
            DestroyWindow(appState->hwnd); 
            return; 
        }

        if (action == "set-maxfps") {
            int fps = j.value("value", 60);
            appState->maxFPS = fps;
            if (appState->engine) appState->engine->SetMaxFPS(fps);
            appState->maxFPS = fps;
            if (appState->engine) appState->engine->SetMaxFPS(fps);
            SaveEditorConfig(appState);
            return;
        }

        if (action == "set-rendering-enabled") {
            bool enabled = j.value("enabled", true);
            appState->isRenderingEnabled = enabled;
            return;
        }

        if (action == "preview-asset") {
            std::string assetPath = j.value("path", "");
            if (!assetPath.empty() && appState->engine) {
                fs::path base = fs::path(appState->uiFolder).parent_path();
                fs::path fullPath = base / assetPath;
                appState->engine->LoadPreviewAsset(fullPath.string());
            }
            return;
        }

        if (action == "restore-main-scene") {
            if (appState->engine) appState->engine->StopPreview();
            return;
        }

        if (action == "set-vsync") {
            bool v = j.value("value", true);
            appState->vsync = v;
            if (appState->engine) appState->engine->SetVSync(v);
            appState->vsync = v;
            if (appState->engine) appState->engine->SetVSync(v);
            SaveEditorConfig(appState);
            return;
        }

        if (action == "refresh-plugin") {
            std::string id = j.value("id", "");
            if (id.empty()) { sendResult(appState, false, "No plugin ID provided"); return; }
            auto p = Plume::PluginManager::Get().GetPlugin(id);
            if (!p) { sendResult(appState, false, "Plugin not found"); return; }
            p->Shutdown();
            bool success = p->Initialize();
            sendResult(appState, success, success ? "Plugin refreshed" : "Failed to refresh plugin");
            return;
        }

        if (action == "toggle-plugin") {
            std::string id = j.value("id", "");
            bool enabled = j.value("enabled", false);
            Plume::PluginManager::Get().EnablePlugin(id, enabled);
            std::string out = "{\"type\":\"result\",\"action\":\"toggle-plugin\",\"id\":\"" + id + "\",\"enabled\":" + (enabled ? "true" : "false") + "}";
            std::wstring wides = utf8_to_wstr(out);
            if (appState->webview) appState->webview->PostWebMessageAsJson(wides.c_str());
            return;
        }

        if (action == "get-plugins") {
            auto& pm = Plume::PluginManager::Get();
            auto plugins = pm.GetAllPlugins();
            json list = json::array();
            for (const auto& info : plugins) {
                json item;
                item["id"] = info.id;
                item["name"] = info.name;
                item["description"] = info.description;
                item["version"] = info.version;
                item["enabled"] = pm.IsPluginEnabled(info.id);
                list.push_back(item);
            }
            json res;
            res["action"] = "plugin-list";
            res["plugins"] = list;
            std::string out = res.dump();
            std::wstring wides = utf8_to_wstr(out);
            if (appState->webview) appState->webview->PostWebMessageAsJson(wides.c_str());
            return;
        }

        // Viewport bounds
        if (action == "viewport-bounds") {
            // ... (keeping implementation concise for write tool)
            appState->viewportBounds.x = j.value("x", 0.0f);
            appState->viewportBounds.y = j.value("y", 0.0f);
            appState->viewportBounds.width = j.value("width", 800.0f);
            appState->viewportBounds.height = j.value("height", 600.0f);
            
            RECT clientRect; GetClientRect(appState->hwnd, &clientRect);
            int clientHeight = clientRect.bottom - clientRect.top;
            int clientWidth = clientRect.right - clientRect.left;
            
            UINT dpi = 96;
            HMODULE user32 = GetModuleHandleA("user32.dll");
            if (user32) {
                typedef UINT(WINAPI *PFN_GetDpiForWindow)(HWND);
                PFN_GetDpiForWindow pGetDpiForWindow = (PFN_GetDpiForWindow)GetProcAddress(user32, "GetDpiForWindow");
                if (pGetDpiForWindow) dpi = pGetDpiForWindow(appState->hwnd);
                else { HDC dc=GetDC(NULL); if(dc){dpi=GetDeviceCaps(dc,LOGPIXELSX);ReleaseDC(NULL,dc);} }
            }
            float scale = (float)dpi / 96.0f;
            
            int vpX = (int)round(appState->viewportBounds.x * scale);
            int vpY = (int)round(appState->viewportBounds.y * scale);
            int vpW = (int)round(appState->viewportBounds.width * scale);
            int vpH = (int)round(appState->viewportBounds.height * scale);
            int glY = clientHeight - vpY - vpH;
            
            if (appState->engine && appState->engine->GetRenderer()) {
                auto swap = appState->engine->GetRenderer()->GetSwapChain();
                if (swap && (swap->GetWidth()!=(uint32_t)clientWidth || swap->GetHeight()!=(uint32_t)clientHeight)) swap->Resize((uint32_t)clientWidth, (uint32_t)clientHeight);
                if (appState->engine->GetRendererObject()) appState->engine->GetRendererObject()->SetViewportRegion(vpX, glY, vpW, vpH);
            }
            return;
        }

        // Viewport input
        if (action == "viewport-pointer") {
             std::string type = j.value("type", std::string());
             if (appState->engine) {
                 if (type == "move") {
                     appState->engine->RotateCamera({-j.value("dy", 0.f)*0.15f, -j.value("dx", 0.f)*0.15f, 0});
                 } else if (type == "wheel") {
                     appState->engine->TranslateCameraLocal({0,0,(j.value("delta",0.f)>0?0.5f:-0.5f)}, true);
                 }
             }
             return;
        }
        if (action == "viewport-key") {
             std::string k = j.value("key", std::string());
             if (appState->engine && j.value("type", std::string()) == "down") {
                 Plume::Vec3 d{0,0,0};
                 if (k=="ArrowUp") d.z-=0.2f; else if (k=="ArrowDown") d.z+=0.2f;
                 else if (k=="ArrowLeft") d.x-=0.2f; else if (k=="ArrowRight") d.x+=0.2f;
                 else if (k=="q"||k=="Q") d.y-=0.2f; else if (k=="e"||k=="E") d.y+=0.2f;
                 if(d.x!=0||d.y!=0||d.z!=0) appState->engine->TranslateCameraLocal(d, true);
             }
             return;
        }
        if (action == "camera-rotate") {
             if (appState->engine) {
                 float dX = j.value("deltaX", 0.0f);
                 float dY = j.value("deltaY", 0.0f);
                 appState->engine->RotateCamera({dX, dY, 0.0f});
             }
             return;
        }

        if (action == "camera-mouse") {
             // Currently just acknowledging the state change, could be used for capturing inputs if needed by Engine
             // std::string btn = j.value("button", "");
             // std::string state = j.value("state", "");
             return;
        }

        if (action == "set-camera-mode") {
             if (appState->engine) {
                 int mode = j.value("mode", 0);
                 appState->engine->SetCameraMode(mode);
             }
             return;
        }

        if (action == "camera-input") {
             if (appState->engine) {
                 auto keys = j.value("keys", std::vector<std::string>());
                 std::lock_guard<std::mutex> lk(appState->keysMutex);
                 appState->pressedKeys.clear();
                 for (const auto& k : keys) appState->pressedKeys.insert(k);
             }
             return;
        }

        // --- Content Browser & Files ---
        if (action == "list-content") {
            std::string pathVal = j.value("path", std::string());
            bool recursive = j.value("recursive", false);
            
            // Special case for Token Tree Root: If asking for "Content" recursively, we want the "Content" node itself as root.
            if ((pathVal.empty() || pathVal == "Content") && recursive) {
                 fs::path base = fs::path(appState->uiFolder).parent_path();
                 fs::path contentPath = base / "Content";
                 
                 json list = json::object();
                 list["type"] = "content-list";
                 list["path"] = "Content"; 
                 list["items"] = json::array();
                 list["recursive"] = true;
                 
                 if (fs::exists(contentPath)) {
                      json rootNode = buildTree(contentPath);
                      rootNode["id"] = "root_content"; // Force ID to match frontend's expected root ID for default expansion
                      list["items"].push_back(rootNode);
                 }
                 
                 std::string out = list.dump();
                 std::wstring wides = utf8_to_wstr(out);
                 if (appState->webview) appState->webview->PostWebMessageAsJson(wides.c_str());
            } else if (pathVal.empty()) {
                 // Empty path non-recursive (shouldn't happen often but fallback)
                 sendContentListFor(appState, "Content", false);
            } else {
                 sendContentListFor(appState, pathVal, recursive);
            }
            return;
        }
        if (action == "delete") {
            std::string path = j.value("path", std::string());
            bool ok = false;
            try { fs::remove_all(fs::path(appState->uiFolder).parent_path() / path); ok=true; } catch(...) {}
            sendResult(appState, ok, ok?"Deleted":"Failed");
            if(!path.empty()) sendContentListFor(appState, fs::path(path).parent_path().string());
            else sendContentListFor(appState, "Content");
            return;
        }
        if (action == "create-folder") {
            std::string name = j.value("name", std::string());
            std::string path = j.value("path", std::string());
            bool ok = false;
            try { 
                fs::path base = fs::path(appState->uiFolder).parent_path();
                fs::path target = path.empty() ? (base/"Content") : (fs::path(path).is_absolute() ? fs::path(path) : base/path);
                fs::create_directories(target/name); 
                ok=true; 
            } catch(...) {}
            sendResult(appState, ok, ok?"Created":"Failed");
            sendContentListFor(appState, path.empty()?"Content":path);
            return;
        }

        if (action == "duplicate") {
            std::string path = j.value("path", std::string());
            if (!path.empty()) {
                fs::path base = fs::path(appState->uiFolder).parent_path();
                fs::path source = base / path;
                if (fs::exists(source)) {
                    // Find a unique name
                    std::string stem = source.stem().string();
                    std::string ext = source.extension().string();
                    fs::path parent = source.parent_path();
                    int i = 1;
                    fs::path dest;
                    do {
                        dest = parent / (stem + "_Copy" + (i > 1 ? std::to_string(i) : "") + ext);
                        i++;
                    } while (fs::exists(dest));
                    
                    try {
                        if(fs::is_directory(source)) fs::copy(source, dest, fs::copy_options::recursive);
                        else fs::copy(source, dest);
                        sendResult(appState, true, "Duplicated");
                        sendContentListFor(appState, path.empty() ? "Content" : fs::path(path).parent_path().string());
                    } catch (...) { sendResult(appState, false, "Failed to duplicate"); }
                }
            }
            return;
        }

        if (action == "paste") {
            std::string sourcePath = j.value("sourcePath", std::string());
            std::string destPath = j.value("path", std::string());
            if (!sourcePath.empty()) {
                fs::path base = fs::path(appState->uiFolder).parent_path();
                fs::path source = base / sourcePath;
                fs::path destFolder = destPath.empty() ? (base/"Content") : (base/destPath);
                
                if (fs::exists(source) && fs::exists(destFolder) && fs::is_directory(destFolder)) {
                    fs::path dest = destFolder / source.filename();
                    // Handle collision if pasting into same folder or existing name
                    if (fs::exists(dest)) {
                        std::string stem = source.stem().string();
                        std::string ext = source.extension().string();
                        int i = 1;
                        do {
                            dest = destFolder / (stem + "_Copy" + (i > 1 ? std::to_string(i) : "") + ext);
                            i++;
                        } while (fs::exists(dest));
                    }

                    try {
                        if(fs::is_directory(source)) fs::copy(source, dest, fs::copy_options::recursive);
                        else fs::copy(source, dest);
                        sendResult(appState, true, "Pasted");
                        sendContentListFor(appState, destPath.empty()?"Content":destPath);
                    } catch (...) { sendResult(appState, false, "Failed to paste"); }
                }
            }
            return;
        }

        if (action == "rename") {
            std::string path = j.value("path", std::string());
            std::string newName = j.value("newName", std::string());
            if (!path.empty() && !newName.empty()) {
                fs::path base = fs::path(appState->uiFolder).parent_path();
                fs::path source = base / path;
                fs::path dest = source.parent_path() / newName;
                try {
                    fs::rename(source, dest);
                    sendResult(appState, true, "Renamed");
                    sendContentListFor(appState, fs::path(path).parent_path().string());
                } catch(...) { sendResult(appState, false, "Failed to rename"); }
            }
            return;
        }

        if (action == "open-in-explorer") {
            std::string path = j.value("path", std::string());
            fs::path base = fs::path(appState->uiFolder).parent_path();
            fs::path fullPath = base / path;
            ShellExecuteA(NULL, "open", fullPath.string().c_str(), NULL, NULL, SW_SHOW);
            return;
        }

        if (action == "change-color") {
            std::string path = j.value("path", std::string());
            std::string color = j.value("color", std::string());
             if(!path.empty()) {
                 fs::path base = fs::path(appState->uiFolder).parent_path();
                 fs::path target = base / path;
                 if(fs::exists(target) && fs::is_directory(target)) {
                     json meta;
                     fs::path metaPath = target / ".plume_meta";
                     try {
                         if(fs::exists(metaPath)) { std::ifstream i(metaPath); i >> meta; }
                         meta["color"] = color;
                         std::ofstream o(metaPath); o << meta.dump();
                         sendResult(appState, true, "Color changed");
                         sendContentListFor(appState, fs::path(path).parent_path().string());
                     } catch(...) {}
                 }
             }
             return;
        }
        if (action == "save-theme") {
            std::string dataPath = appState->uiFolder + "/theme_data.js";
            std::ofstream file(dataPath + ".tmp");
            if (file.is_open()) {
                file << "window.PLUME_THEME_DATA = {\"name\": \"" << j.value("name", "plume-dark") << "\",\"colors\": {\"accent\": {\"primary\": \"" << j.value("accent", "#4FC3F7") << "\"}}};";
                file.close();
                try { if(fs::exists(dataPath)) fs::remove(dataPath); fs::rename(dataPath+".tmp", dataPath); sendResult(appState,true,"Theme saved"); } catch(...) { sendResult(appState,false,"Failed save"); }
            }
            return;
        }
        if (action == "load-asset") {
            std::string assetId = j.value("assetId", std::string());
            if (assetId.find("asset://") == 0) assetId = assetId.substr(8);
            if (!assetId.empty()) {
                fs::path fullPath = fs::path(appState->uiFolder).parent_path() / assetId;
                std::string content = "";
                if (fs::exists(fullPath)) {
                    try {
                        std::ifstream ifs(fullPath, std::ios::binary);
                        if (ifs.is_open()) {
                            char magic[5]={0}; ifs.read(magic,4);
                            if(std::string(magic)=="PLAS") {
                                uint32_t v; ifs.read((char*)&v,4);
                                uint32_t l; ifs.read((char*)&l,4);
                                ifs.seekg(l, std::ios::cur);
                                std::vector<char> b((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>());
                                content.assign(b.begin(), b.end());
                            }
                        }
                    } catch(...){}
                }
                json out; out["action"]="asset-data"; out["assetId"]=assetId; out["content"]=content;
                std::string s=out.dump(); std::wstring w=utf8_to_wstr(s);
                if(appState->webview) appState->webview->PostWebMessageAsJson(w.c_str());
            }
            return;
        }
        if (action == "save-asset") {
            std::string assetId = j.value("assetId", std::string());
            std::string content = j.value("content", std::string());
            std::string type = j.value("type", "Material");
            if (assetId.find("asset://") == 0) assetId = assetId.substr(8);
            if (!assetId.empty()) {
                fs::path fullPath = fs::path(appState->uiFolder).parent_path() / assetId;
                try {
                   if(fullPath.has_parent_path()) fs::create_directories(fullPath.parent_path());
                   std::ofstream ofs(fullPath, std::ios::binary);
                   if(ofs.is_open()) {
                       ofs.write("PLAS",4); uint32_t v=1; ofs.write((char*)&v,4);
                       json meta; meta["type"]=type; std::string ms=meta.dump(); uint32_t ml=(uint32_t)ms.size();
                       ofs.write((char*)&ml,4); ofs.write(ms.data(),ml);
                       ofs.write(content.data(), content.size());
                       sendResult(appState,true,"Saved");
                   } else sendResult(appState,false,"Failed write");
                } catch(...) { sendResult(appState,false,"Exception"); }
            }
            return;
        }

        if (action == "import-file") {
            std::string path = j.value("path", std::string());
            OPENFILENAMEA ofn = {}; char szFile[2048]={0};
            ofn.lStructSize=sizeof(ofn); ofn.hwndOwner=appState->hwnd; ofn.lpstrFile=szFile; ofn.nMaxFile=sizeof(szFile);
            ofn.lpstrFilter="3D Models (*.fbx;*.obj;*.glb;*.gltf)\0*.fbx;*.obj;*.glb;*.gltf\0All Files (*.*)\0*.*\0";
            ofn.nFilterIndex=1; ofn.Flags=OFN_PATHMUSTEXIST|OFN_FILEMUSTEXIST|OFN_ALLOWMULTISELECT|OFN_EXPLORER;
            if(GetOpenFileNameA(&ofn)) {
                std::vector<std::string> files; std::string fn=szFile;
                if(ofn.nFileOffset > fn.length()) {
                     std::string dir=fn; char* p=szFile+ofn.nFileOffset;
                     while(*p){ files.push_back(dir+"\\"+p); p+=strlen(p)+1; }
                } else files.push_back(fn);
                
                fs::path contentDir = fs::path(appState->uiFolder).parent_path() / path;
                if(!fs::exists(contentDir)) fs::create_directories(contentDir);
                int count=0;
                for(const auto& f:files) {
                     try {
                         fs::path src(f); if(!fs::exists(src)) continue;
                         fs::copy_file(src, contentDir/src.filename(), fs::copy_options::overwrite_existing);
                         count++;
                     } catch(...){}
                }
                sendResult(appState,true,std::to_string(count)+" imported");
                sendContentListFor(appState,path);
            }
            return;
        }
        
    } catch (...) {}
}
