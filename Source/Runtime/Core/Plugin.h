#pragma once

#include <string>
#include <vector>

#if defined(_WIN32)
    #ifndef PLUME_API
        #ifdef PLUME_EXPORT
            #define PLUME_API __declspec(dllexport)
        #else
            #define PLUME_API __declspec(dllimport)
        #endif
    #endif
#else
    #ifndef PLUME_API
        #define PLUME_API
    #endif
#endif

namespace Plume {

enum class PluginCategory {
    Official,      // Plugins créés par l'équipe Plume
    Community,     // Plugins créés par des tiers
    System         // Plugins système essentiels
};

struct PluginInfo {
    std::string id;
    std::string name;
    std::string description;
    std::string version;
    std::string author;
    PluginCategory category;
};

class PLUME_API IPlugin {
public:
    virtual ~IPlugin() = default;
    
    // Informations du plugin
    virtual PluginInfo GetInfo() const = 0;
    
    // Cycle de vie
    virtual bool Initialize() = 0;
    virtual void Shutdown() = 0;
    virtual void Update() = 0;
    
    // État
    virtual bool IsEnabled() const = 0;
    virtual void SetEnabled(bool enabled) = 0;
};

} // namespace Plume
