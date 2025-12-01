#include <Core/Engine.h>
#include <Core/DiscordPresence.h>
#include <string>
#include <filesystem>
#include <fstream>
#include <thread>
#include <chrono>
#include <atomic>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <dwmapi.h>
#include <wrl.h>
#include "WebView2.h"
#include "SplashScreen.h"
#include "resource.h"
#include "Version.h"
using namespace Microsoft::WRL;
#pragma comment(lib, "dwmapi.lib")
#endif

namespace fs = std::filesystem;

struct AppState {
    HWND hwnd = nullptr;
    ComPtr<ICoreWebView2Controller> controller;
    ComPtr<ICoreWebView2> webview;
    Plume::Engine* engine = nullptr;
    std::string uiFolder;
    std::atomic<bool> shouldClose{false};
    bool isFullscreen = false; // Track windowed fullscreen state - starts as false
};

static AppState g_app;

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

#ifdef _WIN32
LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_SIZE:
            if (g_app.controller) {
                RECT bounds;
                GetClientRect(hwnd, &bounds);
                g_app.controller->put_Bounds(bounds);
            }
            return 0;
        case WM_GETMINMAXINFO: {
            // Ajuster la taille maximale pour éviter que la fenêtre dépasse
            MINMAXINFO* mmi = (MINMAXINFO*)lParam;
            MONITORINFO mi = { sizeof(mi) };
            GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
            
            // Utiliser la zone de travail (avec barre des tâches)
            mmi->ptMaxSize.x = mi.rcWork.right - mi.rcWork.left;
            mmi->ptMaxSize.y = mi.rcWork.bottom - mi.rcWork.top;
            mmi->ptMaxPosition.x = mi.rcWork.left;
            mmi->ptMaxPosition.y = mi.rcWork.top;
            return 0;
        }
        case WM_NCHITTEST: {
            // Permettre le drag de la fenêtre en cliquant sur le header (32px de hauteur)
            LRESULT hit = DefWindowProc(hwnd, msg, wParam, lParam);
            if (hit == HTCLIENT) {
                POINT pt = { GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam) };
                ScreenToClient(hwnd, &pt);
                
                // Si on clique dans les 32 premiers pixels (header), permettre le drag
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
                    // La fenêtre est maximisée - ajuster pour éviter le débordement
                    MONITORINFO mi = { sizeof(mi) };
                    GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), &mi);
                    // Ajuster la zone client pour correspondre exactement à la zone de travail
                    params->rgrc[0] = mi.rcWork;
                } else {
                    // En mode fenêtré, supprimer uniquement la barre de titre mais garder les bordures
                    // Réduire seulement le haut pour enlever la barre de titre
                    params->rgrc[0].top += 0;  // Pas d'offset - enlève complètement la barre de titre
                    params->rgrc[0].left += 0;
                    params->rgrc[0].right -= 0;
                    params->rgrc[0].bottom -= 0;
                }
                return 0;
            }
            break;
        }
        case WM_SYSCOMMAND: {
            // Gérer les commandes système pour le snap
            if ((wParam & 0xFFF0) == SC_MAXIMIZE || 
                (wParam & 0xFFF0) == SC_RESTORE) {
                // Laisser Windows gérer maximize/restore
                break;
            }
            return DefWindowProc(hwnd, msg, wParam, lParam);
        }
        case WM_CLOSE:
            g_app.shouldClose = true;
            DestroyWindow(hwnd);
            return 0;
        case WM_DESTROY:
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
    
    // Ne pas afficher la fenêtre tout de suite - on attend la fin du splash screen
    // mais la créer en mode minimisé invisible pour permettre à WebView2 de se charger
    ShowWindow(g_app.hwnd, SW_SHOWMINNOACTIVE);
    UpdateWindow(g_app.hwnd);
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
                            
                            RECT bounds;
                            GetClientRect(g_app.hwnd, &bounds);
                            controller->put_Bounds(bounds);
                            
                            // Configurer WebView2 pour permettre le drag
                            ComPtr<ICoreWebView2Settings> settings;
                            g_app.webview->get_Settings(&settings);
                            if (settings) {
                                settings->put_AreDefaultContextMenusEnabled(TRUE);
                                settings->put_IsStatusBarEnabled(FALSE);
                            }
                            
                            // Désactiver la capture de la souris par défaut pour permettre le drag
                            ComPtr<ICoreWebView2Controller3> controller3;
                            controller->QueryInterface(IID_PPV_ARGS(&controller3));
                            if (controller3) {
                                controller3->put_ShouldDetectMonitorScaleChanges(TRUE);
                            }
                            
                            // Écouter les messages depuis le frontend
                            g_app.webview->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [](ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                                        LPWSTR messageRaw;
                                        args->get_WebMessageAsJson(&messageRaw);
                                        std::wstring message(messageRaw);
                                        CoTaskMemFree(messageRaw);
                                        
                                        // Parse simple: chercher "minimize", "maximize", "close", "start-drag"
                                        if (message.find(L"start-drag") != std::wstring::npos) {
                                            // Simuler un drag de la fenêtre
                                            ReleaseCapture();
                                            SendMessage(g_app.hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                                        }
                                        else if (message.find(L"minimize") != std::wstring::npos) {
                                            ShowWindow(g_app.hwnd, SW_MINIMIZE);
                                        }
                                        else if (message.find(L"maximize") != std::wstring::npos) {
                                            // Utiliser les commandes natives Windows pour les animations
                                            if (IsZoomed(g_app.hwnd)) {
                                                // La fenêtre est maximisée, la restaurer
                                                ShowWindow(g_app.hwnd, SW_RESTORE);
                                            } else {
                                                // La fenêtre n'est pas maximisée, la maximiser
                                                ShowWindow(g_app.hwnd, SW_MAXIMIZE);
                                            }
                                        }
                                        else if (message.find(L"close") != std::wstring::npos) {
                                            g_app.shouldClose = true;
                                            PostMessage(g_app.hwnd, WM_CLOSE, 0, 0);
                                        }
                                        
                                        return S_OK;
                                    }).Get(),
                                nullptr);
                            
                            std::wstring wurl = std::wstring(htmlPath.begin(), htmlPath.end());
                            g_app.webview->Navigate(wurl.c_str());
                            
                            return S_OK;
                        }).Get());
                return S_OK;
            }).Get());
}
#endif

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
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
    splash.Show();
    splash.UpdateProgress(0.0f, "Initializing Plume Engine...");
    
    // Initialiser le moteur
    Plume::Engine engine;
    engine.Init();
    g_app.engine = &engine;
    splash.UpdateProgress(0.33f, "Loading scene...");
    
    // Initialiser Discord Rich Presence
    Plume::DiscordPresence::Get().Init();
    Plume::DiscordPresence::Get().SetState("In Editor");
    Plume::DiscordPresence::Get().SetDetails("Editing a Scene");
    Plume::DiscordPresence::Get().SetLargeImage("plume_logo", "Plume Engine");
    Plume::DiscordPresence::Get().Update();
    
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
    
    g_app.uiFolder = uiEntryPath.parent_path().string();
    ExportSceneData();
    splash.UpdateProgress(0.5f, "Creating window...");
    
    // Créer la fenêtre principale (mais ne pas l'afficher encore)
    if (!CreateAppWindow()) {
        splash.Hide();
        return 1;
    }
    splash.UpdateProgress(0.66f, "Initializing WebView2...");
    
    // Initialiser WebView2
    std::string url = "file:///" + fs::absolute(uiEntryPath).string();
    for (auto& c : url) if (c == '\\') c = '/';
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
            lastExport = now;
        }
        
        // Mettre à jour Discord Rich Presence
        Plume::DiscordPresence::Get().Update();
        
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    
    Plume::DiscordPresence::Get().Shutdown();
    engine.Shutdown();
    return 0;
}
