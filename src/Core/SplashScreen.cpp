// src/Core/SplashScreen.cpp
#include "SplashScreen.h"

#include <SDL2/SDL.h>
#include <stb_image.h>
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <regex>
// Simple JSON parsing helper (we avoid adding a dependency on jsoncpp)
static std::string ExtractJsonString(const std::string& src, const std::string& key) {
    try {
        // regex: "key"\s*:\s*"([^"]*)"
        std::regex re(std::string("\"") + key + "\"\\s*:\\s*\"([^\"]*)\"");
        std::smatch m;
        if (std::regex_search(src, m, re) && m.size() >= 2) {
            return m[1].str();
        }
    } catch (const std::exception&) {
        // fall through
    }
    return std::string();
}

static int ExtractJsonInt(const std::string& src, const std::string& key, int defaultVal) {
    try {
        // regex: "key"\s*:\s*(-?\d+)
        std::regex re(std::string("\"") + key + "\"\\s*:\\s*(-?\\d+)");
        std::smatch m;
        if (std::regex_search(src, m, re) && m.size() >= 2) {
            try { return std::stoi(m[1].str()); } catch (...) { }
        }
    } catch (const std::exception&) {
        // fall through
    }
    return defaultVal;
}

static int ClampInt(int v, int lo, int hi) { return std::max(lo, std::min(hi, v)); }

void SplashScreen::ShowFromConfig(const std::string& metaPath) {
    std::string path = "assets/icons/PlumeSplash.png";
    int duration = 1500;
    int fadeMs = 300;

    std::ifstream f(metaPath);
    if (f) {
        std::stringstream ss; ss << f.rdbuf();
        std::string content = ss.str();
        std::string s = ExtractJsonString(content, "splash_path"); if (!s.empty()) path = s;
        duration = ExtractJsonInt(content, "splash_duration_ms", duration);
        fadeMs = ExtractJsonInt(content, "splash_fade_ms", fadeMs);
    }
    // Clamp sensible values
    duration = ClampInt(duration, 0, 60000);
    fadeMs = ClampInt(fadeMs, 0, duration);
    // Call general Show with fade handled as part of duration (split between in/out)
    // We'll pass duration and handle fade separately using fadeMs below by calling internal helper
    // For simplicity, reuse Show and then apply fade via a small wrapper below (we'll implement Show with fade parameters next)
    // But since Show currently has no fade param, call an internal implementation below
    // We'll implement a new internal function for full behavior
    
    Show(path, duration, fadeMs);
}

