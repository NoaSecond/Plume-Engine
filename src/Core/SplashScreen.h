// src/Core/SplashScreen.h
#pragma once

#include <string>

class SplashScreen {
public:
    // Show splash image located at imagePath for durationMs milliseconds (default 1500ms)
    // The splash will close early if the user presses a key, mouse button or closes the window.
    static void Show(const std::string& imagePath, int durationMs = 1500, int fadeMs = 300);

    // Read configuration from meta/plume.json and show the splash.
    // Expected JSON keys (all optional):
    //  - "splash_path": string (e.g. "assets/icons/PlumeSplash.png")
    //  - "splash_duration_ms": integer (total visible time in ms)
    //  - "splash_fade_ms": integer (fade in/out duration in ms)
    static void ShowFromConfig(const std::string& metaPath = "meta/plume.json");
};
