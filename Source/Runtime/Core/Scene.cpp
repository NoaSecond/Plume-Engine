#include "Scene.h"
#include <iostream>
#include <sstream>
#include <cmath>

namespace Plume {
    Scene::Scene() {}
    Scene::~Scene() {}

    Entity Scene::CreateEntity(const std::string& name, EntityType type, const std::string& subType) {
        EntityData data;
        data.Tag.Name = name;
        data.Tag.ID = GenerateUUID();
        data.Type.Type = type;
        data.Type.SubType = subType;
        if (type == EntityType::Light) {
            data.Transform.Position = { 100.f, 200.f, 50.f };
            data.Transform.Rotation = { -45.f, 30.f, 0.f };
        }
        m_Registry.push_back(data);
        return Entity((int)m_Registry.size() - 1, this);
    }

    void Scene::OnUpdate(float deltaTime) {
        for (auto& entity : m_Registry) {
            if (entity.Type.Type == EntityType::Mesh) {
                entity.Transform.Rotation.z += 45.0f * deltaTime;
                entity.Transform.Position.z += 0.1f; 
                if(entity.Transform.Position.z > 20.0f) entity.Transform.Position.z = 0.0f;
            }
        }
    }

    bool Scene::GetCameraTransform(TransformComponent& out) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                out = e.Transform;
                return true;
            }
        }
        return false;
    }

    void Scene::SetCameraTransform(const TransformComponent& t) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                e.Transform = t;
                return;
            }
        }
    }

    void Scene::TranslateCamera(const Vec3& delta) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                e.Transform.Position.x += delta.x;
                e.Transform.Position.y += delta.y;
                e.Transform.Position.z += delta.z;
                return;
            }
        }
    }

    void Scene::TranslateCameraLocal(const Vec3& localDelta) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                // Convert rotation (degrees) to radians
                float pitch = e.Transform.Rotation.x * 3.14159265f / 180.0f;
                float yaw   = e.Transform.Rotation.y * 3.14159265f / 180.0f;

                // Compute forward vector
                float cp = cosf(pitch);
                float sp = sinf(pitch);
                float cy = cosf(yaw);
                float sy = sinf(yaw);
                Vec3 forward;
                forward.x = cp * sy;
                forward.y = sp;
                forward.z = cp * cy;

                // Right = normalize(cross(forward, worldUp))
                Vec3 upWorld{0.0f, 1.0f, 0.0f};
                Vec3 right;
                right.x = forward.y * upWorld.z - forward.z * upWorld.y;
                right.y = forward.z * upWorld.x - forward.x * upWorld.z;
                right.z = forward.x * upWorld.y - forward.y * upWorld.x;
                // normalize right
                float rlen = sqrtf(right.x*right.x + right.y*right.y + right.z*right.z);
                if (rlen > 1e-6f) { right.x /= rlen; right.y /= rlen; right.z /= rlen; }

                // Recompute up = cross(right, forward)
                Vec3 up;
                up.x = right.y * forward.z - right.z * forward.y;
                up.y = right.z * forward.x - right.x * forward.z;
                up.z = right.x * forward.y - right.y * forward.x;

                // World delta = right*local.x + up*local.y + forward*local.z
                Vec3 worldDelta;
                worldDelta.x = right.x * localDelta.x + up.x * localDelta.y + forward.x * localDelta.z;
                worldDelta.y = right.y * localDelta.x + up.y * localDelta.y + forward.y * localDelta.z;
                worldDelta.z = right.z * localDelta.x + up.z * localDelta.y + forward.z * localDelta.z;

                e.Transform.Position.x += worldDelta.x;
                e.Transform.Position.y += worldDelta.y;
                e.Transform.Position.z += worldDelta.z;
                return;
            }
        }
    }

    void Scene::RotateCamera(const Vec3& delta) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                e.Transform.Rotation.x += delta.x;
                e.Transform.Rotation.y += delta.y;
                e.Transform.Rotation.z += delta.z;
                return;
            }
        }
    }

    std::string Scene::SerializeToJson() {
        std::stringstream json;
        json << "[";
        for (size_t i = 0; i < m_Registry.size(); ++i) {
            const auto& e = m_Registry[i];
            std::string typeStr = "Mesh";
            if (e.Type.Type == EntityType::Light) typeStr = "Light";
            if (e.Type.Type == EntityType::Camera) typeStr = "Camera";
            if (e.Type.Type == EntityType::Folder) typeStr = "Folder";

            json << "{";
            json << "\"id\": \"" << e.Tag.ID << "\",";
            json << "\"name\": \"" << e.Tag.Name << "\",";
            json << "\"type\": \"" << typeStr << "\",";
            json << "\"subType\": \"" << e.Type.SubType << "\",";
            json << "\"visible\": " << (e.Visible ? "true" : "false") << ",";
            json << "\"transform\": {";
            json << "\"position\": {\"x\":" << e.Transform.Position.x << ", \"y\":" << e.Transform.Position.y << ", \"z\":" << e.Transform.Position.z << "},";
            json << "\"rotation\": {\"x\":" << e.Transform.Rotation.x << ", \"y\":" << e.Transform.Rotation.y << ", \"z\":" << e.Transform.Rotation.z << "},";
            json << "\"scale\": {\"x\":" << e.Transform.Scale.x << ", \"y\":" << e.Transform.Scale.y << ", \"z\":" << e.Transform.Scale.z << "}";
            json << "}";
            json << "}";
            if (i < m_Registry.size() - 1) json << ",";
        }
        json << "]";
        return json.str();
    }
}
