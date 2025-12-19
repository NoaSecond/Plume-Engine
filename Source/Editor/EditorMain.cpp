#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <shobjidl.h> 
#include <wrl.h>
#include <shellapi.h>

#include <Core/Engine.h>
#include <Core/PluginManager.h>
#include <Core/SceneSerializer.h>
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <string>
#include <filesystem>
#include <fstream>
#include <unordered_map>
#include <thread>
#include <chrono>
#include <iterator>
#include <cctype>
#include <algorithm>

#include "SplashScreen.h"
#include "resource.h"
#include "Version.h"

#include "Native/EditorContext.h"
#include "Native/EditorWindow.h"
#include "Native/WebViewManager.h"
#include "Native/EditorUtils.h"
#include "ThirdParty/nlohmann_json.hpp"

using namespace Microsoft::WRL;
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "comdlg32.lib")
#pragma comment(lib, "shlwapi.lib")
#endif

namespace fs = std::filesystem;

static AppState g_app;

// --- Export Functions (kept here for now or move to EditorDataExporter later) ---

void ExportSceneData() {
    if (!g_app.engine) return;
    
    Plume::SceneSerializer serializer(g_app.engine->GetMainScene());
    std::string sceneJson = serializer.SerializeToString();
    std::string dataPath = g_app.uiFolder + "/scene_data.js";
    std::string tempPath = dataPath + ".tmp";
    
    std::ofstream file(tempPath);
    if (file.is_open()) {
        file << "window.PLUME_SCENE_DATA = " << sceneJson << ";";
        file << "window.PLUME_LAST_UPDATE = " << std::chrono::system_clock::now().time_since_epoch().count() << ";";
        file.close();
        try {
            if (fs::exists(dataPath)) fs::remove(dataPath);
            fs::rename(tempPath, dataPath);
        } catch(...) {}
    }
}



void LoadConfigurations() {
    try {
        std::vector<fs::path> candidates;
        fs::path cwd = fs::current_path();
    #ifdef _WIN32
        char exeBuf[MAX_PATH]; exeBuf[0] = '\0';
        if (GetModuleFileNameA(NULL, exeBuf, MAX_PATH) > 0) {
            fs::path exePath = fs::path(std::string(exeBuf));
            fs::path exeDir = exePath.parent_path();
            candidates.push_back(exeDir / "EditorConfig.ini");
            candidates.push_back(exeDir.parent_path() / "EditorConfig.ini");
            candidates.push_back(exeDir.parent_path().parent_path() / "EditorConfig.ini");
        }
    #endif
        candidates.push_back(cwd / "EditorConfig.ini");
        candidates.push_back(cwd / ".." / "EditorConfig.ini");
        candidates.push_back(cwd / ".." / ".." / "EditorConfig.ini");
        if (!g_app.uiFolder.empty()) {
            fs::path uiFolderPath(g_app.uiFolder);
            candidates.push_back(uiFolderPath.parent_path().parent_path() / "EditorConfig.ini");
            candidates.push_back(uiFolderPath.parent_path() / "EditorConfig.ini");
        }

        auto trim = [](std::string s){ size_t a=0; while(a<s.size() && isspace((unsigned char)s[a])) a++; size_t b=s.size(); while(b>a && isspace((unsigned char)s[b-1])) b--; return s.substr(a,b-a); };

        for (const auto& cfg : candidates) {
            try {
                if (!fs::exists(cfg)) continue;
                std::ifstream ifs(cfg.string());
                if (!ifs.is_open()) continue;
                std::string line;
                bool inEditorSection = false;
                while (std::getline(ifs, line)) {
                    auto l = line;
                    while (!l.empty() && (l.back()=='\r' || l.back()=='\n' || l.back()==' ' || l.back()=='\t')) l.pop_back();
                    size_t p = 0; while (p < l.size() && (l[p]==' '||l[p]=='\t')) ++p; if (p>0) l = l.substr(p);
                    if (l.empty() || l[0] == ';' || l[0] == '#') continue;
                    if (l.size() >= 2 && l[0] == '[' && l.back() == ']') {
                        std::string sec = l.substr(1, l.size()-2);
                        inEditorSection = (sec == "Editor");
                        continue;
                    }
                    if (!inEditorSection) continue;
                    auto eq = l.find('='); if (eq == std::string::npos) continue;
                    std::string key = trim(l.substr(0, eq)); std::string val = trim(l.substr(eq+1));
                    if (_stricmp(key.c_str(), "fps") == 0) {
                        try { int v = std::stoi(val); g_app.showFPS = (v != 0); } catch(...) {}
                    } else if (_stricmp(key.c_str(), "vsync") == 0) {
                        try { int v = std::stoi(val); g_app.vsync = (v != 0); } catch(...) {}
                    } else if (_stricmp(key.c_str(), "maxfps") == 0) {
                        try { int v = std::stoi(val); g_app.maxFPS = v; } catch(...) {}
                    } else if (_stricmp(key.c_str(), "theme") == 0) {
                        g_app.theme = val;
                    }
                }
                ifs.close();
                break;
            } catch(...) { }
        }
    } catch(...) {}
}

