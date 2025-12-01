#pragma once
#include <vector>
#include <memory>
#include "Components.h"

#if defined(_WIN32)
    #define PLUME_API __declspec(dllexport)
#else
    #define PLUME_API
#endif

namespace Plume {
    class Entity;
    class PLUME_API Scene {
    public:
        Scene();
        ~Scene();
        Entity CreateEntity(const std::string& name, EntityType type, const std::string& subType = "");
        void OnUpdate(float deltaTime);
        std::string SerializeToJson();
    private:
        struct EntityData {
            TagComponent Tag;
            TransformComponent Transform;
            TypeComponent Type;
            bool Visible = true;
        };
        std::vector<EntityData> m_Registry;
    };
    class Entity {
    public:
        Entity(int handle, Scene* scene) : m_Handle(handle), m_Scene(scene) {}
    private:
        int m_Handle;
        Scene* m_Scene;
    };
}
