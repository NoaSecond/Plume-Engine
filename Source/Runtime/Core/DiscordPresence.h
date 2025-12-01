#pragma once

#include <string>
#include <cstdint>

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

class PLUME_API DiscordPresence {
public:
    static DiscordPresence& Get();
    
    void Init();
    void Shutdown();
    void Update();
    
    void SetState(const std::string& state);
    void SetDetails(const std::string& details);
    void SetLargeImage(const std::string& key, const std::string& text);
    void SetSmallImage(const std::string& key, const std::string& text);
    void SetStartTimestamp(int64_t timestamp);
    
private:
    DiscordPresence() = default;
    ~DiscordPresence() = default;
    
    bool m_initialized = false;
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