void ExportRenderingData() {
    if (!g_app.engine) return;
    
    std::string apiName;
    auto api = g_app.engine->GetCurrentGraphicsAPI();
    switch(api) {
        case Plume::RHI::GraphicsAPI::Vulkan: apiName = "Vulkan"; break;
        case Plume::RHI::GraphicsAPI::DirectX12: apiName = "DirectX12"; break;
        case Plume::RHI::GraphicsAPI::OpenGL: apiName = "OpenGL"; break;
        case Plume::RHI::GraphicsAPI::Metal: apiName = "Metal"; break;
        default: apiName = "Unknown"; break;
    }
    
    Plume::Vec3 camPos{0,0,0};
    Plume::Vec3 camRot{0,0,0};
    if (g_app.engine->GetActiveScene()) {
        Plume::TransformComponent camTransform;
        if (g_app.engine->GetActiveScene()->GetCameraTransform(camTransform)) {
            camPos = camTransform.Position;
            camRot = camTransform.Rotation;
        }
    }
    
    std::string dataPath = g_app.uiFolder + "/rendering_data.js";
    std::string tempPath = dataPath + ".tmp";
    
    std::ofstream file(tempPath);
    if (file.is_open()) {
        float fps = g_app.engine->GetFPS();
        float ms = g_app.engine->GetFrameTimeMs();
        file << "window.PLUME_RENDERING_DATA = {";
        file << "\"graphicsAPI\": \"" << apiName << "\",";
        file << "\"fps\": " << fps << ",";
        file << "\"frameTimeMs\": " << ms << ",";
        file << "\"uiConfig\": {";
        file << "\"showFPS\": " << (g_app.showFPS ? 1 : 0) << ",";
        file << "\"vsync\": " << (g_app.vsync ? 1 : 0) << ",";
        file << "\"maxFPS\": " << g_app.maxFPS << "}" << ",";
        file << "\"camera\": {";
            file << "\"position\": {\"x\": " << camPos.x << ", \"y\": " << camPos.y << ", \"z\": " << camPos.z << "},"; 
                file << "\"rotation\": {\"x\": " << camRot.x << ", \"y\": " << camRot.y << ", \"z\": " << camRot.z << "}"; 
            file << "}};";
        file.close();
        try {
            if (fs::exists(dataPath)) fs::remove(dataPath);
            fs::rename(tempPath, dataPath);
        } catch(...) {}
    }
}

std::string GetCurrentThemeAccentColor() {
    fs::path exePath = fs::current_path();
    fs::path assetsPath = exePath / ".." / ".." / "Assets";
    if (!fs::exists(assetsPath)) assetsPath = exePath / ".." / "Assets";
    if (!fs::exists(assetsPath)) assetsPath = exePath / "Assets";
    
    fs::path themeJsonPath = assetsPath / "Themes" / (g_app.theme + ".json");
    if (fs::exists(themeJsonPath)) {
        std::ifstream f(themeJsonPath);
        if (f.is_open()) {
            try {
                nlohmann::json j;
                f >> j;
                if (j.contains("colors") && j["colors"].contains("accent") && j["colors"]["accent"].contains("primary")) {
                    std::string hex = j["colors"]["accent"]["primary"].get<std::string>();
                    if (hex.front() == '#') hex = hex.substr(1);
                    return hex;
                }
            } catch(...) {}
        }
    }

    // Fallback defaults
    if (g_app.theme == "nebula-midnight") return "DA70D6";
    if (g_app.theme == "feather-light") return "64B5F6";
    return "4FC3F7"; // plume-dark
}

