#include "SplashScreen.h"
#include "Version.h"
#include "resource.h"

#ifdef _WIN32
#include <dwmapi.h>
#include <algorithm>
#pragma comment(lib, "dwmapi.lib")

SplashScreen::SplashScreen() 
    : m_hwnd(nullptr)
    , m_progress(0.0f)
    , m_accentColorHex("")
    , m_fontTitle(nullptr)
    , m_fontStatus(nullptr)
    , m_fontStatusBold(nullptr)
    , m_dpiScale(1.0f)
    , m_image(nullptr)
    , m_gdiplusToken(0)
{
    // Initialiser GDI+
    Gdiplus::GdiplusStartupInput gdiplusStartupInput;
    Gdiplus::GdiplusStartup(&m_gdiplusToken, &gdiplusStartupInput, NULL);
}

SplashScreen::~SplashScreen() {
    Close();
    
    // Nettoyer GDI+
    if (m_gdiplusToken) {
        Gdiplus::GdiplusShutdown(m_gdiplusToken);
    }
}

void SplashScreen::Close() {
    if (m_image) {
        delete m_image;
        m_image = nullptr;
    }
    if (m_fontTitle) {
        DeleteObject(m_fontTitle);
        m_fontTitle = nullptr;
    }
    if (m_fontStatus) {
        DeleteObject(m_fontStatus);
        m_fontStatus = nullptr;
    }
    if (m_fontStatusBold) {
        DeleteObject(m_fontStatusBold);
        m_fontStatusBold = nullptr;
    }
    if (m_hwnd) {
        DestroyWindow(m_hwnd);
        m_hwnd = nullptr;
    }
}

LRESULT CALLBACK SplashScreen::WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    SplashScreen* splash = reinterpret_cast<SplashScreen*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
    
    switch (msg) {
        case WM_CREATE: {
            CREATESTRUCT* cs = reinterpret_cast<CREATESTRUCT*>(lParam);
            SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(cs->lpCreateParams));
            return 0;
        }
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);
            if (splash) {
                splash->Paint(hdc);
            }
            EndPaint(hwnd, &ps);
            return 0;
        }
        case WM_ERASEBKGND:
            return 1;
        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
}

bool SplashScreen::Create(const std::wstring& imagePath, int width, int height) {
    // Charger l'image PNG
    m_image = Gdiplus::Image::FromFile(imagePath.c_str());
    if (!m_image || m_image->GetLastStatus() != Gdiplus::Ok) {
        if (m_image) {
            delete m_image;
            m_image = nullptr;
        }
        // Continue without image if loading fails
    }
    
    // Determine DPI scale for current display
    HDC screenDC = GetDC(NULL);
    int dpiY = GetDeviceCaps(screenDC, LOGPIXELSY);
    ReleaseDC(NULL, screenDC);
    m_dpiScale = static_cast<float>(dpiY) / 96.0f;

    // Scale requested window size according to DPI
    int scaledWidth = static_cast<int>(width * m_dpiScale);
    int scaledHeight = static_cast<int>(height * m_dpiScale);

    // Create fonts
    int titleSize = static_cast<int>(42.0f * m_dpiScale);
    int statusSize = static_cast<int>(14.0f * m_dpiScale);

    m_fontTitle = CreateFontW(
        titleSize, 0, 0, 0, FW_LIGHT, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE,
        L"Segoe UI"
    );
    
    m_fontStatus = CreateFontW(
        statusSize, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE,
        L"Segoe UI"
    );

    int statusBoldSize = statusSize + 15; // slightly larger for emphasis
    m_fontStatusBold = CreateFontW(
        statusBoldSize, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE,
        L"Segoe UI"
    );
    
    // Register window class
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = L"PlumeSplashScreen";
    wc.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(IDI_ICON1));
    wc.hIconSm = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(IDI_ICON1));
    
    RegisterClassExW(&wc);
    
    // Calculate centered position
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);
    int x = (screenWidth - scaledWidth) / 2;
    int y = (screenHeight - scaledHeight) / 2;
    
    // Create borderless window
    m_hwnd = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_LAYERED,
        L"PlumeSplashScreen",
        L"" PLUME_WINDOW_TITLE,
        WS_POPUP,
        x, y, scaledWidth, scaledHeight,
        NULL, NULL, GetModuleHandle(NULL), this
    );
    
    if (!m_hwnd) {
        return false;
    }
    
    // Make window semi-transparent
    SetLayeredWindowAttributes(m_hwnd, 0, 255, LWA_ALPHA);
    
    // Activer les coins arrondis (Windows 11)
    DWM_WINDOW_CORNER_PREFERENCE corner = DWMWCP_ROUND;
    DwmSetWindowAttribute(m_hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &corner, sizeof(corner));
    
    return true;
}

void SplashScreen::Show() {
    if (m_hwnd) {
        ShowWindow(m_hwnd, SW_SHOW);
        UpdateWindow(m_hwnd);
    }
}

void SplashScreen::Hide() {
    if (m_hwnd) {
        ShowWindow(m_hwnd, SW_HIDE);
    }
}

void SplashScreen::UpdateProgress(float progress, const std::string& statusText) {
    m_progress = progress;
    m_statusText = statusText;
    
    if (m_hwnd) {
        // Invalidate and force immediate redraw
        InvalidateRect(m_hwnd, NULL, FALSE);
        RedrawWindow(m_hwnd, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW | RDW_ERASE);
        UpdateWindow(m_hwnd);

        // Process messages to keep interface responsive
        MSG msg;
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }
}

void SplashScreen::SetAccentColor(const std::string& hexColor) {
    m_accentColorHex = hexColor;
}

