#include <Core/Engine.h>
#include <Core/PluginManager.h>
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Plugins/DiscordRichPresence/DiscordPresence.h>
#include <string>
#include <filesystem>
#include <fstream>
#include <unordered_map>
#include <thread>
#include <chrono>
#include <atomic>
#include <memory>
#include <functional>
#include <ctime>
#include <mutex>
#include <unordered_set>
// Vendored single-header JSON (nlohmann)
#include "ThirdParty/nlohmann_json.hpp"

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <shellapi.h>
#include <dwmapi.h>
#include <commdlg.h>
#include <wrl.h>
#include "WebView2.h"
#include "SplashScreen.h"
#include "resource.h"
#include "Version.h"
using namespace Microsoft::WRL;
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "comdlg32.lib")
#endif

namespace fs = std::filesystem;

struct AppState {
    HWND hwnd = nullptr;
    HWND viewport = nullptr;
    ComPtr<ICoreWebView2Controller> controller;
    ComPtr<ICoreWebView2> webview;
    Plume::Engine* engine = nullptr;
    std::string uiFolder;
    std::atomic<bool> shouldClose{false};
    bool isFullscreen = false;
    std::string clipboardPath;
    
    // Viewport bounds from web UI (for 3D rendering region)
    struct {
        int x = 0;
        int y = 0;
        int width = 800;
        int height = 600;
    } viewportBounds;
    // Input state for viewport camera control
    POINT lastMouse = {0,0};
    bool isLeftDown = false;
    // Pressed keys reported from the web UI (thread-safe)
    std::mutex keysMutex;
    std::unordered_set<std::string> pressedKeys;
    // WebView visibility toggle state
    bool webviewVisible = true;
    bool lastCtrlT = false;
};

static AppState g_app;

static void ToggleWebViewVisibility() {
    if (!g_app.controller) return;

    BOOL isVisible = FALSE;
    HRESULT hr = g_app.controller->get_IsVisible(&isVisible);
    if (SUCCEEDED(hr)) {
        BOOL newVis = isVisible ? FALSE : TRUE;
        g_app.controller->put_IsVisible(newVis);
    }

    if (g_app.hwnd) {
        InvalidateRect(g_app.hwnd, NULL, TRUE);
        UpdateWindow(g_app.hwnd);
    }
}

void ExportSceneData() {
    if (!g_app.engine) return;
    
    std::string sceneJson = g_app.engine->GetActiveScene()->SerializeToJson();
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

void ExportThemeData() {
    // Create a default theme file for the splash screen
    std::string dataPath = g_app.uiFolder + "/theme_data.js";
    std::string tempPath = dataPath + ".tmp";
    
    std::ofstream file(tempPath);
    if (file.is_open()) {
        file << "window.PLUME_THEME_DATA = {";
        file << "\"name\": \"nebula-midnight\","; // Default theme
        file << "\"colors\": {";
        file << "\"accent\": {";
        file << "\"primary\": \"#9C27B0\""; // Nebula Midnight accent color
        file << "}";
        file << "}";
        file << "};";
        file.close();
        try {
            if (fs::exists(dataPath)) fs::remove(dataPath);
            fs::rename(tempPath, dataPath);
        } catch(...) {}
    }
}

void ExportRenderingData() {
    if (!g_app.engine) return;
    
    // Convert GraphicsAPI enum to string
    std::string apiName;
    auto api = g_app.engine->GetCurrentGraphicsAPI();
    switch(api) {
        case Plume::RHI::GraphicsAPI::Vulkan: apiName = "Vulkan"; break;
        case Plume::RHI::GraphicsAPI::DirectX12: apiName = "DirectX12"; break;
        case Plume::RHI::GraphicsAPI::OpenGL: apiName = "OpenGL"; break;
        case Plume::RHI::GraphicsAPI::Metal: apiName = "Metal"; break;
        default: apiName = "Unknown"; break;
    }
    
    // Get camera transform from scene
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
        file << "\"camera\": {";
        file << "\"position\": {\"x\": " << camPos.x << ", \"y\": " << camPos.y << ", \"z\": " << camPos.z << "},";
        file << "\"rotation\": {\"x\": " << camRot.x << ", \"y\": " << camRot.y << ", \"z\": " << camRot.z << "}";
        file << "}";
        file << "};";
        file.close();
        try {
            if (fs::exists(dataPath)) fs::remove(dataPath);
            fs::rename(tempPath, dataPath);
        } catch(...) {}
    }
}

std::string GetCurrentThemeAccentColor() {
    // Read theme_data.js file to get current theme accent color
    std::string themePath = g_app.uiFolder + "/theme_data.js";
    if (fs::exists(themePath)) {
        std::ifstream themeFile(themePath);
        if (themeFile.is_open()) {
            std::string content((std::istreambuf_iterator<char>(themeFile)), std::istreambuf_iterator<char>());
            // Chercher la couleur d'accent primaire
            size_t primaryPos = content.find("\"primary\":");
            if (primaryPos != std::string::npos) {
                size_t start = content.find("#", primaryPos);
                if (start != std::string::npos) {
                    size_t end = content.find("\"", start);
                    if (end != std::string::npos) {
                        return content.substr(start + 1, end - start - 1);
                    }
                }
            }
        }
    }
    // Default Nebula Midnight color
    return "9C27B0";
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

#ifdef _WIN32
LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_HOTKEY: {
            if (wParam == 1) {
                ToggleWebViewVisibility();
                return 0;
            }
            break;
        }
        case WM_SIZE:
            if (g_app.controller) {
                // Resize WebView2 to fill the entire client area
                RECT bounds;
                GetClientRect(hwnd, &bounds);
                g_app.controller->put_Bounds(bounds);
                
                // Note: Renderer swapchain resize will be handled when we detect
                // viewport dimension changes from the web UI
            }
            return 0;
        case WM_GETMINMAXINFO: {
            // Adjust maximum size to prevent window overflow
            MINMAXINFO* mmi = (MINMAXINFO*)lParam;
            MONITORINFO mi = { sizeof(mi) };
            GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
            
            // Use work area (with taskbar)
            mmi->ptMaxSize.x = mi.rcWork.right - mi.rcWork.left;
            mmi->ptMaxSize.y = mi.rcWork.bottom - mi.rcWork.top;
            mmi->ptMaxPosition.x = mi.rcWork.left;
            mmi->ptMaxPosition.y = mi.rcWork.top;
            return 0;
        }
        case WM_NCHITTEST: {
            // Allow window dragging by clicking on header (32px height)
            LRESULT hit = DefWindowProc(hwnd, msg, wParam, lParam);
            if (hit == HTCLIENT) {
                POINT pt = { GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam) };
                ScreenToClient(hwnd, &pt);
                
                // If clicking in the first 32 pixels (header), allow drag
                if (pt.y >= 0 && pt.y <= 32) {
                    return HTCAPTION;
                }
            }
            return hit;
        }
        case WM_NCCALCSIZE: {
            if (wParam == TRUE) {
                NCCALCSIZE_PARAMS* params = (NCCALCSIZE_PARAMS*)lParam;
                
                if (IsZoomed(hwnd)) {
                    // Window is maximized - adjust to prevent overflow
                    MONITORINFO mi = { sizeof(mi) };
                    GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), &mi);
                    // Adjust client area to match work area exactly
                    params->rgrc[0] = mi.rcWork;
                } else {
                    // In windowed mode, only remove title bar but keep borders
                    // Only reduce top to remove title bar
                    params->rgrc[0].top += 0;  // No offset - completely removes title bar
                    params->rgrc[0].left += 0;
                    params->rgrc[0].right -= 0;
                    params->rgrc[0].bottom -= 0;
                }
                return 0;
            }
            break;
        }
        case WM_SYSCOMMAND: {
            // Handle system commands for snap
            if ((wParam & 0xFFF0) == SC_MAXIMIZE || 
                (wParam & 0xFFF0) == SC_RESTORE) {
                // Let Windows handle maximize/restore
                break;
            }
            return DefWindowProc(hwnd, msg, wParam, lParam);
        }
        case WM_CLOSE:
            g_app.shouldClose = true;
            DestroyWindow(hwnd);
            return 0;
        case WM_DESTROY:
            // Unregister the global hotkey if it was registered
            UnregisterHotKey(hwnd, 1);
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