void ExportPluginData() {
    auto plugins = Plume::PluginManager::Get().GetAllPlugins();
    std::string dataPath = g_app.uiFolder + "/plugin_data.js";
    std::string tempPath = dataPath + ".tmp";
    
    std::ofstream file(tempPath);
    if (file.is_open()) {
        file << "window.PLUME_PLUGIN_DATA = [";
        for (size_t i = 0; i < plugins.size(); i++) {
            const auto& plugin = plugins[i];
            file << "{";
            file << "\"id\":\"" << plugin.id << "\",";
            file << "\"name\":\"" << plugin.name << "\",";
            file << "\"description\":\"" << plugin.description << "\",";
            file << "\"version\":\"" << plugin.version << "\",";
            file << "\"author\":\"" << plugin.author << "\",";
            file << "\"category\":\"" << (plugin.category == Plume::PluginCategory::Official ? "Official" : 
                                         plugin.category == Plume::PluginCategory::Community ? "Community" : "System") << "\",";
            file << "\"enabled\":" << (Plume::PluginManager::Get().IsPluginEnabled(plugin.id) ? "true" : "false");
            file << "}";
            if (i < plugins.size() - 1) file << ",";
        }
        file << "];";
        file.close();
        try {
            if (fs::exists(dataPath)) fs::remove(dataPath);
            fs::rename(tempPath, dataPath);
        } catch(...) {}
    }
}

