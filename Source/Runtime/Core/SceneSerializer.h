#pragma once
#include <string>
#include <memory>

#ifndef PLUME_API
#if defined(_WIN32)
    #ifdef PLUME_EXPORT
        #define PLUME_API __declspec(dllexport)
    #else
        #define PLUME_API __declspec(dllimport)
    #endif
#else
    #define PLUME_API
#endif
#endif

namespace Plume {

    class Scene;

    class PLUME_API SceneSerializer {
    public:
        SceneSerializer(Scene* scene);
        ~SceneSerializer();

        void Serialize(const std::string& filePath);
        std::string SerializeToString();

        bool Deserialize(const std::string& filePath);
        bool DeserializeFromString(const std::string& jsonString);

    private:
        Scene* m_Scene;
    };

} // namespace Plume
