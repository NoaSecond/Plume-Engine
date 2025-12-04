#pragma once

#include "Plugin.h"
#include <memory>
#include <unordered_map>
#include <vector>

namespace Plume {

class PLUME_API PluginManager {
public:
    static PluginManager& Get();
    
    // Gestion des plugins
    void RegisterPlugin(std::shared_ptr<IPlugin> plugin);
    void UnregisterPlugin(const std::string& pluginId);
    
    // Control
    void InitializeAll();
    void ShutdownAll();
    void UpdateAll();
    
    // Enable/Disable
    void EnablePlugin(const std::string& pluginId, bool enable);
    bool IsPluginEnabled(const std::string& pluginId) const;
    
    // Queries
    std::vector<PluginInfo> GetAllPlugins() const;
    std::vector<PluginInfo> GetPluginsByCategory(PluginCategory category) const;
    std::shared_ptr<IPlugin> GetPlugin(const std::string& pluginId) const;
    
private:
    PluginManager() = default;
    ~PluginManager() = default;
    
    std::unordered_map<std::string, std::shared_ptr<IPlugin>> m_plugins;
};

} // namespace Plume
