#pragma once
#include <vector>
#include <memory>
#include "Components.h"

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
    class Entity;
    class Renderer; 
    class SceneSerializer;

    class PLUME_API Scene {
    public:
        Scene();
        ~Scene();
        Entity CreateEntity(const std::string& name, EntityType type, const std::string& subType = "");
        void OnUpdate(float deltaTime);
        void Clear();
        // Camera helpers: access / modify the first Camera entity's transform
        bool GetCameraTransform(TransformComponent& out);
        void SetCameraTransform(const TransformComponent& t);
        void TranslateCamera(const Vec3& delta);
        void RotateCamera(const Vec3& delta);
        // Translate in camera-local space (x = right, y = up, z = forward)
        void TranslateCameraLocal(const Vec3& localDelta, bool followPitch = true);

        // Allow Renderer to iterate entities
        friend class Renderer;
        friend class SceneSerializer;
        
        enum class CameraMode { SixDOF, ThreeDOF };
        void SetCameraMode(CameraMode mode) { m_CameraMode = mode; }
        CameraMode GetCameraMode() const { return m_CameraMode; }

    private:
        struct EntityData {
            TagComponent Tag;
            TransformComponent Transform;
            TypeComponent Type;
            bool Visible = true;
        };
        std::vector<EntityData> m_Registry;
        CameraMode m_CameraMode = CameraMode::ThreeDOF;
    };
    class Entity {
    public:
        Entity(int handle, Scene* scene) : m_Handle(handle), m_Scene(scene) {}
    private:
        int m_Handle;
        Scene* m_Scene;
    };
}