void SplashScreen::Paint(HDC hdc) {
    RECT rect;
    GetClientRect(m_hwnd, &rect);
    
    // Create buffer for double buffering
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP memBitmap = CreateCompatibleBitmap(hdc, rect.right, rect.bottom);
    HBITMAP oldBitmap = (HBITMAP)SelectObject(memDC, memBitmap);
    
    // Fond uniforme (sans gradient)
    HBRUSH bgBrush = CreateSolidBrush(RGB(30, 30, 30)); // #1E1E1E
    FillRect(memDC, &rect, bgBrush);
    DeleteObject(bgBrush);
    
    // Draw PNG image if available (vertically centered)
    SetBkMode(memDC, TRANSPARENT);
    
    int imgHeight = 0;
    if (m_image) {
        Gdiplus::Graphics graphics(memDC);
        graphics.SetSmoothingMode(Gdiplus::SmoothingModeAntiAlias);
        graphics.SetInterpolationMode(Gdiplus::InterpolationModeHighQualityBicubic);

        // Draw image using "cover" behavior: scale to fully cover the client rect
        int origW = m_image->GetWidth();
        int origH = m_image->GetHeight();

        float scaleX = static_cast<float>(rect.right) / static_cast<float>(origW);
        float scaleY = static_cast<float>(rect.bottom) / static_cast<float>(origH);
        float scale = (scaleX > scaleY) ? scaleX : scaleY; // use max to cover

        int drawW = static_cast<int>(origW * scale);
        int drawH = static_cast<int>(origH * scale);

        int imgX = (rect.right - drawW) / 2;
        int imgY = (rect.bottom - drawH) / 2; // center vertically in full splash rect

        graphics.DrawImage(m_image, imgX, imgY, drawW, drawH);
    }
    
    // Barre de progression (en haut, pleine largeur)
    int barWidth = rect.right; // full width
    int barHeight = (2 > static_cast<int>(6 * m_dpiScale)) ? 2 : static_cast<int>(6 * m_dpiScale);
    int barX = 0;
    int barY = rect.bottom - barHeight; // flush to bottom
    
    // Determine accent color early (used for bar and loading text)
    COLORREF accentColor = RGB(79, 195, 247); // Default color
    if (!m_accentColorHex.empty()) {
        std::string hex = m_accentColorHex;
        if (hex.length() == 6) {
            int r = std::stoi(hex.substr(0, 2), nullptr, 16);
            int g = std::stoi(hex.substr(2, 2), nullptr, 16);
            int b = std::stoi(hex.substr(4, 2), nullptr, 16);
            accentColor = RGB(r, g, b);
        }
    }

    // Fond de la barre
    HBRUSH barBgBrush = CreateSolidBrush(RGB(58, 58, 58));
    RECT barBgRect = {barX, barY, barX + barWidth, barY + barHeight};
    FillRect(memDC, &barBgRect, barBgBrush);
    DeleteObject(barBgBrush);
    
    // Progress bar with dynamic theme color
    int progressWidth = static_cast<int>(barWidth * m_progress);
    if (progressWidth > 0) {
        HBRUSH progressBrush = CreateSolidBrush(accentColor);
        RECT progressRect = {barX, barY, barX + progressWidth, barY + barHeight};
        FillRect(memDC, &progressRect, progressBrush);
        DeleteObject(progressBrush);
    }
    
    // Top-left title: use same size/color as version (m_fontStatus, #808080)
    int margin = static_cast<int>(12 * m_dpiScale);
    SelectObject(memDC, m_fontStatus);
    SetTextColor(memDC, RGB(128, 128, 128)); // #808080
    RECT topLeftRect = {margin, margin, rect.right - margin, margin + static_cast<int>(20 * m_dpiScale)};
    DrawTextW(memDC, L"Plume Engine", -1, &topLeftRect, DT_LEFT | DT_VCENTER | DT_SINGLELINE);

    // Bottom-left: Version followed by Created by Noa Second on same line
    SelectObject(memDC, m_fontStatus);
    // Version color
    SetTextColor(memDC, RGB(128, 128, 128)); // #808080
    std::wstring versionStr = L"Version ";
    versionStr += std::wstring(L"" PLUME_VERSION_STRING);
    versionStr += L" - ";
    versionStr += std::wstring(L"Created by Noa Second");
    // Place bottom-left info above the progress bar with padding
    int padding = static_cast<int>(8 * m_dpiScale);
    int textH = static_cast<int>(20 * m_dpiScale);
    int bottomLeftTop = rect.bottom - barHeight - padding - textH;
    int bottomLeftBottom = bottomLeftTop + textH;
    RECT bottomLeftRect = {margin, bottomLeftTop, rect.right - margin, bottomLeftBottom};
    DrawTextW(memDC, versionStr.c_str(), -1, &bottomLeftRect, DT_LEFT | DT_VCENTER | DT_SINGLELINE);

    // Status text (centered above the bottom-left line) — bold and accent color
    if (!m_statusText.empty()) {
        SetTextColor(memDC, accentColor);
        SelectObject(memDC, m_fontStatusBold);
        std::wstring wStatus(m_statusText.begin(), m_statusText.end());
        int statusBottom = bottomLeftTop - padding;
        RECT textRect = {0, statusBottom - textH, rect.right, statusBottom};
        DrawTextW(memDC, wStatus.c_str(), -1, &textRect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
        // restore normal font for other text
        SelectObject(memDC, m_fontStatus);
        SetTextColor(memDC, RGB(128, 128, 128));
    }
    
    // Copy buffer to screen
    BitBlt(hdc, 0, 0, rect.right, rect.bottom, memDC, 0, 0, SRCCOPY);
    
    // Nettoyer
    SelectObject(memDC, oldBitmap);
    DeleteObject(memBitmap);
    DeleteDC(memDC);
}

#endif
