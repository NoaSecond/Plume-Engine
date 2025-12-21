#include "EditorCommand.h"
#include "EditorUtils.h"
#include <Core/Engine.h>
#include <Core/PluginManager.h>
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Rendering/Renderer.h>
#include <windows.h>
#include <shobjidl.h> 
#include <shellapi.h>
#include <commdlg.h>
#include <mutex>
#include <set>
#include <fstream>
#include <iterator>

using namespace Plume::EditorUtils;

// --- Window Commands ---
class MinimizeCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { ShowWindow(appState.hwnd, SW_MINIMIZE); } };
class MaximizeCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { ShowWindow(appState.hwnd, IsZoomed(appState.hwnd) ? SW_RESTORE : SW_MAXIMIZE); } };
class CloseCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { appState.shouldClose = true; DestroyWindow(appState.hwnd); } };
class StartDragCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { ReleaseCapture(); SendMessage(appState.hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0); } };

// --- Config Commands ---
class SetMaxFPSCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { int fps = payload.value("value", 60); appState.maxFPS = fps; if (appState.engine) appState.engine->SetMaxFPS(fps); SaveEditorConfig(&appState); }};
class SetVSyncCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { bool v = payload.value("value", true); appState.vsync = v; if (appState.engine) appState.engine->SetVSync(v); SaveEditorConfig(&appState); }};
class SetRenderingEnabledCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { appState.isRenderingEnabled = payload.value("enabled", true); }};

class DOMReadyCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        try {
            json out; out["action"] = "ui_config"; out["uiConfig"] = json::object();
            out["uiConfig"]["showFPS"] = appState.showFPS ? 1 : 0;
            out["uiConfig"]["vsync"] = appState.vsync ? 1 : 0;
            out["uiConfig"]["maxFPS"] = appState.maxFPS;
            std::string s = out.dump(); std::wstring w = utf8_to_wstr(s);
            if (appState.webview) appState.webview->PostWebMessageAsJson(w.c_str());
        } catch(...) {}
    }
};

class ViewportBoundsCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        appState.viewportBounds.x = payload.value("x", 0.0f);
        appState.viewportBounds.y = payload.value("y", 0.0f);
        appState.viewportBounds.width = payload.value("width", 800.0f);
        appState.viewportBounds.height = payload.value("height", 600.0f);
        RECT clientRect; GetClientRect(appState.hwnd, &clientRect);
        int clientHeight = clientRect.bottom - clientRect.top;
        int clientWidth = clientRect.right - clientRect.left;
        UINT dpi = 96; HMODULE user32 = GetModuleHandleA("user32.dll");
        if (user32) {
            typedef UINT(WINAPI *PFN_GetDpiForWindow)(HWND);
            PFN_GetDpiForWindow pGetDpiForWindow = (PFN_GetDpiForWindow)GetProcAddress(user32, "GetDpiForWindow");
            if (pGetDpiForWindow) dpi = pGetDpiForWindow(appState.hwnd);
            else { HDC dc=GetDC(NULL); if(dc){dpi=GetDeviceCaps(dc,LOGPIXELSX);ReleaseDC(NULL,dc);} }
        }
        float scale = (float)dpi / 96.0f;
        int vpX = (int)round(appState.viewportBounds.x * scale);
        int vpY = (int)round(appState.viewportBounds.y * scale);
        int vpW = (int)round(appState.viewportBounds.width * scale);
        int vpH = (int)round(appState.viewportBounds.height * scale);
        int glY = clientHeight - vpY - vpH;
        if (appState.engine && appState.engine->GetRenderer()) {
            auto swap = appState.engine->GetRenderer()->GetSwapChain();
            if (swap && (swap->GetWidth()!=(uint32_t)clientWidth || swap->GetHeight()!=(uint32_t)clientHeight)) swap->Resize((uint32_t)clientWidth, (uint32_t)clientHeight);
            if (appState.engine->GetRendererObject()) appState.engine->GetRendererObject()->SetViewportRegion(vpX, glY, vpW, vpH);
        }
    }
};

class PreviewViewportBoundsCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        appState.previewViewportBounds.x = payload.value("x", 0.0f);
        appState.previewViewportBounds.y = payload.value("y", 0.0f);
        appState.previewViewportBounds.width = payload.value("width", 300.0f);
        appState.previewViewportBounds.height = payload.value("height", 300.0f);
        
        // Similar calculation for GL coordinates
        RECT clientRect; GetClientRect(appState.hwnd, &clientRect);
        int clientHeight = clientRect.bottom - clientRect.top;
        
        UINT dpi = 96; HMODULE user32 = GetModuleHandleA("user32.dll");
        if (user32) {
            typedef UINT(WINAPI *PFN_GetDpiForWindow)(HWND);
            PFN_GetDpiForWindow pGetDpiForWindow = (PFN_GetDpiForWindow)GetProcAddress(user32, "GetDpiForWindow");
            if (pGetDpiForWindow) dpi = pGetDpiForWindow(appState.hwnd);
            else { HDC dc=GetDC(NULL); if(dc){dpi=GetDeviceCaps(dc,LOGPIXELSX);ReleaseDC(NULL,dc);} }
        }
        float scale = (float)dpi / 96.0f;
        
        int vpX = (int)round(appState.previewViewportBounds.x * scale);
        int vpY = (int)round(appState.previewViewportBounds.y * scale);
        int vpW = (int)round(appState.previewViewportBounds.width * scale);
        int vpH = (int)round(appState.previewViewportBounds.height * scale);
        int glY = clientHeight - vpY - vpH;
        
        if (appState.engine && appState.engine->GetRendererObject()) {
            appState.engine->GetRendererObject()->SetPreviewViewportRegion(vpX, glY, vpW, vpH);
        }
    }
};

// --- Camera Commands ---
class SetCameraModeCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { if (appState.engine) appState.engine->SetCameraMode(payload.value("mode", 0)); }};
class ViewportPointerCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        if (!appState.engine) return; std::string type = payload.value("type", "");
        if (type == "move") appState.engine->RotateCamera({-payload.value("dy", 0.f)*0.15f, -payload.value("dx", 0.f)*0.15f, 0});
        else if (type == "wheel") appState.engine->TranslateCameraLocal({0,0,(payload.value("delta",0.f)>0?0.5f:-0.5f)}, true);
    }
};
class CameraRotateCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { if (appState.engine) appState.engine->RotateCamera({payload.value("deltaX", 0.0f), payload.value("deltaY", 0.0f), 0.0f}); }};
class CameraInputCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        if (!appState.engine) return; auto keys = payload.value("keys", std::vector<std::string>());
        std::lock_guard<std::mutex> lk(appState.keysMutex); appState.pressedKeys.clear(); for (const auto& k : keys) appState.pressedKeys.insert(k);
    }
};

// --- Asset Commands ---
class PreviewAssetCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string assetPath = payload.value("path", "");
        if (!assetPath.empty() && appState.engine) {
            fs::path base = fs::path(appState.uiFolder).parent_path();
            fs::path fullPath = base / assetPath; appState.engine->LoadPreviewAsset(fullPath.string());
        }
    }
};

class PreviewMaterialCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        if (!appState.engine) return;
        std::string vert = payload.value("vertex", "");
        std::string frag = payload.value("fragment", "");
        appState.engine->PreviewMaterial(vert, frag);
    }
};

