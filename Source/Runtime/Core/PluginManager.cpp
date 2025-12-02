#include "PluginManager.h"
#include <algorithm>

namespace Plume {

PluginManager& PluginManager::Get() {
    static PluginManager instance;
    return instance;
}

void PluginManager::RegisterPlugin(std::shared_ptr<IPlugin> plugin) {
    if (!plugin) return;
    
    PluginInfo info = plugin->GetInfo();
    m_plugins[info.id] = plugin;
}

void PluginManager::UnregisterPlugin(const std::string& pluginId) {
    auto it = m_plugins.find(pluginId);
    if (it != m_plugins.end()) {
        it->second->Shutdown();
        m_plugins.erase(it);
    }
}

void PluginManager::InitializeAll() {
    for (auto& [id, plugin] : m_plugins) {
        if (plugin->IsEnabled()) {
            plugin->Initialize();
        }
    }
}

void PluginManager::ShutdownAll() {
    for (auto& [id, plugin] : m_plugins) {
        if (plugin->IsEnabled()) {
            plugin->Shutdown();
        }
    }
}

void PluginManager::UpdateAll() {
    for (auto& [id, plugin] : m_plugins) {
        if (plugin->IsEnabled()) {
            plugin->Update();
        }
    }
}

void PluginManager::EnablePlugin(const std::string& pluginId, bool enable) {
    auto plugin = GetPlugin(pluginId);
    if (!plugin) return;
    
    bool wasEnabled = plugin->IsEnabled();
    plugin->SetEnabled(enable);
    
    if (enable && !wasEnabled) {
        plugin->Initialize();
    } else if (!enable && wasEnabled) {
        plugin->Shutdown();
    }
}

bool PluginManager::IsPluginEnabled(const std::string& pluginId) const {
    auto plugin = GetPlugin(pluginId);
    return plugin ? plugin->IsEnabled() : false;
}

std::vector<PluginInfo> PluginManager::GetAllPlugins() const {
    std::vector<PluginInfo> plugins;
    for (const auto& [id, plugin] : m_plugins) {
        plugins.push_back(plugin->GetInfo());
    }
    return plugins;
}

std::vector<PluginInfo> PluginManager::GetPluginsByCategory(PluginCategory category) const {
    std::vector<PluginInfo> plugins;
    for (const auto& [id, plugin] : m_plugins) {
        PluginInfo info = plugin->GetInfo();
        if (info.category == category) {
            plugins.push_back(info);
        }
    }
    return plugins;
}

std::shared_ptr<IPlugin> PluginManager::GetPlugin(const std::string& pluginId) const {
    auto it = m_plugins.find(pluginId);
    return it != m_plugins.end() ? it->second : nullptr;
}

} // namespace Plume
