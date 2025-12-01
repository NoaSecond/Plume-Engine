#include "SplashScreen.h"
#include "Version.h"
#include "resource.h"

#ifdef _WIN32
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")

SplashScreen::SplashScreen() 
    : m_hwnd(nullptr)
    , m_progress(0.0f)
    , m_fontTitle(nullptr)
    , m_fontStatus(nullptr)
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
        // Continuer sans image si le chargement échoue
    }
    
    // Créer les fonts
    m_fontTitle = CreateFontW(
        42, 0, 0, 0, FW_LIGHT, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE,
        L"Segoe UI"
    );
    
    m_fontStatus = CreateFontW(
        14, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE,
        L"Segoe UI"
    );
    
    // Enregistrer la classe de fenêtre
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
    
    // Calculer la position centrée
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);
    int x = (screenWidth - width) / 2;
    int y = (screenHeight - height) / 2;
    
    // Créer la fenêtre sans bordure
    m_hwnd = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_LAYERED,
        L"PlumeSplashScreen",
        L"" PLUME_WINDOW_TITLE,
        WS_POPUP,
        x, y, width, height,
        NULL, NULL, GetModuleHandle(NULL), this
    );
    
    if (!m_hwnd) {
        return false;
    }
    
    // Rendre la fenêtre semi-transparente
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
        InvalidateRect(m_hwnd, NULL, FALSE);
        UpdateWindow(m_hwnd);
        
        // Traiter les messages pour maintenir l'interface réactive
        MSG msg;
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }
}

void SplashScreen::Paint(HDC hdc) {
    RECT rect;
    GetClientRect(m_hwnd, &rect);
    
    // Créer un buffer pour le double buffering
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP memBitmap = CreateCompatibleBitmap(hdc, rect.right, rect.bottom);
    HBITMAP oldBitmap = (HBITMAP)SelectObject(memDC, memBitmap);
    
    // Fond dégradé (simulé avec rectangles)
    HBRUSH bgBrush = CreateSolidBrush(RGB(30, 30, 30)); // #1E1E1E
    FillRect(memDC, &rect, bgBrush);
    DeleteObject(bgBrush);
    
    // Gradient subtil en haut
    for (int i = 0; i < 100; i++) {
        int gray = 30 + (15 * i / 100);
        HBRUSH brush = CreateSolidBrush(RGB(gray, gray, gray));
        RECT gradRect = {0, i, rect.right, i + 1};
        FillRect(memDC, &gradRect, brush);
        DeleteObject(brush);
    }
    
    // Dessiner l'image PNG si disponible (centrée verticalement)
    SetBkMode(memDC, TRANSPARENT);
    
    int imgHeight = 0;
    if (m_image) {
        Gdiplus::Graphics graphics(memDC);
        graphics.SetSmoothingMode(Gdiplus::SmoothingModeAntiAlias);
        graphics.SetInterpolationMode(Gdiplus::InterpolationModeHighQualityBicubic);
        
        int imgWidth = m_image->GetWidth();
        imgHeight = m_image->GetHeight();
        
        // Centrer l'image verticalement dans la moitié supérieure
        int imgX = (rect.right - imgWidth) / 2;
        int imgY = (rect.bottom / 2 - imgHeight) / 2;
        
        graphics.DrawImage(m_image, imgX, imgY, imgWidth, imgHeight);
    }
    
    // Barre de progression (au centre)
    int barWidth = 300;
    int barHeight = 4;
    int barX = (rect.right - barWidth) / 2;
    int barY = rect.bottom / 2 + 20;
    
    // Fond de la barre
    HBRUSH barBgBrush = CreateSolidBrush(RGB(58, 58, 58));
    RECT barBgRect = {barX, barY, barX + barWidth, barY + barHeight};
    FillRect(memDC, &barBgRect, barBgBrush);
    DeleteObject(barBgBrush);
    
    // Progression avec gradient
    int progressWidth = static_cast<int>(barWidth * m_progress);
    if (progressWidth > 0) {
        // Gradient de la barre de progression
        for (int i = 0; i < progressWidth; i++) {
            float ratio = static_cast<float>(i) / barWidth;
            int r = 79 + static_cast<int>((2 - 79) * ratio);
            int g = 195 + static_cast<int>((136 - 195) * ratio);
            int b = 247 + static_cast<int>((209 - 247) * ratio);
            
            HBRUSH progressBrush = CreateSolidBrush(RGB(r, g, b));
            RECT progressRect = {barX + i, barY, barX + i + 1, barY + barHeight};
            FillRect(memDC, &progressRect, progressBrush);
            DeleteObject(progressBrush);
        }
    }
    
    // Titre "PLUME ENGINE" sous la barre
    SelectObject(memDC, m_fontTitle);
    SetTextColor(memDC, RGB(232, 232, 232)); // #E8E8E8
    
    RECT titleRect = {0, barY + 30, rect.right, barY + 80};
    DrawTextW(memDC, L"PLUME ENGINE", -1, &titleRect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    // Version
    SelectObject(memDC, m_fontStatus);
    SetTextColor(memDC, RGB(128, 128, 128)); // #808080
    RECT versionRect = {0, barY + 75, rect.right, barY + 95};
    DrawTextW(memDC, L"Version " PLUME_VERSION_STRING, -1, &versionRect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    // Texte de statut (en bas)
    if (!m_statusText.empty()) {
        SetTextColor(memDC, RGB(184, 184, 184)); // #B8B8B8
        std::wstring wStatus(m_statusText.begin(), m_statusText.end());
        
        RECT textRect = {0, rect.bottom - 50, rect.right, rect.bottom - 30};
        DrawTextW(memDC, wStatus.c_str(), -1, &textRect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    }
    
    // Footer
    SetTextColor(memDC, RGB(96, 96, 96)); // #606060
    RECT footerRect = {0, rect.bottom - 25, rect.right, rect.bottom - 5};
    DrawTextW(memDC, L"Created by Noa Second", -1, &footerRect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    // Copier le buffer vers l'écran
    BitBlt(hdc, 0, 0, rect.right, rect.bottom, memDC, 0, 0, SRCCOPY);
    
    // Nettoyer
    SelectObject(memDC, oldBitmap);
    DeleteObject(memBitmap);
    DeleteDC(memDC);
}

#endif