class RestoreMainSceneCommand : public EditorCommand { void Execute(AppState& appState, const nlohmann::json& payload) override { if (appState.engine) appState.engine->StopPreview(); }};
class LoadAssetCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string assetId = payload.value("assetId", ""); if (assetId.find("asset://") == 0) assetId = assetId.substr(8);
        if (!assetId.empty()) {
            fs::path fullPath = fs::path(appState.uiFolder).parent_path() / assetId;
            std::string content = "";
            if (fs::exists(fullPath)) {
                try {
                    std::ifstream ifs(fullPath, std::ios::binary);
                    if (ifs.is_open()) {
                        char magic[5]={0}; ifs.read(magic,4);
                        if(std::string(magic)=="PLAS") {
                            uint32_t v; ifs.read((char*)&v,4); uint32_t l; ifs.read((char*)&l,4); ifs.seekg(l, std::ios::cur);
                            std::vector<char> b((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>()); content.assign(b.begin(), b.end());
                        }
                    }
                } catch(...){}
            }
            json out; out["action"]="asset-data"; out["assetId"]=assetId; out["content"]=content;
            std::string s=out.dump(); std::wstring w = utf8_to_wstr(s); if(appState.webview) appState.webview->PostWebMessageAsJson(w.c_str());
        }
    }
};
class SaveAssetCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string assetId = payload.value("assetId", ""); std::string content = payload.value("content", "");
        if (assetId.find("asset://") == 0) assetId = assetId.substr(8);
        if (!assetId.empty()) {
            fs::path fullPath = fs::path(appState.uiFolder).parent_path() / assetId;
            try {
               if(fullPath.has_parent_path()) fs::create_directories(fullPath.parent_path());
               std::ofstream ofs(fullPath, std::ios::binary);
               if(ofs.is_open()) {
                   ofs.write("PLAS",4); uint32_t v=1; ofs.write((char*)&v,4);
                   json meta; meta["type"]=payload.value("type", "Material"); std::string ms=meta.dump(); uint32_t ml=(uint32_t)ms.size();
                   ofs.write((char*)&ml,4); ofs.write(ms.data(),ml); ofs.write(content.data(), content.size());
                   sendResult(&appState,true,"Saved");
               } else sendResult(&appState,false,"Failed write");
            } catch(...) { sendResult(&appState,false,"Exception"); }
        }
    }
};

// --- Content Browser Commands ---
class ListContentCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string pathVal = payload.value("path", ""); bool recursive = payload.value("recursive", false);
        if ((pathVal.empty() || pathVal == "Content") && recursive) {
             fs::path base = fs::path(appState.uiFolder).parent_path();
             fs::path contentPath = base / "Content";
             json list = json::object(); list["type"] = "content-list"; list["path"] = "Content"; list["items"] = json::array(); list["recursive"] = true;
             if (fs::exists(contentPath)) { json rootNode = buildTree(contentPath); rootNode["id"] = "root_content"; list["items"].push_back(rootNode); }
             std::string out = list.dump(); std::wstring wides = utf8_to_wstr(out); if (appState.webview) appState.webview->PostWebMessageAsJson(wides.c_str());
        } else sendContentListFor(&appState, pathVal.empty() ? "Content" : pathVal, recursive);
    }
};
class DeleteCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string path = payload.value("path", ""); bool ok = false;
        try { fs::remove_all(fs::path(appState.uiFolder).parent_path() / path); ok=true; } catch(...) {}
        sendResult(&appState, ok, ok?"Deleted":"Failed");
        if(!path.empty()) sendContentListFor(&appState, fs::path(path).parent_path().string()); else sendContentListFor(&appState, "Content");
    }
};
class CreateFolderCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string name = payload.value("name", ""), path = payload.value("path", ""); bool ok = false;
        try { 
            fs::path base = fs::path(appState.uiFolder).parent_path();
            fs::path target = path.empty() ? (base/"Content") : (fs::path(path).is_absolute() ? fs::path(path) : base/path);
            fs::create_directories(target/name); ok=true; 
        } catch(...) {}
        sendResult(&appState, ok, ok?"Created":"Failed"); sendContentListFor(&appState, path.empty()?"Content":path);
    }
};
class RenameCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string path = payload.value("path", ""), newName = payload.value("newName", "");
        if (!path.empty() && !newName.empty()) {
            fs::path base = fs::path(appState.uiFolder).parent_path();
            fs::path source = base / path; fs::path dest = source.parent_path() / newName;
            try { fs::rename(source, dest); sendResult(&appState, true, "Renamed"); sendContentListFor(&appState, fs::path(path).parent_path().string()); } catch(...) { sendResult(&appState, false, "Failed to rename"); }
        }
    }
};

