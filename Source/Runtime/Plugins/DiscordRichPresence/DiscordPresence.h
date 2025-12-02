#pragma once

#include "../../Core/Plugin.h"
#include <string>
#include <cstdint>

namespace Plume {

class PLUME_API DiscordPresence : public IPlugin {
public:
    static DiscordPresence& Get();
    
    // IPlugin interface
    PluginInfo GetInfo() const override;
    bool Initialize() override;
    void Shutdown() override;
    void Update() override;
    bool IsEnabled() const override { return m_enabled; }
    void SetEnabled(bool enabled) override { m_enabled = enabled; }
    
    void SetState(const std::string& state);
    void SetDetails(const std::string& details);
    void SetLargeImage(const std::string& key, const std::string& text);
    void SetSmallImage(const std::string& key, const std::string& text);
    void SetStartTimestamp(int64_t timestamp);
    
private:
    DiscordPresence() = default;
    ~DiscordPresence() = default;
    
    bool m_initialized = false;
    bool m_enabled = true;
    std::string m_state;
    std::string m_details;
    std::string m_largeImageKey;
    std::string m_largeImageText;
    std::string m_smallImageKey;
    std::string m_smallImageText;
    int64_t m_startTimestamp = 0;
    
    void UpdatePresence();
};

} // namespace Plume
