#pragma once
#include <string>

namespace Plume {
    struct Vec3 { float x = 0.f, y = 0.f, z = 0.f; };
    struct TransformComponent { Vec3 Position; Vec3 Rotation; Vec3 Scale = { 1.f, 1.f, 1.f }; };
    struct TagComponent { std::string Name; std::string ID; };
    enum class EntityType { Folder, Mesh, Light, Camera };
    struct TypeComponent { EntityType Type; std::string SubType; };
    static std::string GenerateUUID() { static int id = 100; return std::to_string(id++); }
}