// --- Import Command ---
class ImportFileCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string pathVal = payload.value("path", "");
        if (pathVal.empty()) pathVal = "Content";
        
        fs::path base = fs::path(appState.uiFolder).parent_path();
        fs::path targetDir = base / pathVal;
        
        if (!fs::exists(targetDir)) {
            try { fs::create_directories(targetDir); } catch(...) { sendResult(&appState, false, "Invalid target directory"); return; }
        }

        // Parse Filters from Frontend
        // Format for Windows: "Display Name\0*.ext;*.ext2\0Display Name 2\0*.ext3\0\0"
        std::vector<char> filterBuffer;
        auto filtersJson = payload.value("filters", json::array());
        int defaultIndex = 1;
        int currentIndex = 1;

        if (filtersJson.empty()) {
            std::string def = "All Files (*.*)"; 
            filterBuffer.insert(filterBuffer.end(), def.begin(), def.end());
            filterBuffer.push_back('\0');
            std::string pat = "*.*";
            filterBuffer.insert(filterBuffer.end(), pat.begin(), pat.end());
            filterBuffer.push_back('\0');
        } else {
            for (const auto& item : filtersJson) {
                std::string rawName = item.value("name", "Unknown");
                std::vector<std::string> exts = item.value("extensions", std::vector<std::string>());
                
                // Pattern (e.g. *.png;*.jpg)
                std::string patternString;
                for (size_t i = 0; i < exts.size(); ++i) {
                    patternString += exts[i];
                    if (i < exts.size() - 1) patternString += ";";
                }
                if (patternString.empty()) patternString = "*.*";

                // Heuristic: If we find "Supported Files", lock it as default.
                // If we find "All Files" and haven't locked "Supported Files" yet, set it.
                // To do this robustly without state across iterations, we'll just check names.
                
                if (rawName == "Supported Files") {
                    defaultIndex = currentIndex;
                }
                else if (rawName == "All Files" || patternString == "*.*") {
                    // Only switch to All Files if we are currently pointing to something that ISN'T Supported Files.
                    // But we can't easily check what defaultIndex *currently* points to name-wise.
                    // However, we know frontend sends Supported Files FIRST.
                    // So defaultIndex starts at 1. If Supported Files is present, it is at 1.
                    // If we see "All Files" later, we should NOT update defaultIndex if we want Supported Files.
                    
                    // So: Do NOTHING for All Files if we want Supported Files to win and Supported Files is first.
                    // But if Supported Files is NOT present, we might want All Files.
                    
                    // Current Implementation in TS: Supported Files is First.
                    // So defaultIndex = 1 is correct.
                    // We just need to stop All Files from overwriting it.
                }

                // Format Name: "Textures (*.png;*.jpg)"
                std::string displayName = rawName + " (" + patternString + ")";
                
                filterBuffer.insert(filterBuffer.end(), displayName.begin(), displayName.end());
                filterBuffer.push_back('\0');
                
                filterBuffer.insert(filterBuffer.end(), patternString.begin(), patternString.end());
                filterBuffer.push_back('\0');
                
                currentIndex++;
            }
        }
        filterBuffer.push_back('\0'); // Double null terminator

        // Open File Dialog
        OPENFILENAMEA ofn;
        char szFile[MAX_PATH] = { 0 };
        ZeroMemory(&ofn, sizeof(ofn));
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = appState.hwnd;
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = sizeof(szFile);
        ofn.lpstrFilter = filterBuffer.data();
        ofn.nFilterIndex = defaultIndex; // Use calculated default
        ofn.lpstrFileTitle = NULL;
        ofn.nMaxFileTitle = 0;
        ofn.lpstrInitialDir = NULL;
        ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;

        if (GetOpenFileNameA(&ofn) == TRUE) {
            fs::path sourcePath = szFile;
            std::string filename = sourcePath.filename().string();
            // fs::path destPath = targetDir / filename; // No longer needed for direct copy
            
            try {
                // Use ProcessImportFile to convert to .plumeasset if applicable
                bool success = ProcessImportFile(sourcePath, targetDir); 
                
                if (success) {
                    sendResult(&appState, true, "Imported " + filename);
                    sendContentListFor(&appState, pathVal); 
                } else {
                    sendResult(&appState, false, "Import failed (unknown format or file read error)");
                }
            } catch (const std::exception& e) {
                sendResult(&appState, false, std::string("Import failed: ") + e.what());
            }
        }
    }
};

class ImportFilesCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string pathVal = payload.value("path", "");
        if (pathVal.empty()) pathVal = "Content";
        fs::path base = fs::path(appState.uiFolder).parent_path();
        fs::path targetDir = base / pathVal;
        
        if (!fs::exists(targetDir)) {
             try { fs::create_directories(targetDir); } catch(...) {}
        }

        auto files = payload.value("files", json::array());
        int successCount = 0;
        
        for (const auto& f : files) {
            std::string p = f.value("path", "");
            if (!p.empty()) {
                 if (ProcessImportFile(fs::path(p), targetDir)) successCount++;
            }
        }
        
        if (successCount > 0) {
            sendResult(&appState, true, "Imported " + std::to_string(successCount) + " files");
            sendContentListFor(&appState, pathVal);
        } else {
            sendResult(&appState, false, "Failed to import files");
        }
    }
};

class ImportFileBlobCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string pathVal = payload.value("path", "");
        if (pathVal.empty()) pathVal = "Content";
        fs::path base = fs::path(appState.uiFolder).parent_path();
        fs::path targetDir = base / pathVal;
        
        std::string name = payload.value("name", "");
        std::string contentBase64 = payload.value("content", "");
        
        if (name.empty() || contentBase64.empty()) return;
        
        std::string decoded = base64_decode(contentBase64);
        bool success = ProcessImportBuffer(name, decoded.data(), decoded.size(), targetDir);
        
        if (success) {
             sendResult(&appState, true, "Imported " + name);
             sendContentListFor(&appState, pathVal);
        } else {
             sendResult(&appState, false, "Failed to import blob");
        }
    }
};

// --- Plugin Commands ---
class RefreshPluginCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string id = payload.value("id", ""); if (id.empty()) { sendResult(&appState, false, "No plugin ID provided"); return; }
        auto p = Plume::PluginManager::Get().GetPlugin(id); if (!p) { sendResult(&appState, false, "Plugin not found"); return; }
        p->Shutdown(); bool success = p->Initialize(); sendResult(&appState, success, success ? "Plugin refreshed" : "Failed to refresh plugin");
    }
};
class TogglePluginCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        std::string id = payload.value("id", ""); bool enabled = payload.value("enabled", false);
        Plume::PluginManager::Get().EnablePlugin(id, enabled);
        std::string out = "{\"type\":\"result\",\"action\":\"toggle-plugin\",\"id\":\"" + id + "\",\"enabled\":" + (enabled ? "true" : "false") + "}";
        std::wstring wides = utf8_to_wstr(out); if (appState.webview) appState.webview->PostWebMessageAsJson(wides.c_str());
    }
};
class GetPluginsCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        auto& pm = Plume::PluginManager::Get(); auto plugins = pm.GetAllPlugins(); json list = json::array();
        for (const auto& info : plugins) { json item; item["id"] = info.id; item["name"] = info.name; item["description"] = info.description; item["version"] = info.version; item["enabled"] = pm.IsPluginEnabled(info.id); list.push_back(item); }
        json res; res["action"] = "plugin-list"; res["plugins"] = list;
        std::string out = res.dump(); std::wstring wides = utf8_to_wstr(out); if (appState.webview) appState.webview->PostWebMessageAsJson(wides.c_str());
    }
};

class CameraPanCommand : public EditorCommand {
public:
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        if (!appState.engine || !appState.engine->GetActiveScene()) return;
        float dx = payload.value("dx", 0.0f);
        float dy = payload.value("dy", 0.0f);
        float panFactor = 0.02f; // Adjust pan sensitivity
        appState.engine->TranslateCameraLocal({ -dx * panFactor, dy * panFactor, 0.0f });
    }
};

class SetViewportViewCommand : public EditorCommand {
public:
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        if (!appState.engine || !appState.engine->GetActiveScene()) return;
        std::string view = payload.value("view", "Perspective");
        auto* scene = appState.engine->GetActiveScene();
        
        Plume::TransformComponent camTransform;
        if (!scene->GetCameraTransform(camTransform)) return;
        
        scene->SetRotationLocked(false);

        if (view == "Perspective") {
            scene->SetProjectionMode(Plume::Scene::ProjectionMode::Perspective);
        } else if (view == "Orthographic") {
            scene->SetProjectionMode(Plume::Scene::ProjectionMode::Orthographic);
            scene->SetOrthoSize(10.0f);
        } else {
            scene->SetProjectionMode(Plume::Scene::ProjectionMode::Orthographic);
            scene->SetOrthoSize(10.0f);
            scene->SetRotationLocked(true);
            
            if (view == "Top")         camTransform.Rotation = { -90.0f, 0.0f, 0.0f };
            else if (view == "Bottom") camTransform.Rotation = { 90.0f, 0.0f, 0.0f };
            else if (view == "Front")  camTransform.Rotation = { 0.0f, 0.0f, 0.0f };
            else if (view == "Back")   camTransform.Rotation = { 0.0f, 180.0f, 0.0f };
            else if (view == "Left")   camTransform.Rotation = { 0.0f, 90.0f, 0.0f };
            else if (view == "Right")  camTransform.Rotation = { 0.0f, -90.0f, 0.0f };
            
            scene->SetCameraTransform(camTransform);
        }
    }
};