bool CreateAppWindow() {
    HINSTANCE hInstance = GetModuleHandle(NULL);
    
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = L"PlumeEngineWindow";
    wc.hIcon = LoadIcon(hInstance, MAKEINTRESOURCE(IDI_ICON1));
    wc.hIconSm = LoadIcon(hInstance, MAKEINTRESOURCE(IDI_ICON1));
    
    if (!RegisterClassExW(&wc)) return false;
    
    g_app.hwnd = CreateWindowExW(
        0, L"PlumeEngineWindow", PLUME_WINDOW_TITLE,
        WS_OVERLAPPEDWINDOW | WS_THICKFRAME,
        CW_USEDEFAULT, CW_USEDEFAULT, 1600, 900,
        NULL, NULL, hInstance, NULL
    );
    
    if (!g_app.hwnd) return false;
    
    // Appliquer les coins arrondis (Windows 11)
    DWM_WINDOW_CORNER_PREFERENCE corner = DWMWCP_ROUND;
    DwmSetWindowAttribute(g_app.hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &corner, sizeof(corner));
    
    // Don't show window immediately - wait for splash screen to finish
    // but create it in invisible minimized mode to allow WebView2 to load
    ShowWindow(g_app.hwnd, SW_SHOWMINNOACTIVE);
    UpdateWindow(g_app.hwnd);

    // Register a global hotkey (Ctrl+T) for toggling the WebView overlay
    RegisterHotKey(g_app.hwnd, 1, MOD_CONTROL, 'T');
    
    g_app.viewport = nullptr;
    
    return true;
}

