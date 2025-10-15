// src/main.cpp
#include "Core/PlumeApplication.h"
#include "Core/SplashScreen.h"
int main(int argc, char* argv[]) {
    // Simple CLI parsing for splash control
    bool noSplash = false;
    for (int i = 1; i < argc; ++i) {
        std::string a(argv[i]);
        if (a == "--no-splash" || a == "-n") { noSplash = true; }
    }

    if (!noSplash) {
        // Use configuration from meta/plume.json for splash behavior
        SplashScreen::ShowFromConfig();
    }

    PlumeApplication app;
    app.Run();
    return 0;
}