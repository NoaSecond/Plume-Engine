#include "DiscordPresence.h"
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#include <cstring>
#include <discord.h>

namespace {
    discord::Core* g_discordCore = nullptr;
}
#endif

namespace Plume {

DiscordPresence& DiscordPresence::Get() {
    static DiscordPresence instance;
    return instance;
}

PluginInfo DiscordPresence::GetInfo() const {
    PluginInfo info;
    info.id = "discord_rich_presence";
    info.name = "Discord Rich Presence";
    info.description = "Displays your Plume Engine activity on Discord";
    info.version = "1.0.0";
    info.author = "Plume Engine Team";
    info.category = PluginCategory::Official;
    return info;
}

bool DiscordPresence::Initialize() {
    if (m_initialized || !m_enabled) return false;
    
#ifdef _WIN32
    // Discord Application ID pour Plume Engine
    discord::ClientId clientId = 1445163901581787236LL;
    
    auto result = discord::Core::Create(clientId, DiscordCreateFlags_NoRequireDiscord, &g_discordCore);
    if (result != discord::Result::Ok || !g_discordCore) {
        // Discord initialization failed - application will continue without Rich Presence
        return false;
    }
    
    m_startTimestamp = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    
    m_initialized = true;
    
    // Initial state
    SetDetails("Editing a scene");
    SetState("In Editor");
    SetLargeImage("plume_logo", "Plume Engine");
    UpdatePresence();
#endif
    return true;
}

void DiscordPresence::Shutdown() {
    if (!m_initialized || !m_enabled) return;
    
#ifdef _WIN32
    if (g_discordCore) {
        delete g_discordCore;
        g_discordCore = nullptr;
    }
    m_initialized = false;
#endif
}

void DiscordPresence::Update() {
    if (!m_initialized || !m_enabled) return;
    
#ifdef _WIN32
    if (g_discordCore) {
        g_discordCore->RunCallbacks();
    }
#endif
}

void DiscordPresence::SetState(const std::string& state) {
    m_state = state;
    if (m_initialized) UpdatePresence();
}

void DiscordPresence::SetDetails(const std::string& details) {
    m_details = details;
    if (m_initialized) UpdatePresence();
}

void DiscordPresence::SetLargeImage(const std::string& key, const std::string& text) {
    m_largeImageKey = key;
    m_largeImageText = text;
    if (m_initialized) UpdatePresence();
}

void DiscordPresence::SetSmallImage(const std::string& key, const std::string& text) {
    m_smallImageKey = key;
    m_smallImageText = text;
    if (m_initialized) UpdatePresence();
}

void DiscordPresence::SetStartTimestamp(int64_t timestamp) {
    m_startTimestamp = timestamp;
    if (m_initialized) UpdatePresence();
}

void DiscordPresence::UpdatePresence() {
#ifdef _WIN32
    if (!g_discordCore) return;
    
    discord::Activity activity{};
    activity.SetState(m_state.c_str());
    activity.SetDetails(m_details.c_str());
    
    if (m_startTimestamp > 0) {
        activity.GetTimestamps().SetStart(m_startTimestamp);
    }
    
    if (!m_largeImageKey.empty()) {
        activity.GetAssets().SetLargeImage(m_largeImageKey.c_str());
        if (!m_largeImageText.empty()) {
            activity.GetAssets().SetLargeText(m_largeImageText.c_str());
        }
    }
    
    if (!m_smallImageKey.empty()) {
        activity.GetAssets().SetSmallImage(m_smallImageKey.c_str());
        if (!m_smallImageText.empty()) {
            activity.GetAssets().SetSmallText(m_smallImageText.c_str());
        }
    }
    
    g_discordCore->ActivityManager().UpdateActivity(activity, [](discord::Result result) {
        // Optional callback to handle errors
    });
#endif
}

} // namespace Plume