void InitWebView(const std::string& htmlPath) {
    CreateCoreWebView2Environment(
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [htmlPath](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                env->CreateCoreWebView2Controller(g_app.hwnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [htmlPath](HRESULT result, ICoreWebView2Controller* controller) -> HRESULT {
                            g_app.controller = controller;
                            controller->get_CoreWebView2(&g_app.webview);
                            
                            RECT client;
                            GetClientRect(g_app.hwnd, &client);
                            controller->put_Bounds(client);
                            
                            // Configurer WebView2 pour permettre le drag
                            ComPtr<ICoreWebView2Settings> settings;
                            g_app.webview->get_Settings(&settings);
                            if (settings) {
                                // Disable default WebView2 context menu
                                // afin que le frontend (React) puisse gérer `onContextMenu`
                                settings->put_AreDefaultContextMenusEnabled(FALSE);
                                settings->put_IsStatusBarEnabled(FALSE);
                            }
                            
                            // Configure WebView2 for high DPI displays
                            ComPtr<ICoreWebView2Controller3> controller3;
                            controller->QueryInterface(IID_PPV_ARGS(&controller3));
                            if (controller3) {
                                controller3->put_ShouldDetectMonitorScaleChanges(TRUE);
                            }

                            // Try to set default background color transparent if controller2 is available
                            ComPtr<ICoreWebView2Controller2> controller2;
                            controller->QueryInterface(IID_PPV_ARGS(&controller2));
                            if (controller2) {
                                COREWEBVIEW2_COLOR transparentColor = {0, 0, 0, 0};
                                controller2->put_DefaultBackgroundColor(transparentColor);
                            }

                            // Make controller visible
                            controller->put_IsVisible(TRUE);

                            // Ensure the page background is transparent via injected script
                                if (g_app.webview) {
                                    // Inject a small diagnostic script: force transparent backgrounds and post a ready message
                                    // The script posts a JSON message to the host so the native side can confirm DOM rendering.
                                    LPWSTR script = L"(function(){\n"
                                        L"  try{\n"
                                        L"    document.documentElement.style.background='transparent';\n"
                                        L"    document.body.style.background='transparent';\n"
                                        L"    document.body.style.backgroundColor='transparent';\n"
                                        L"    document.documentElement.style.backgroundColor='transparent';\n"
                                        L"  }catch(e){}\n"
                                        L"  try{\n"
                                        L"    if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {\n"
                                        L"      window.chrome.webview.postMessage({ action: 'plume_dom_ready' });\n"
                                        L"      document.addEventListener('DOMContentLoaded', function(){ window.chrome.webview.postMessage({ action: 'plume_dom_ready' }); });\n"
                                        L"      setTimeout(function(){ window.chrome.webview.postMessage({ action: 'plume_dom_heartbeat' }); }, 750);\n"
                                        L"    }\n"
                                        L"  }catch(e){}\n"
                                        L"})();";
                                    g_app.webview->ExecuteScript(script, nullptr);
                            }
                            
                            // Écouter les messages depuis le frontend
                            g_app.webview->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [](ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                                        LPWSTR messageRaw = nullptr;
                                        args->get_WebMessageAsJson(&messageRaw);
                                        std::wstring messageW(messageRaw ? messageRaw : L"");
                                        if (messageRaw) CoTaskMemFree(messageRaw);

                                        // Convert wide JSON string to UTF-8
                                        auto wstr_to_utf8 = [&](const std::wstring& w) -> std::string {
                                            if (w.empty()) return {};
                                            int size = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), NULL, 0, NULL, NULL);
                                            if (size <= 0) return {};
                                            std::string out(size, '\0');
                                            WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), out.data(), size, NULL, NULL);
                                            return out;
                                        };

                                        auto utf8_to_wstr = [&](const std::string& s) -> std::wstring {
                                            if (s.empty()) return {};
                                            int size = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), NULL, 0);
                                            if (size <= 0) return {};
                                            std::wstring out(size, L'\0');
                                            MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), out.data(), size);
                                            return out;
                                        };

                                        std::string msg = wstr_to_utf8(messageW);

                                        // Parse JSON using nlohmann::json (vendored header)
                                        nlohmann::json j;
                                        bool parsed = false;
                                        try {
                                            j = nlohmann::json::parse(msg);
                                            parsed = true;
                                        } catch(...) { parsed = false; }
                                        if (!parsed) {
                                            std::string out = "{\"type\":\"result\",\"success\":false,\"message\":\"Invalid JSON\"}";
                                            std::wstring wides = utf8_to_wstr(out);
                                            if (g_app.webview) g_app.webview->PostWebMessageAsJson(wides.c_str());
                                            return S_OK;
                                        }
                                        std::string action = j.value("action", std::string());
                                            // Diagnostic messages from the page (transparency / DOM ready checks)
                                            if (action == "plume_dom_ready" || action == "plume_dom_heartbeat") {
                                                std::ofstream diag("plume_diag.txt", std::ios::app);
                                                if (diag.is_open()) {
                                                    diag << "WebMessage received: " << action << "\n";
                                                    diag.close();
                                                }
                                                return S_OK;
                                            }

                                        // Quick window commands
                                        if (action == "start-drag") {
                                            ReleaseCapture();
                                            SendMessage(g_app.hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                                            return S_OK;
                                        }
                                        if (action == "minimize") { ShowWindow(g_app.hwnd, SW_MINIMIZE); return S_OK; }
                                        if (action == "maximize") { if (IsZoomed(g_app.hwnd)) ShowWindow(g_app.hwnd, SW_RESTORE); else ShowWindow(g_app.hwnd, SW_MAXIMIZE); return S_OK; }
                                        if (action == "close") { g_app.shouldClose = true; PostMessage(g_app.hwnd, WM_CLOSE, 0, 0); return S_OK; }

                                        // Viewport bounds update from Web UI
                                        if (action == "viewport-bounds") {
                                            g_app.viewportBounds.x = j.value("x", 0);
                                            g_app.viewportBounds.y = j.value("y", 0);
                                            g_app.viewportBounds.width = j.value("width", 800);
                                            g_app.viewportBounds.height = j.value("height", 600);
                                            
                                            // Convert Y from top-origin (HTML/CSS) to bottom-origin (OpenGL)
                                            // Also convert from CSS/logical pixels to device pixels using window DPI
                                            RECT clientRect;
                                            GetClientRect(g_app.hwnd, &clientRect);
                                            int clientHeight = clientRect.bottom - clientRect.top;

                                            // Get DPI for the window if available (fallback to screen DPI)
                                            UINT dpi = 96;
                                            HMODULE user32 = GetModuleHandleA("user32.dll");
                                            if (user32) {
                                                typedef UINT(WINAPI *PFN_GetDpiForWindow)(HWND);
                                                PFN_GetDpiForWindow pGetDpiForWindow = (PFN_GetDpiForWindow)GetProcAddress(user32, "GetDpiForWindow");
                                                if (pGetDpiForWindow) {
                                                    dpi = pGetDpiForWindow(g_app.hwnd);
                                                } else {
                                                    HDC screenDC = GetDC(NULL);
                                                    if (screenDC) {
                                                        dpi = GetDeviceCaps(screenDC, LOGPIXELSX);
                                                        ReleaseDC(NULL, screenDC);
                                                    }
                                                }
                                            }

                                            float scale = (float)dpi / 96.0f;

                                            int vpX = static_cast<int>(roundf(g_app.viewportBounds.x * scale));
                                            int vpY = static_cast<int>(roundf(g_app.viewportBounds.y * scale));
                                            int vpW = static_cast<int>(roundf(g_app.viewportBounds.width * scale));
                                            int vpH = static_cast<int>(roundf(g_app.viewportBounds.height * scale));

                                            int windowHeightPx = static_cast<int>(roundf(clientHeight * scale));
                                            int glY = windowHeightPx - vpY - vpH;

                                            // Diagnostic: write viewport conversion details (CSS -> device pixels)
                                            {
                                                std::ofstream diag("plume_diag.txt", std::ios::app);
                                                if (diag.is_open()) {
                                                    diag << "DiagViewportBounds raw: x=" << g_app.viewportBounds.x << " y=" << g_app.viewportBounds.y
                                                         << " w=" << g_app.viewportBounds.width << " h=" << g_app.viewportBounds.height
                                                         << " dpi=" << dpi << " scale=" << scale << " vpX=" << vpX << " vpY=" << vpY
                                                         << " vpW=" << vpW << " vpH=" << vpH << " windowHeightPx=" << windowHeightPx
                                                         << " glY=" << glY;
                                                    if (g_app.engine && g_app.engine->GetRenderer()) {
                                                        Plume::RHI::RHISwapChain* swap = g_app.engine->GetRenderer()->GetSwapChain();
                                                        if (swap) diag << " swap=" << swap->GetWidth() << "x" << swap->GetHeight();
                                                    }
                                                    diag << "\n";
                                                    diag.close();
                                                }
                                            }

                                                // Resize the renderer swapchain to the viewport device-pixel size
                                                if (g_app.engine && g_app.engine->GetRenderer()) {
                                                    Plume::RHI::RHISwapChain* swap = g_app.engine->GetRenderer()->GetSwapChain();

                                                    if (swap && (swap->GetWidth() != (uint32_t)vpW || 
                                                                 swap->GetHeight() != (uint32_t)vpH)) {
                                                        swap->Resize((uint32_t)vpW, (uint32_t)vpH);
                                                    }

                                                    // Use the actual swapchain size to avoid off-by-one margins
                                                    uint32_t actualW = vpW;
                                                    uint32_t actualH = vpH;
                                                    if (swap) {
                                                        actualW = swap->GetWidth();
                                                        actualH = swap->GetHeight();
                                                    }

                                                    if (g_app.engine->GetRendererObject()) {
                                                        // Ajout d'une marge à gauche et en bas
                                                        constexpr int marginLeft = 32; // px
                                                        constexpr int marginBottom = 32; // px
                                                        g_app.engine->GetRendererObject()->SetViewportRegion(
                                                            marginLeft,
                                                            marginBottom,
                                                            static_cast<int>(actualW) - marginLeft,
                                                            static_cast<int>(actualH) - marginBottom
                                                        );
                                                    }
                                                } else {
                                                    // No renderer available yet - fall back to setting logical device coords
                                                    if (g_app.engine && g_app.engine->GetRendererObject()) {
                                                        g_app.engine->GetRendererObject()->SetViewportRegion(
                                                            vpX,
                                                            glY,
                                                            vpW,
                                                            vpH
                                                        );
                                                    }
                                                }
                                            return S_OK;
                                        }

                                        // Viewport pointer events forwarded from the Web UI
                                        if (action == "viewport-pointer") {
                                            std::string type = j.value("type", std::string());
                                            if (g_app.engine) {
                                                if (type == "move") {
                                                    float dx = j.value("dx", 0.0f);
                                                    float dy = j.value("dy", 0.0f);
                                                    // Match native lookSpeed used earlier
                                                    const float lookSpeed = 0.15f;
                                                    Plume::Vec3 rotDelta;
                                                    rotDelta.x = -dy * lookSpeed;
                                                    rotDelta.y = -dx * lookSpeed;
                                                    rotDelta.z = 0.0f;
                                                    g_app.engine->RotateCamera(rotDelta);
                                                } else if (type == "wheel") {
                                                    float delta = j.value("delta", 0.0f);
                                                    Plume::Vec3 mv{0,0,0};
                                                    mv.z += (delta > 0.0f) ? 0.5f : -0.5f;
                                                    // Zoom by moving along camera forward including pitch
                                                    g_app.engine->TranslateCameraLocal(mv, true);
                                                }
                                            }
                                            return S_OK;
                                        }

                                        // Viewport keyboard events forwarded from the Web UI
                                        if (action == "viewport-key") {
                                            std::string key = j.value("key", std::string());
                                            std::string ktype = j.value("type", std::string());
                                            if (g_app.engine && ktype == "down") {
                                                Plume::Vec3 moveDelta{0,0,0};
                                                if (key == "ArrowUp") moveDelta.z -= 0.2f;
                                                else if (key == "ArrowDown") moveDelta.z += 0.2f;
                                                else if (key == "ArrowLeft") moveDelta.x -= 0.2f;
                                                else if (key == "ArrowRight") moveDelta.x += 0.2f;
                                                else if (key == "q" || key == "Q") moveDelta.y -= 0.2f;
                                                else if (key == "e" || key == "E") moveDelta.y += 0.2f;
                                                if (moveDelta.x != 0 || moveDelta.y != 0 || moveDelta.z != 0) {
                                                    // Fly camera: always follow pitch
                                                    g_app.engine->TranslateCameraLocal(moveDelta, true);
                                                }
                                            }
                                            return S_OK;
                                        }

                                        // Camera rotation from viewport (left mouse drag)
                                        if (action == "camera-rotate") {
                                            if (g_app.engine) {
                                                float dx = j.value("deltaX", 0.0f);
                                                float dy = j.value("deltaY", 0.0f);
                                                Plume::Vec3 rotDelta;
                                                rotDelta.x = dx; // pitch
                                                rotDelta.y = dy; // yaw
                                                rotDelta.z = 0.0f;
                                                g_app.engine->RotateCamera(rotDelta);
                                            }
                                            return S_OK;
                                        }

                                        // Camera keyboard input (WASD, Q/E for movement)
                                        if (action == "camera-input") {
                                            if (g_app.engine) {
                                                // Update the pressed-keys set so a dedicated input thread
                                                // can apply continuous movement each engine frame.
                                                auto keys = j.value("keys", std::vector<std::string>());
                                                try {
                                                    std::lock_guard<std::mutex> lk(g_app.keysMutex);
                                                    g_app.pressedKeys.clear();
                                                    for (const auto& k : keys) g_app.pressedKeys.insert(k);
                                                } catch(...) {}
                                                // Diagnostic: log receipt of camera-input messages
                                                try {
                                                    std::ofstream ofs("plume_diag.txt", std::ios::app);
                                                    if (ofs.is_open()) {
                                                        auto now = std::chrono::system_clock::now();
                                                        std::time_t tt = std::chrono::system_clock::to_time_t(now);
                                                        ofs << "Diag: camera-input received keys=" << keys.size() << " time=" << std::ctime(&tt);
                                                    }
                                                } catch(...) {}
                                            }
                                            return S_OK;
                                        }

                                        // Helper to send content list for a given path (string)
                                        // If recursive==true, return a hierarchical tree of folders/files with children arrays
                                        std::function<nlohmann::json(const fs::path&)> buildNode;
                                        buildNode = [&](const fs::path& p) -> nlohmann::json {
                                            nlohmann::json it;
                                            std::string name = p.filename().string();
                                            std::string id = name + "_" + std::to_string(std::hash<std::string>{}(p.string()));
                                            std::string type = fs::is_directory(p) ? "folder" : "file";
                                            std::string pathStr = p.string();
                                            for (auto &c : pathStr) if (c == '\\') c = '/';
                                            it["id"] = id;
                                            it["name"] = name;
                                            it["type"] = type;
                                            it["path"] = pathStr;
                                            if (fs::is_directory(p)) {
                                                try {
                                                    fs::path meta = p / ".plume_meta";
                                                    if (fs::exists(meta)) {
                                                        std::ifstream ifs(meta.string());
                                                        if (ifs.is_open()) {
                                                            nlohmann::json metaJson;
                                                            ifs >> metaJson;
                                                            it["meta"] = metaJson;
                                                        }
                                                    }
                                                } catch(...) {}
                                            }
                                            return it;
                                        };

                                        auto sendContentListFor = [&](const std::string& pathValue, bool recursive = false) {
                                            fs::path base = fs::path(g_app.uiFolder).parent_path();
                                            std::string rel = pathValue.empty() ? std::string("Content") : pathValue;
                                            fs::path target = rel.rfind("://") != std::string::npos ? fs::path(rel) : base / rel;
                                            nlohmann::json list = nlohmann::json::object();
                                            list["type"] = "content-list";
                                            list["path"] = rel;
                                            list["items"] = nlohmann::json::array();
                                            try {
                                                if (fs::exists(target) && fs::is_directory(target)) {
                                                    if (recursive) {
                                                        // walk top-level entries and include children for folders
                                                        for (auto& entry : fs::directory_iterator(target)) {
                                                            nlohmann::json node = buildNode(entry.path());
                                                            if (entry.is_directory()) {
                                                                node["children"] = nlohmann::json::array();
                                                                try {
                                                                    for (auto& c : fs::directory_iterator(entry.path())) {
                                                                        nlohmann::json child = buildNode(c.path());
                                                                        // don't recurse deeply for performance; children will not have grandchildren
                                                                        node["children"].push_back(child);
                                                                    }
                                                                } catch(...) {}
                                                            }
                                                            list["items"].push_back(node);
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
                                            if (g_app.webview) g_app.webview->PostWebMessageAsJson(wides.c_str());
                                        };

                                        // Helper to send structured result back to the frontend (optionally with data)
                                        auto sendResult = [&](bool success, const std::string& message, nlohmann::json data = {}) {
                                            nlohmann::json res;
                                            res["type"] = "result";
                                            res["success"] = success;
                                            res["message"] = message;
                                            if (!data.is_null() && !data.empty()) res["data"] = data;
                                            std::string out = res.dump();
                                            std::wstring wides = utf8_to_wstr(out);
                                            if (g_app.webview) g_app.webview->PostWebMessageAsJson(wides.c_str());
                                        };

                                        // File actions
                                        if (action == "list-content") {
                                            std::string path = j.value("path", std::string());
                                            bool recursive = j.value("recursive", false);
                                            sendContentListFor(path, recursive);
                                            return S_OK;
                                        }
                                        if (action == "delete") {
                                            std::string path = j.value("path", std::string());
                                            bool ok = false;
                                            if (!path.empty()) {
                                                try { 
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path fullPath = base / path;
                                                    fs::remove_all(fullPath); 
                                                    ok = true; 
                                                } catch(...) { ok = false; }
                                            }
                                            sendResult(ok, ok ? "Deleted" : "Delete failed");
                                            // Refresh parent folder listing
                                            if (!path.empty()) sendContentListFor(fs::path(path).parent_path().string()); else sendContentListFor(std::string("Content"));
                                            return S_OK;
                                        }
                                        if (action == "rename") {
                                            std::string path = j.value("path", std::string());
                                            std::string name = j.value("name", std::string());
                                            bool ok = false;
                                            if (!path.empty() && !name.empty()) {
                                                try { 
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path fullPath = base / path;
                                                    fs::path dest = fullPath.parent_path() / name; 
                                                    fs::rename(fullPath, dest); 
                                                    ok = true; 
                                                } catch(...) { ok = false; }
                                            }
                                            sendResult(ok, ok ? "Renamed" : "Rename failed");
                                            if (!path.empty()) sendContentListFor(fs::path(path).parent_path().string()); else sendContentListFor(std::string("Content"));
                                            return S_OK;
                                        }
                                        if (action == "duplicate") {
                                            std::string path = j.value("path", std::string());
                                            bool ok = false;
                                            if (!path.empty()) {
                                                try {
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path p = base / path;
                                                    
                                                    // Preserve extension while adding _2, _3 suffix
                                                    std::string stem = p.stem().string();
                                                    std::string extension = p.extension().string();
                                                    
                                                    // Find unique name starting from _2
                                                    fs::path dest;
                                                    int counter = 2;
                                                    dest = p.parent_path() / (stem + "_" + std::to_string(counter) + extension);
                                                    
                                                    while (fs::exists(dest)) {
                                                        counter++;
                                                        dest = p.parent_path() / (stem + "_" + std::to_string(counter) + extension);
                                                    }
                                                    
                                                    if (fs::is_directory(p)) fs::copy(p, dest, fs::copy_options::recursive);
                                                    else fs::copy_file(p, dest);
                                                    ok = true;
                                                } catch(...) { ok = false; }
                                            }
                                            sendResult(ok, ok ? "Duplicated" : "Duplicate failed");
                                            if (!path.empty()) sendContentListFor(fs::path(path).parent_path().string()); else sendContentListFor(std::string("Content"));
                                            return S_OK;
                                        }
                                        if (action == "create-folder") {
                                            std::string name = j.value("name", std::string());
                                            std::string pathParam = j.value("path", std::string());
                                            bool ok = false;
                                            if (!name.empty()) {
                                                try {
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path targetDir;
                                                    if (!pathParam.empty()) {
                                                        fs::path p(pathParam);
                                                        if (p.is_absolute()) targetDir = p;
                                                        else targetDir = base / pathParam;
                                                    } else {
                                                        targetDir = base / "Content";
                                                    }
                                                    fs::create_directories(targetDir / name);
                                                    ok = true;
                                                } catch(...) { ok = false; }
                                            }
                                            sendResult(ok, ok ? "Folder created" : "Create folder failed");
                                            if (!pathParam.empty()) sendContentListFor(pathParam); else sendContentListFor(std::string("Content"));
                                            return S_OK;
                                        }
                                        if (action == "open-in-explorer") { 
                                            std::string path = j.value("path", std::string()); 
                                            fs::path base = fs::path(g_app.uiFolder).parent_path();
                                            fs::path fullPath = path.empty() ? (base / "Content") : (base / path);
                                            
                                            // If it's a directory, open it directly; if it's a file, open the parent and select it
                                            if (fs::exists(fullPath) && fs::is_directory(fullPath)) {
                                                std::wstring widePath = fullPath.wstring();
                                                ShellExecuteW(NULL, L"open", widePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
                                            } else {
                                                // For files or if path doesn't exist, use /select
                                                std::wstring args = utf8_to_wstr(std::string("/select,\"") + fullPath.string() + std::string("\""));
                                                ShellExecuteW(NULL, L"open", L"explorer.exe", args.c_str(), NULL, SW_SHOWNORMAL);
                                            }
                                            return S_OK; 
                                        }
                                        if (action == "copy") {
                                            if (j.contains("path")) {
                                                g_app.clipboardPath = j.value("path", std::string());
                                                sendResult(true, "Copied to clipboard");
                                            } else {
                                                sendResult(false, "No path to copy");
                                            }
                                            return S_OK;
                                        }
                                        if (action == "paste") {
                                            std::string source = j.value("sourcePath", g_app.clipboardPath);
                                            std::string targetPath = j.value("path", std::string());
                                            bool ok = false;
                                            if (!source.empty()) {
                                                try {
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path src = base / source;
                                                    fs::path destDir = targetPath.empty() ? (base / "Content") : (base / targetPath);
                                                    
                                                    // Find a unique name by incrementing number while preserving extension
                                                    std::string stem = src.stem().string(); // filename without extension
                                                    std::string extension = src.extension().string(); // .plume_mesh, .txt, etc.
                                                    
                                                    // Try name_2, name_3, etc.
                                                    fs::path dest;
                                                    int counter = 2;
                                                    dest = destDir / (stem + "_" + std::to_string(counter) + extension);
                                                    
                                                    while (fs::exists(dest)) {
                                                        counter++;
                                                        dest = destDir / (stem + "_" + std::to_string(counter) + extension);
                                                    }
                                                    
                                                    if (fs::is_directory(src)) fs::copy(src, dest, fs::copy_options::recursive);
                                                    else fs::copy_file(src, dest);
                                                    ok = true;
                                                } catch(...) { ok = false; }
                                            }
                                            sendContentListFor(targetPath.empty() ? std::string("Content") : targetPath);
                                            sendResult(ok, ok ? "Pasted successfully" : "Paste failed");
                                            return S_OK;
                                        }
                                        if (action == "change-color") {
                                            std::string path = j.value("path", std::string());
                                            std::string color = j.value("color", std::string());
                                            bool ok = false;
                                            if (!path.empty() && !color.empty()) {
                                                try {
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path fullPath = base / path;
                                                    fs::path meta = fullPath / ".plume_meta";
                                                    std::ofstream ofs(meta.string());
                                                    if (ofs.is_open()) {
                                                        ofs << "{\"color\": \"" << color << "\"}";
                                                        ofs.close();
                                                        ok = true;
                                                    }
                                                } catch(...) { ok = false; }
                                            }
                                            sendResult(ok, ok ? "Color saved" : "Failed to save color");
                                            if (!path.empty()) sendContentListFor(fs::path(path).parent_path().string());
                                            return S_OK;
                                        }

                                        // Import file (open file dialog)
                                        if (action == "import-file") {
                                            std::string path = j.value("path", std::string());
                                            OPENFILENAMEA ofn = {};
                                            char szFile[260] = {};
                                            ofn.lStructSize = sizeof(ofn);
                                            ofn.hwndOwner = g_app.hwnd;
                                            ofn.lpstrFile = szFile;
                                            ofn.nMaxFile = sizeof(szFile);
                                            ofn.lpstrFilter = "3D Models (*.fbx;*.obj;*.glb;*.gltf)\0*.fbx;*.obj;*.glb;*.gltf\0All Files (*.*)\0*.*\0";
                                            ofn.nFilterIndex = 1;
                                            ofn.lpstrFileTitle = NULL;
                                            ofn.nMaxFileTitle = 0;
                                            ofn.lpstrInitialDir = NULL;
                                            ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_ALLOWMULTISELECT | OFN_EXPLORER;
                                            
                                            if (GetOpenFileNameA(&ofn)) {
                                                // Process the selected files
                                                std::vector<std::string> selectedFiles;
                                                std::string fileName = szFile;
                                                
                                                // Check if it's a multi-select
                                                if (ofn.nFileOffset > fileName.length()) {
                                                    // Multi-select: directory\0file1\0file2\0\0
                                                    std::string dir = fileName;
                                                    char* p = szFile + ofn.nFileOffset;
                                                    while (*p) {
                                                        selectedFiles.push_back(dir + "\\" + p);
                                                        p += strlen(p) + 1;
                                                    }
                                                } else {
                                                    // Single file
                                                    selectedFiles.push_back(fileName);
                                                }
                                                
                                                // Process the files directly
                                                nlohmann::json files = nlohmann::json::array();
                                                for (const auto& file : selectedFiles) {
                                                    nlohmann::json fileObj;
                                                    fileObj["name"] = fs::path(file).filename().string();
                                                    fileObj["path"] = file;
                                                    files.push_back(fileObj);
                                                }
                                                
                                                // Create the import request
                                                nlohmann::json importReq;
                                                importReq["action"] = "import-files";
                                                importReq["files"] = files;
                                                importReq["path"] = path;
                                                
                                                // Recursively call to process the import
                                                // (simulating a new message with the selected files)
                                                // For now, we'll process it here inline
                                                if (!files.empty()) {
                                                    fs::path base = fs::path(g_app.uiFolder).parent_path();
                                                    fs::path contentDir = base / path;
                                                    
                                                    // Ensure the target directory exists
                                                    try {
                                                        if (!fs::exists(contentDir)) {
                                                            fs::create_directories(contentDir);
                                                        }
                                                    } catch(...) {}
                                                    
                                                    int importedCount = 0;
                                                    std::vector<std::string> createdAssets;
                                                    
                                                    // Process each file
                                                    for (const auto& fileObj : files) {
                                                        std::string filePath = fileObj.value("path", std::string());
                                                        std::string fileName = fileObj.value("name", std::string());
                                                        
                                                        if (filePath.empty() || fileName.empty()) continue;
                                                        
                                                        try {
                                                            fs::path src(filePath);
                                                            if (!fs::exists(src)) continue;
                                                            
                                                            // Get file extension
                                                            std::string ext = src.extension().string();
                                                            for (auto& c : ext) c = std::tolower(c);
                                                            
                                                            // Check if it's a 3D model
                                                            bool is3DModel = (ext == ".fbx" || ext == ".obj" || ext == ".glb" || ext == ".gltf");
                                                            
                                                            if (is3DModel) {
                                                                // Create a Static Mesh asset (just .plume_mesh file, no folder)
                                                                std::string meshName = fs::path(fileName).stem().string();
                                                                
                                                                try {
                                                                    // Create a .plume_mesh metadata file directly
                                                                    nlohmann::json meshMeta;
                                                                    meshMeta["type"] = "StaticMesh";
                                                                    meshMeta["sourceFile"] = fileName;
                                                                    meshMeta["format"] = ext.substr(1); // Remove the dot
                                                                    
                                                                    fs::path metaFile = contentDir / (meshName + ".plume_mesh");
                                                                    std::ofstream ofs(metaFile.string());
                                                                    if (ofs.is_open()) {
                                                                        ofs << meshMeta.dump(2);
                                                                        ofs.close();
                                                                    }
                                                                    
                                                                    createdAssets.push_back(meshName + ".plume_mesh");
                                                                    importedCount++;
                                                                } catch(...) {}
                                                            } else {
                                                                // For other files, just copy them
                                                                fs::path destFile = contentDir / fileName;
                                                                fs::copy_file(src, destFile, fs::copy_options::overwrite_existing);
                                                                createdAssets.push_back(fileName);
                                                                importedCount++;
                                                            }
                                                        } catch(...) {}
                                                    }
                                                    
                                                    // Send result back
                                                    nlohmann::json resultData;
                                                    resultData["importedCount"] = importedCount;
                                                    resultData["assets"] = nlohmann::json::array();
                                                    for (const auto& asset : createdAssets) {
                                                        resultData["assets"].push_back(asset);
                                                    }
                                                    
                                                    sendResult(importedCount > 0, importedCount > 0 ? 
                                                        std::to_string(importedCount) + " file(s) imported" : 
                                                        "Failed to import files", resultData);
                                                    
                                                    // Refresh the content listing
                                                    sendContentListFor(path);
                                                }
                                            }
                                            return S_OK;
                                        }

                                        // Import files (from drag & drop or file dialog)
                                        if (action == "import-files") {
                                            std::string targetPath = j.value("path", std::string());
                                            nlohmann::json files = j.value("files", nlohmann::json::array());
                                            
                                            if (!files.is_array() || files.empty()) {
                                                sendResult(false, "No files to import");
                                                return S_OK;
                                            }
                                            
                                            fs::path base = fs::path(g_app.uiFolder).parent_path();
                                            fs::path contentDir = base / targetPath;
                                            
                                            // Ensure the target directory exists
                                            try {
                                                if (!fs::exists(contentDir)) {
                                                    fs::create_directories(contentDir);
                                                }
                                            } catch(...) {}
                                            
                                            int importedCount = 0;
                                            std::vector<std::string> createdAssets;
                                            
                                            // Process each file
                                            for (const auto& fileObj : files) {
                                                std::string filePath = fileObj.value("path", std::string());
                                                std::string fileName = fileObj.value("name", std::string());
                                                
                                                if (filePath.empty() || fileName.empty()) continue;
                                                
                                                try {
                                                    fs::path src(filePath);
                                                    if (!fs::exists(src)) continue;
                                                    
                                                    // Get file extension
                                                    std::string ext = src.extension().string();
                                                    for (auto& c : ext) c = std::tolower(c);
                                                    
                                                    // Check if it's a 3D model
                                                    bool is3DModel = (ext == ".fbx" || ext == ".obj" || ext == ".glb" || ext == ".gltf");
                                                    
                                                    if (is3DModel) {
                                                        // Create a Static Mesh asset
                                                        std::string meshName = fs::path(fileName).stem().string();
                                                        fs::path meshFolder = contentDir / meshName;
                                                        
                                                        try {
                                                            // Create a .plume_mesh metadata file directly (no folder)
                                                            nlohmann::json meshMeta;
                                                            meshMeta["type"] = "StaticMesh";
                                                            meshMeta["sourceFile"] = fileName;
                                                            meshMeta["format"] = ext.substr(1); // Remove the dot
                                                            
                                                            fs::path metaFile = contentDir / (meshName + ".plume_mesh");
                                                            std::ofstream ofs(metaFile.string());
                                                            if (ofs.is_open()) {
                                                                ofs << meshMeta.dump(2);
                                                                ofs.close();
                                                            }
                                                            
                                                            createdAssets.push_back(meshName + ".plume_mesh");
                                                            importedCount++;
                                                        } catch(...) {}
                                                    } else {
                                                        // For other files, just copy them
                                                        fs::path destFile = contentDir / fileName;
                                                        fs::copy_file(src, destFile, fs::copy_options::overwrite_existing);
                                                        createdAssets.push_back(fileName);
                                                        importedCount++;
                                                    }
                                                } catch(...) {}
                                            }
                                            
                                            // Send result back
                                            nlohmann::json resultData;
                                            resultData["importedCount"] = importedCount;
                                            resultData["assets"] = nlohmann::json::array();
                                            for (const auto& asset : createdAssets) {
                                                resultData["assets"].push_back(asset);
                                            }
                                            
                                            sendResult(importedCount > 0, importedCount > 0 ? 
                                                std::to_string(importedCount) + " file(s) imported" : 
                                                "Failed to import files", resultData);
                                            
                                            // Refresh the content listing
                                            sendContentListFor(targetPath);
                                            return S_OK;
                                        }

                                        return S_OK;
                                    }).Get(),
                                nullptr);
                            
                            // Ensure page background transparency after navigation completes
                            if (g_app.webview) {
                                g_app.webview->add_NavigationCompleted(
                                    Callback<ICoreWebView2NavigationCompletedEventHandler>(
                                        [](ICoreWebView2* sender, ICoreWebView2NavigationCompletedEventArgs* args) -> HRESULT {
                                            // Log NavigationCompleted for diagnostics
                                            {
                                                std::ofstream diag("plume_diag.txt", std::ios::app);
                                                if (diag.is_open()) {
                                                    diag << "WebView NavigationCompleted\n";
                                                    diag.close();
                                                }
                                            }
                                            // Ensure the page DOM is transparent
                                            if (g_app.webview) {
                                                LPWSTR script = L"(function(){document.documentElement.style.background='transparent';document.body.style.background='transparent';document.body.style.backgroundColor='transparent';document.documentElement.style.backgroundColor='transparent';})();";
                                                g_app.webview->ExecuteScript(script, nullptr);
                                            }

                                            // Also re-assert controller default background color now that navigation is complete
                                            if (g_app.controller) {
                                                ComPtr<ICoreWebView2Controller2> controller2;
                                                if (SUCCEEDED(g_app.controller->QueryInterface(IID_PPV_ARGS(&controller2))) && controller2) {
                                                    COREWEBVIEW2_COLOR transparentColor = {0, 0, 0, 0};
                                                    controller2->put_DefaultBackgroundColor(transparentColor);
                                                }
                                            }

                                            return S_OK;
                                        }).Get(), nullptr);
                            }
                            std::wstring wurl = std::wstring(htmlPath.begin(), htmlPath.end());
                            g_app.webview->Navigate(wurl.c_str());
                            
                            return S_OK;
                        }).Get());
                return S_OK;
            }).Get());
}
#endif

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Enable high DPI support
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    
    // Créer et afficher le splash screen
    fs::path exePath = fs::current_path();
    
    // Chercher l'image du splash screen
    fs::path splashImagePath = exePath / ".." / ".." / "Assets" / "Branding" / "splash_image.png";
    if (!fs::exists(splashImagePath)) {
        splashImagePath = exePath / ".." / "Assets" / "Branding" / "splash_image.png";
    }
    if (!fs::exists(splashImagePath)) {
        splashImagePath = exePath / "Assets" / "Branding" / "splash_image.png";
    }
    
    std::wstring wSplashPath(splashImagePath.wstring());
    
    SplashScreen splash;
    splash.Create(wSplashPath, 600, 400);
    
    // Configurer la couleur du thème pour le splash screen
    std::string themeColor = GetCurrentThemeAccentColor();
    splash.SetAccentColor(themeColor);
    
    splash.Show();
    splash.UpdateProgress(0.0f, "Initializing Plume Engine...");
    
    // Initialiser le moteur
    Plume::Engine engine;
    engine.Init();
    g_app.engine = &engine;
    // Start a background input thread that polls the pressed keys and applies
    // continuous camera translation at ~60Hz while the app runs.
            std::thread([](){
        const std::chrono::milliseconds tick(16);
        while (!g_app.shouldClose.load()) {
            Plume::Vec3 moveDelta{0,0,0};
            bool has = false;
            {
                std::lock_guard<std::mutex> lk(g_app.keysMutex);
                for (const auto& k : g_app.pressedKeys) {
                    if (k == "w" || k == "arrowup") { moveDelta.z -= 0.1f; has = true; }
                    else if (k == "s" || k == "arrowdown") { moveDelta.z += 0.1f; has = true; }
                    else if (k == "a" || k == "arrowleft") { moveDelta.x -= 0.1f; has = true; }
                    else if (k == "d" || k == "arrowright") { moveDelta.x += 0.1f; has = true; }
                    else if (k == "q") { moveDelta.y -= 0.1f; has = true; }
                    else if (k == "e") { moveDelta.y += 0.1f; has = true; }
                }
            }
            if (has && g_app.engine) {
                // Fly camera: always follow pitch
                g_app.engine->TranslateCameraLocal(moveDelta, true);
            }
            std::this_thread::sleep_for(tick);
        }
    }).detach();
    splash.UpdateProgress(0.33f, "Loading scene...");
    
    // Initialiser le système de plugins
    splash.UpdateProgress(0.3f, "Loading plugins...");
    auto& pluginManager = Plume::PluginManager::Get();
    
    // Enregistrer les plugins disponibles
    splash.UpdateProgress(0.35f, "Registering plugins...");
    auto discordPlugin = std::make_shared<Plume::DiscordPresence>();
    pluginManager.RegisterPlugin(discordPlugin);
    
    // Initialiser tous les plugins activés
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
    
    // Localiser les fichiers UI
    fs::path uiEntryPath = exePath / ".." / "UI" / "index.html";
    if (!fs::exists(uiEntryPath)) {
        uiEntryPath = exePath / "UI" / "index.html";
    }
    if (!fs::exists(uiEntryPath)) {
        splash.Hide();
        MessageBoxA(NULL, "Cannot find UI/index.html", "Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    // Resolve the UI entry to a canonical absolute path (collapse any "..")
    std::string resolvedUiFolder;
    try {
        fs::path resolved = fs::canonical(uiEntryPath);
        resolvedUiFolder = resolved.parent_path().string();
    } catch(...) {
        // Fallback to absolute path if canonicalization fails
        fs::path resolved = fs::absolute(uiEntryPath);
        resolvedUiFolder = resolved.parent_path().string();
    }

    g_app.uiFolder = resolvedUiFolder;

    // Log resolved UI folder for diagnostics
    {
        std::ofstream diag("plume_diag.txt", std::ios::app);
        if (diag.is_open()) {
            diag << "Resolved UI folder: " << g_app.uiFolder << "\n";
            diag.close();
        }
    }
    splash.UpdateProgress(0.55f, "Exporting data...");
    ExportSceneData();
    ExportPluginData();
    ExportThemeData();
    // Ensure rendering data exists before the UI loads to avoid initial 404s
    ExportRenderingData();
    splash.UpdateProgress(0.6f, "Creating window...");
    
    // Créer la fenêtre principale (mais ne pas l'afficher encore)
    if (!CreateAppWindow()) {
        splash.Hide();
        return 1;
    }
    splash.UpdateProgress(0.7f, "Initializing WebView2...");
    
    // Initialiser WebView2
    std::string url = "file:///" + fs::absolute(uiEntryPath).string();
    for (auto& c : url) if (c == '\\') c = '/';
    // Create the WebView overlay (Editor owns the WebView2 instance)
    InitWebView(url);
    
    // Attendre que WebView2 se charge complètement
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    splash.UpdateProgress(1.0f, "Ready!");
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    
    // Masquer le splash screen
    splash.Hide();
    
    // Afficher la fenêtre maximisée avec l'animation Windows
    ShowWindow(g_app.hwnd, SW_MAXIMIZE);
    SetForegroundWindow(g_app.hwnd);

    // Initialize the renderer with the main window
    // The renderer will draw into the main window, and the WebView2 will overlay
    // the UI elements. The 3D viewport area will be determined by the web UI layout.
    RECT rc;
    GetClientRect(g_app.hwnd, &rc);
    uint32_t w = static_cast<uint32_t>(rc.right - rc.left);
    uint32_t h = static_cast<uint32_t>(rc.bottom - rc.top);
    
    // Log window size used for renderer init
    {
        std::ofstream diag("plume_diag.txt", std::ios::app);
        if (diag.is_open()) {
            diag << "Initializing renderer with main window size: " << w << "x" << h << "\n";
            diag.close();
        }
    }
    
    engine.InitRenderer(reinterpret_cast<void*>(g_app.hwnd), w, h, engine.GetCurrentGraphicsAPI());
    
    // Boucle principale
    MSG msg = {};
    auto lastExport = std::chrono::steady_clock::now();
    
    while (!g_app.shouldClose) {
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
        
        // Mettre à jour tous les plugins
        Plume::PluginManager::Get().UpdateAll();

        // Drive the engine renderer per-frame so the editor shows the scene
        if (g_app.engine) {
            if (g_app.engine->GetRenderer()) {
                g_app.engine->RenderFrame();
            }
        }
        
        // Toggle WebView visibility with Ctrl+T (edge detect)
        if (g_app.engine) {
            SHORT ctrlState = GetAsyncKeyState(VK_CONTROL);
            SHORT tState = GetAsyncKeyState('T');
            bool ctrlTPressed = ((ctrlState & 0x8000) != 0) && ((tState & 0x8000) != 0);
            if (ctrlTPressed && !g_app.lastCtrlT) {
                g_app.webviewVisible = !g_app.webviewVisible;
                if (g_app.controller) g_app.controller->put_IsVisible(g_app.webviewVisible ? TRUE : FALSE);
            }
            g_app.lastCtrlT = ctrlTPressed;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    
    Plume::PluginManager::Get().ShutdownAll();
    engine.Shutdown();
    return 0;
}
