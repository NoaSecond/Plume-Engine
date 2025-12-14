#include "PluginManager.h"
#include <algorithm>
#include <filesystem>
#include <fstream>
#ifdef _WIN32
#include <windows.h>
#endif
#include "nlohmann_json.hpp"

using json = nlohmann::json;

namespace Plume {

using CreatePluginFunc = IPlugin* (*)();

PluginManager& PluginManager::Get() {
    static PluginManager instance;
    return instance;
}

PluginManager::PluginManager() {
    // Ensure Plugins directory exists
    if (!std::filesystem::exists("Plugins")) {
        std::filesystem::create_directory("Plugins");
    }
    LoadConfig();
}

void PluginManager::LoadConfig() {
    if (!std::filesystem::exists(m_configPath)) return;
    
    std::ifstream file(m_configPath);
    if (!file.is_open()) return;
    
    try {
        json j;
        file >> j;
        
        if (j.contains("plugins")) {
             for (auto& [key, val] : j["plugins"].items()) {
                 if (val.is_boolean()) {
                     m_initialConfig[key] = val.get<bool>();
                 }
             }
        }
    } catch(...) {}
}

void PluginManager::SaveConfig() {
    json j;
    j["plugins"] = json::object();
    
    for (const auto& [id, plugin] : m_plugins) {
        j["plugins"][id] = plugin->IsEnabled();
    }
    
    // Ensure directory exists
    std::filesystem::path path(m_configPath);
    if (path.has_parent_path() && !std::filesystem::exists(path.parent_path())) {
         std::filesystem::create_directories(path.parent_path());
    }

    std::ofstream file(m_configPath);
    if (file.is_open()) {
        file << j.dump(4);
    }
}

void PluginManager::LoadPluginsFromDirectory(const std::string& directory) {
    if (!std::filesystem::exists(directory)) return;

    for (const auto& entry : std::filesystem::directory_iterator(directory)) {
        if (entry.path().extension() == ".dll") {
            // Load the DLL
            HMODULE hModule = LoadLibraryA(entry.path().string().c_str());
            if (hModule) {
                // Find the entry point
                CreatePluginFunc createFunc = (CreatePluginFunc)GetProcAddress(hModule, "CreatePlugin");
                if (createFunc) {
                    // Create the plugin instance
                    IPlugin* pluginRaw = createFunc();
                    if (pluginRaw) {
                        std::shared_ptr<IPlugin> plugin(pluginRaw);
                        RegisterPlugin(plugin);
                        m_pluginHandles.push_back(hModule);
                        continue;
                    }
                }
                // If we failed to get entry point or create plugin, unload
                FreeLibrary(hModule);
            }
        }
    }
}

void PluginManager::RegisterPlugin(std::shared_ptr<IPlugin> plugin) {
    if (!plugin) return;
    
    PluginInfo info = plugin->GetInfo();
    
    // Check initial config
    auto it = m_initialConfig.find(info.id);
    if (it != m_initialConfig.end()) {
        plugin->SetEnabled(it->second);
    }
    
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
    m_plugins.clear();
    
    // Free loaded DLLs
    for (void* handle : m_pluginHandles) {
        if (handle) {
            FreeLibrary((HMODULE)handle);
        }
    }
    m_pluginHandles.clear();
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
    
    SaveConfig();
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
