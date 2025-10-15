// src/main.cpp
#include "Core/PlumeApplication.h"
#include "Core/SplashScreen.h"
#include <iostream>
#include <filesystem>

// Redirect stdout/stderr to a log file so launching by double-click still produces diagnostics
static void RedirectLogs() {
    try {
        std::filesystem::create_directories("logs");
        // Overwrite log at each start
        freopen("logs\\startup.log", "w", stdout);
        freopen("logs\\startup.log", "a", stderr);
        setvbuf(stdout, nullptr, _IONBF, 0);
    } catch(...) {
        // ignore
    }
}

int main(int argc, char* argv[]) {
    RedirectLogs();
    std::cout << "[main] Starting" << std::endl;
    std::cout.flush();

    std::cout << "[main] Showing splash" << std::endl;
    std::cout.flush();
    SplashScreen::ShowFromConfig();
    std::cout << "[main] Splash returned" << std::endl;
    std::cout.flush();

    std::cout << "[main] Creating PlumeApplication" << std::endl;
    std::cout.flush();
    PlumeApplication app;
    std::cout << "[main] Running app" << std::endl;
    std::cout.flush();
    app.Run();
    std::cout << "[main] App.Run returned" << std::endl;
    std::cout.flush();
    return 0;
}