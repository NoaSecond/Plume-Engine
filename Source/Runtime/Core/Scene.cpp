#include "Scene.h"
#include <iostream>
#include <sstream>

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