// NOTE: We will implement fade inside this Show overload below by reading an optional locally stored fadeMs.
void SplashScreen::Show(const std::string& imagePath, int durationMs, int fadeMs) {
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        std::cerr << "SplashScreen: SDL_Init failed: " << SDL_GetError() << std::endl;
        return;
    }

    int imgW = 0, imgH = 0, channels = 0;
    stbi_set_flip_vertically_on_load(0);
    unsigned char* pixels = stbi_load(imagePath.c_str(), &imgW, &imgH, &channels, STBI_rgb_alpha);
    stbi_set_flip_vertically_on_load(1);

    if (!pixels) {
        std::cerr << "SplashScreen: failed to load image '" << imagePath << "'" << std::endl;
        return;
    }

    // Create a borderless window sized to the image (but not larger than screen)
    int displayIndex = 0;
    SDL_Rect displayBounds;
    if (SDL_GetDisplayBounds(displayIndex, &displayBounds) != 0) {
        // If we can't get display bounds, fall back to the image size
        displayBounds.x = 0; displayBounds.y = 0; displayBounds.w = imgW; displayBounds.h = imgH;
    }
    int winW = imgW;
    int winH = imgH;
    float scale = 1.0f;
    if (winW > displayBounds.w || winH > displayBounds.h) {
        // scale down to fit display while preserving aspect ratio
        float sx = (float)displayBounds.w / (float)winW;
        float sy = (float)displayBounds.h / (float)winH;
        scale = (sx < sy) ? sx : sy;
        winW = (int)(winW * scale);
        winH = (int)(winH * scale);
    }

    // Create a borderless, always-on-top window to emulate engine splash look
    Uint32 windowFlags = SDL_WINDOW_SHOWN | SDL_WINDOW_BORDERLESS;
    SDL_Window* win = SDL_CreateWindow("", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, winW, winH, windowFlags);
    if (!win) {
        std::cerr << "SplashScreen: SDL_CreateWindow failed: " << SDL_GetError() << std::endl;
        stbi_image_free(pixels);
        return;
    }

    SDL_Surface* screenSurface = SDL_GetWindowSurface(win);
    if (!screenSurface) {
        std::cerr << "SplashScreen: SDL_GetWindowSurface failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(win);
        stbi_image_free(pixels);
        return;
    }

    // Create an SDL surface from the loaded pixels (RGBA) and blit to the window surface
    SDL_Surface* imgSurface = SDL_CreateRGBSurfaceFrom((void*)pixels, imgW, imgH, 32, imgW * 4,
                                                       0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000);
    if (!imgSurface) {
        std::cerr << "SplashScreen: SDL_CreateRGBSurfaceFrom failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(win);
        stbi_image_free(pixels);
        return;
    }

    // Scale if window size differs
    SDL_Rect destRect = {0, 0, winW, winH};
    // We'll implement fade-in / hold / fade-out phases
    // Default fade durations (ms) provided by caller
    int halfFade = fadeMs / 2;
    int holdMs = durationMs - fadeMs;
    if (holdMs < 0) { halfFade = durationMs / 2; holdMs = 0; }

    // Pre-blit the image scaled to the window size into a surface we will blit repeatedly
    SDL_Surface* blitSurface = SDL_CreateRGBSurface(0, winW, winH, 32, 0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000);
    if (!blitSurface) {
        std::cerr << "SplashScreen: SDL_CreateRGBSurface failed: " << SDL_GetError() << std::endl;
    } else {
        SDL_BlitScaled(imgSurface, nullptr, blitSurface, nullptr);
    }

    // Ensure window opacity control is available on platform. SDL_SetWindowOpacity returns 0 on success.
    float opacity = 0.0f;
    SDL_SetWindowOpacity(win, opacity);
    SDL_UpdateWindowSurface(win);

    Uint32 start = SDL_GetTicks();
    bool running = true;
    int lastX = 0, lastY = 0;
    // remember center position to re-apply if moved (prevent moving)
    SDL_GetWindowPosition(win, &lastX, &lastY);

    auto pump_and_check = [&]() -> bool {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) { return false; }
            if (e.type == SDL_KEYDOWN || e.type == SDL_MOUSEBUTTONDOWN) { return false; }
            if (e.type == SDL_WINDOWEVENT) {
                if (e.window.event == SDL_WINDOWEVENT_MOVED) {
                    // Reposition back to original position to prevent moving
                    SDL_SetWindowPosition(win, lastX, lastY);
                }
            }
        }
        return true;
    };

    // Fade-in
    Uint32 t0 = SDL_GetTicks();
    while (true) {
        Uint32 now = SDL_GetTicks();
        int elapsed = (int)(now - t0);
        if (!pump_and_check()) break;
        float alpha = (fadeMs > 0) ? (float)elapsed / (float)halfFade : 1.0f;
        if (alpha > 1.0f) alpha = 1.0f;
        SDL_SetWindowOpacity(win, alpha);
        if (blitSurface) SDL_BlitSurface(blitSurface, nullptr, screenSurface, nullptr);
        SDL_UpdateWindowSurface(win);
        if (elapsed >= halfFade) break;
        SDL_Delay(10);
    }

    // Hold
    if (holdMs > 0) {
        Uint32 holdStart = SDL_GetTicks();
        while ((int)(SDL_GetTicks() - holdStart) < holdMs) {
            if (!pump_and_check()) break;
            if (blitSurface) SDL_BlitSurface(blitSurface, nullptr, screenSurface, nullptr);
            SDL_UpdateWindowSurface(win);
            SDL_Delay(10);
        }
    }

    // Fade-out
    t0 = SDL_GetTicks();
    while (true) {
        Uint32 now = SDL_GetTicks();
        int elapsed = (int)(now - t0);
        if (!pump_and_check()) break;
        float alpha = (fadeMs > 0) ? 1.0f - ((float)elapsed / (float)halfFade) : 0.0f;
        if (alpha < 0.0f) alpha = 0.0f;
        SDL_SetWindowOpacity(win, alpha);
        if (blitSurface) SDL_BlitSurface(blitSurface, nullptr, screenSurface, nullptr);
        SDL_UpdateWindowSurface(win);
        if (elapsed >= halfFade) break;
        SDL_Delay(10);
    }

    if (blitSurface) SDL_FreeSurface(blitSurface);

    SDL_FreeSurface(imgSurface);
    stbi_image_free(pixels);
    SDL_DestroyWindow(win);
}
