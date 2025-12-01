#pragma once
#include "Scene.h"
#include <iostream>
#include <memory>

#if defined(_WIN32)
    #define PLUME_API __declspec(dllexport)
#else
    #define PLUME_API
#endif

namespace Plume {
    class PLUME_API Engine {
    public:
        Engine();
        ~Engine();
        void Init();
        void Run();
        void Shutdown();
        bool IsRunning() const { return m_IsRunning; }
        Scene* GetActiveScene() { return m_Scene.get(); }
    private:
        bool m_IsRunning = false;
        std::unique_ptr<Scene> m_Scene;
    };
}