class SetThemeCommand : public EditorCommand {
    void Execute(AppState& appState, const nlohmann::json& payload) override {
        appState.theme = payload.value("theme", "plume-dark");
        SaveEditorConfig(&appState);
        ExportThemeData(&appState);
        ExportThemeList(&appState);
        json themeData = LoadThemeJson(appState.theme);
        sendResult(&appState, true, "Theme updated", themeData);
    }
};

// --- Registration ---
struct CommandInitializer {
    CommandInitializer() {
        auto& reg = EditorActionRegistry::Get();
        reg.RegisterCommand("minimize", std::make_unique<MinimizeCommand>());
        reg.RegisterCommand("maximize", std::make_unique<MaximizeCommand>());
        reg.RegisterCommand("close", std::make_unique<CloseCommand>());
        reg.RegisterCommand("start-drag", std::make_unique<StartDragCommand>());
        reg.RegisterCommand("set-maxfps", std::make_unique<SetMaxFPSCommand>());
        reg.RegisterCommand("set-vsync", std::make_unique<SetVSyncCommand>());
        reg.RegisterCommand("set-rendering-enabled", std::make_unique<SetRenderingEnabledCommand>());
        reg.RegisterCommand("plume_dom_ready", std::make_unique<DOMReadyCommand>());
        reg.RegisterCommand("plume_dom_heartbeat", std::make_unique<DOMReadyCommand>());
        reg.RegisterCommand("viewport-bounds", std::make_unique<ViewportBoundsCommand>());
        reg.RegisterCommand("preview-viewport-bounds", std::make_unique<PreviewViewportBoundsCommand>());
        reg.RegisterCommand("set-camera-mode", std::make_unique<SetCameraModeCommand>());
        reg.RegisterCommand("viewport-pointer", std::make_unique<ViewportPointerCommand>());
        reg.RegisterCommand("camera-rotate", std::make_unique<CameraRotateCommand>());
        reg.RegisterCommand("camera-pan", std::make_unique<CameraPanCommand>());
        reg.RegisterCommand("camera-input", std::make_unique<CameraInputCommand>());
        reg.RegisterCommand("camera-input", std::make_unique<CameraInputCommand>());
        reg.RegisterCommand("preview-asset", std::make_unique<PreviewAssetCommand>());
        reg.RegisterCommand("preview-material", std::make_unique<PreviewMaterialCommand>());
        reg.RegisterCommand("restore-main-scene", std::make_unique<RestoreMainSceneCommand>());
        reg.RegisterCommand("load-asset", std::make_unique<LoadAssetCommand>());
        reg.RegisterCommand("save-asset", std::make_unique<SaveAssetCommand>());
        reg.RegisterCommand("list-content", std::make_unique<ListContentCommand>());
        reg.RegisterCommand("delete", std::make_unique<DeleteCommand>());
        reg.RegisterCommand("create-folder", std::make_unique<CreateFolderCommand>());
        reg.RegisterCommand("rename", std::make_unique<RenameCommand>());
        reg.RegisterCommand("refresh-plugin", std::make_unique<RefreshPluginCommand>());
        reg.RegisterCommand("toggle-plugin", std::make_unique<TogglePluginCommand>());
        reg.RegisterCommand("get-plugins", std::make_unique<GetPluginsCommand>());
        reg.RegisterCommand("set-theme", std::make_unique<SetThemeCommand>());
        reg.RegisterCommand("set-viewport-view", std::make_unique<SetViewportViewCommand>());
        reg.RegisterCommand("import-file", std::make_unique<ImportFileCommand>());
        reg.RegisterCommand("import-files", std::make_unique<ImportFilesCommand>());
        reg.RegisterCommand("import-file-blob", std::make_unique<ImportFileBlobCommand>());
    }
};
static CommandInitializer g_CommandInitializer;
