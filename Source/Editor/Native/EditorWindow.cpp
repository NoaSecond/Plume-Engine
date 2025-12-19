#include "EditorWindow.h"
#include "resource.h"
#include <dwmapi.h>
#include <windowsx.h>

extern void ToggleWebViewVisibility(); // Forward declaration or handled via callback?
// Ideally EditorWindow shouldn't know about ToggleWebViewVisibility if it's in WebViewManager.
// We might need to register callbacks or access WebViewManager via AppState if we move Toggle there.
// For now, let's assume we can access it or refactor the hotkey handling.

// Global pointer for WindowProc to access AppState
static AppState* g_pAppState = nullptr;

void EditorWindow::SetAppState(AppState* appState) {
    g_pAppState = appState;
}

LRESULT CALLBACK EditorWindow::WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (!g_pAppState) return DefWindowProc(hwnd, msg, wParam, lParam);
    AppState& app = *g_pAppState;

    switch (msg) {
        case WM_HOTKEY: {
            if (wParam == 1) {
                // ToggleWebViewVisibility(); 
                // We need to implement this toggling logic here or call a manager.
                // Since this logic acts on app.webview, we can do it here directly or delegate.
                app.webviewVisible = !app.webviewVisible;
                if (app.controller) {
                    app.controller->put_IsVisible(app.webviewVisible);
                }
                return 0;
            }
            break;
        }
        case WM_SIZE:
            if (app.controller) {
                // Resize WebView2 to fill the entire client area
                RECT bounds;
                GetClientRect(hwnd, &bounds);
                app.controller->put_Bounds(bounds);
                
                // Note: Renderer swapchain resize should be handled elsewhere or notified
            }
            return 0;
        case WM_GETMINMAXINFO: {
            MINMAXINFO* mmi = (MINMAXINFO*)lParam;
            MONITORINFO mi = { sizeof(mi) };
            GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTOPRIMARY), &mi);
            
            mmi->ptMaxSize.x = mi.rcWork.right - mi.rcWork.left;
            mmi->ptMaxSize.y = mi.rcWork.bottom - mi.rcWork.top;
            mmi->ptMaxPosition.x = mi.rcWork.left;
            mmi->ptMaxPosition.y = mi.rcWork.top;
            return 0;
        }
        case WM_NCHITTEST: {
            LRESULT hit = DefWindowProc(hwnd, msg, wParam, lParam);
            if (hit == HTCLIENT) {
                POINT pt = { GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam) };
                ScreenToClient(hwnd, &pt);
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
                    MONITORINFO mi = { sizeof(mi) };
                    GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), &mi);
                    params->rgrc[0] = mi.rcWork;
                }
                return 0;
            }
            break;
        }
        case WM_CLOSE:
            app.shouldClose = true;
            DestroyWindow(hwnd);
            return 0;
        case WM_DESTROY:
            UnregisterHotKey(hwnd, 1);
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

bool EditorWindow::CreateAppWindow(AppState& appState) {
    SetAppState(&appState);
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
    
    appState.hwnd = CreateWindowExW(
        0, L"PlumeEngineWindow", L"Plume Engine Editor", // HARDCODED TITLE for now or use L"Plume Engine"
        WS_OVERLAPPEDWINDOW | WS_THICKFRAME,
        CW_USEDEFAULT, CW_USEDEFAULT, 1600, 900,
        NULL, NULL, hInstance, NULL
    );
    
    if (!appState.hwnd) return false;
    
    DWM_WINDOW_CORNER_PREFERENCE corner = DWMWCP_ROUND;
    DwmSetWindowAttribute(appState.hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &corner, sizeof(corner));
    
    ShowWindow(appState.hwnd, SW_SHOWMINNOACTIVE);
    UpdateWindow(appState.hwnd);

    RegisterHotKey(appState.hwnd, 1, MOD_CONTROL, 'T');
    
    return true;
}