// --- Main ---

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    
    fs::path exePath = fs::current_path();
    fs::path uiEntryPath = exePath / ".." / "UI" / "index.html";
    if (!fs::exists(uiEntryPath)) {
        uiEntryPath = exePath / "UI" / "index.html";
    }
    
    std::string resolvedUiFolder;
    try {
        if (fs::exists(uiEntryPath)) {
             fs::path resolved = fs::canonical(uiEntryPath);
             resolvedUiFolder = resolved.parent_path().string();
        } else {
             resolvedUiFolder = (exePath / ".." / "UI").string();
        }
    } catch(...) {
        fs::path resolved = fs::absolute(uiEntryPath);
        resolvedUiFolder = resolved.parent_path().string();
    }
    g_app.uiFolder = resolvedUiFolder;
    
    LoadConfigurations();
    Plume::EditorUtils::ExportThemeData(&g_app);
    Plume::EditorUtils::ExportThemeList(&g_app);

    fs::path splashImagePath = exePath / ".." / ".." / "Assets" / "Branding" / "splash_image.png";
    if (!fs::exists(splashImagePath)) splashImagePath = exePath / ".." / "Assets" / "Branding" / "splash_image.png";
    if (!fs::exists(splashImagePath)) splashImagePath = exePath / "Assets" / "Branding" / "splash_image.png";
    
    std::wstring wSplashPath(splashImagePath.wstring());
    
    SplashScreen splash;
    splash.Create(wSplashPath, 600, 400);
    splash.SetAccentColor(GetCurrentThemeAccentColor());
    splash.Show();
    splash.UpdateProgress(0.0f, "Initializing Plume Engine...");
    
    splash.UpdateProgress(0.02f, "Loading configurations...");
    splash.UpdateProgress(0.04f, "Configurations loaded");

    Plume::Engine engine;
    engine.Init();
    g_app.engine = &engine;
    
    try {
        g_app.engine->SetVSync(g_app.vsync);
        g_app.engine->SetMaxFPS(g_app.maxFPS);
    } catch(...) {}

    std::thread([](){
        const std::chrono::milliseconds tick(16);
        while (!g_app.shouldClose) {
            Plume::Vec3 moveDelta{0,0,0};
            Plume::Vec3 rotDelta{0,0,0};
            bool hasMove = false;
            bool hasRot = false;
            {
                std::lock_guard<std::mutex> lk(g_app.keysMutex);
                for (const auto& k : g_app.pressedKeys) {
                    if (k == "z" || k == "arrowup") { moveDelta.z -= 0.1f; hasMove = true; }
                    else if (k == "s" || k == "arrowdown") { moveDelta.z += 0.1f; hasMove = true; }
                    else if (k == "q" || k == "arrowleft") { moveDelta.x -= 0.1f; hasMove = true; }
                    else if (k == "d" || k == "arrowright") { moveDelta.x += 0.1f; hasMove = true; }
                    else if (k == "control") { moveDelta.y -= 0.1f; hasMove = true; }
                    else if (k == "shift") { moveDelta.y += 0.1f; hasMove = true; }
                    else if (k == "a") { rotDelta.z += 1.0f; hasRot = true; }
                    else if (k == "e") { rotDelta.z -= 1.0f; hasRot = true; }
                }
            }
            if (g_app.engine) {
                if (hasMove) g_app.engine->TranslateCameraLocal(moveDelta, true);
                if (hasRot) g_app.engine->RotateCamera(rotDelta);
            }
            std::this_thread::sleep_for(tick);
        }
    }).detach();

    splash.UpdateProgress(0.33f, "Loading scene...");
    
    splash.UpdateProgress(0.3f, "Loading plugins...");
    auto& pluginManager = Plume::PluginManager::Get();
    splash.UpdateProgress(0.35f, "Registering plugins...");
    pluginManager.LoadPluginsFromDirectory(".");
    
    splash.UpdateProgress(0.4f, "Initializing plugins...");
    auto plugins = pluginManager.GetAllPlugins();
    float pluginProgress = 0.4f;
    float pluginCount = (float)plugins.size();
    float pluginProgressStep = 0.1f / (pluginCount > 0 ? pluginCount : 1.0f);
    
    for (const auto& plugin : plugins) {
        if (pluginManager.IsPluginEnabled(plugin.id)) {
            splash.UpdateProgress(pluginProgress, "Loading " + plugin.name + "...");
            pluginProgress += pluginProgressStep;
        }
    }
    
    pluginManager.InitializeAll();
    splash.UpdateProgress(0.5f, "Plugins loaded!");
    
    if (!fs::exists(uiEntryPath)) {
        splash.Hide();
        MessageBoxA(NULL, "Cannot find UI/index.html", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    splash.UpdateProgress(0.55f, "Exporting data...");
    ExportSceneData();
    ExportPluginData();
    Plume::EditorUtils::ExportThemeData(&g_app);
    Plume::EditorUtils::ExportThemeList(&g_app);
    ExportRenderingData();

    splash.UpdateProgress(0.6f, "Creating window...");
    
    if (!EditorWindow::CreateAppWindow(g_app)) {
        splash.Hide();
        return 1;
    }

    splash.UpdateProgress(0.7f, "Initializing WebView2...");
    
    std::string url = "file:///" + fs::absolute(uiEntryPath).string();
    for (auto& c : url) if (c == '\\') c = '/';
    
    WebViewManager::InitWebView(g_app, url);
    
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    splash.UpdateProgress(1.0f, "Ready!");
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    
    splash.Hide();
    
    ShowWindow(g_app.hwnd, SW_MAXIMIZE);
    SetForegroundWindow(g_app.hwnd);

    RECT rc;
    GetClientRect(g_app.hwnd, &rc);
    uint32_t w = static_cast<uint32_t>(rc.right - rc.left);
    uint32_t h = static_cast<uint32_t>(rc.bottom - rc.top);
    
    engine.InitRenderer(reinterpret_cast<void*>(g_app.hwnd), w, h, engine.GetCurrentGraphicsAPI());
    
    MSG msg = {};
    auto lastExport = std::chrono::steady_clock::now();
    
    while (!g_app.shouldClose) {
        // Dispatch messages (handled by EditorWindow::WindowProc)
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        
        auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - lastExport).count() >= 100) {
            ExportSceneData();
            ExportRenderingData();
            lastExport = now;
        }

        static auto lastFPSBroadcast = std::chrono::steady_clock::now();
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - lastFPSBroadcast).count() >= 250) {
            if (g_app.engine && g_app.webview) {
               float fps = g_app.engine->GetFPS();
               std::string msg = "{\"action\": \"fps-update\", \"fps\": " + std::to_string((int)std::round(fps)) + "}";
               int size = MultiByteToWideChar(CP_UTF8, 0, msg.c_str(), (int)msg.size(), NULL, 0);
               if (size > 0) {
                   std::wstring wmsg(size, 0);
                   MultiByteToWideChar(CP_UTF8, 0, msg.c_str(), (int)msg.size(), &wmsg[0], size);
                   g_app.webview->PostWebMessageAsJson(wmsg.c_str());
               }
            }
            lastFPSBroadcast = now;
        }
        
        Plume::PluginManager::Get().UpdateAll();

        if (g_app.engine && g_app.isRenderingEnabled) {
            if (g_app.engine->GetRenderer()) {
                g_app.engine->RenderFrame();
            }
        }
        
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    
    Plume::PluginManager::Get().ShutdownAll();
    engine.Shutdown();
    return 0;
}
