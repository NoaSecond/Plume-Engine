#pragma once

#ifdef _WIN32
#include <windows.h>
#include <gdiplus.h>
#include <string>

class SplashScreen {
public:
    SplashScreen();
    ~SplashScreen();
    
    bool Create(const std::wstring& imagePath, int width, int height);
    void Show();
    void Hide();
    void UpdateProgress(float progress, const std::string& statusText);
    void SetAccentColor(const std::string& hexColor);
    void Close();
    bool IsVisible() const { return m_hwnd != nullptr && IsWindowVisible(m_hwnd); }
    
private:
    static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    void Paint(HDC hdc);
    
    HWND m_hwnd;
    float m_progress;
    std::string m_statusText;
    std::string m_accentColorHex;
    HFONT m_fontTitle;
    HFONT m_fontStatus;
    HFONT m_fontStatusBold;
    float m_dpiScale;
    Gdiplus::Image* m_image;
    ULONG_PTR m_gdiplusToken;
};

#endif
