#include "Scene.h"
#include <iostream>
#include <sstream>
#include <cmath>
#include "nlohmann_json.hpp"

namespace Plume {
    Scene::Scene() {}
    Scene::~Scene() {}

    void Scene::Clear() {
        m_Registry.clear();
    }

    void Scene::DeserializeFromJson(const std::string& jsonString) {
        Clear();
        try {
            auto j = nlohmann::json::parse(jsonString);
            if (!j.is_array()) return;
            
            for (const auto& item : j) {
                EntityData data;
                data.Tag.ID = item.value("id", GenerateUUID());
                data.Tag.Name = item.value("name", "Entity");
                
                std::string typeStr = item.value("type", "Mesh");
                if (typeStr == "Light") data.Type.Type = EntityType::Light;
                else if (typeStr == "Camera") data.Type.Type = EntityType::Camera;
                else if (typeStr == "Folder") data.Type.Type = EntityType::Folder;
                else data.Type.Type = EntityType::Mesh;
                
                data.Type.SubType = item.value("subType", "");
                data.Visible = item.value("visible", true);
                
                if (item.contains("transform")) {
                    auto& t = item["transform"];
                    if (t.contains("position")) {
                        data.Transform.Position.x = t["position"].value("x", 0.0f);
                        data.Transform.Position.y = t["position"].value("y", 0.0f);
                        data.Transform.Position.z = t["position"].value("z", 0.0f);
                    }
                    if (t.contains("rotation")) {
                        data.Transform.Rotation.x = t["rotation"].value("x", 0.0f);
                        data.Transform.Rotation.y = t["rotation"].value("y", 0.0f);
                        data.Transform.Rotation.z = t["rotation"].value("z", 0.0f);
                    }
                    if (t.contains("scale")) {
                        data.Transform.Scale.x = t["scale"].value("x", 1.0f);
                        data.Transform.Scale.y = t["scale"].value("y", 1.0f);
                        data.Transform.Scale.z = t["scale"].value("z", 1.0f);
                    }
                }
                
                m_Registry.push_back(data);
            }
        } catch (...) {
            std::cout << "Failed to deserialize scene JSON" << std::endl;
        }
    }

    Entity Scene::CreateEntity(const std::string& name, EntityType type, const std::string& subType) {
        EntityData data;
        data.Tag.Name = name;
        data.Tag.ID = GenerateUUID();
        data.Type.Type = type;
        data.Type.SubType = subType;
        if (type == EntityType::Light) {
            data.Transform.Position = { 100.f, 200.f, 50.f };
            data.Transform.Rotation = { -45.f, 30.f, 0.f };
        } else if (type == EntityType::Camera) {
            data.Transform.Position = { -1.5f, 2.0f, -1.5f };
            data.Transform.Rotation = { -35.0f, 225.0f, 0.0f };
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

    // --- Minimal Math Helpers ---
    struct Mat3 {
        float m[3][3];
        static Mat3 Identity() {
            Mat3 r;
            for(int i=0;i<3;i++) for(int j=0;j<3;j++) r.m[i][j] = (i==j?1.0f:0.0f);
            return r;
        }
    };

    Mat3 Multiply(const Mat3& A, const Mat3& B) {
        Mat3 R;
        for(int r=0; r<3; r++) {
            for(int c=0; c<3; c++) {
                R.m[r][c] = A.m[r][0]*B.m[0][c] + A.m[r][1]*B.m[1][c] + A.m[r][2]*B.m[2][c];
            }
        }
        return R;
    }
    
    Vec3 Multiply(const Mat3& M, const Vec3& v) {
        Vec3 r;
        r.x = M.m[0][0]*v.x + M.m[0][1]*v.y + M.m[0][2]*v.z;
        r.y = M.m[1][0]*v.x + M.m[1][1]*v.y + M.m[1][2]*v.z;
        r.z = M.m[2][0]*v.x + M.m[2][1]*v.y + M.m[2][2]*v.z;
        return r;
    }

    Mat3 Mat3FromEulerYXZ(const Vec3& rot) {
        float rad = 3.14159265f / 180.0f;
        float cx = cosf(rot.x * rad), sx = sinf(rot.x * rad);
        float cy = cosf(rot.y * rad), sy = sinf(rot.y * rad);
        float cz = cosf(rot.z * rad), sz = sinf(rot.z * rad);

        Mat3 Rx = Mat3::Identity(); Rx.m[1][1]=cx; Rx.m[1][2]=-sx; Rx.m[2][1]=sx; Rx.m[2][2]=cx;
        Mat3 Ry = Mat3::Identity(); Ry.m[0][0]=cy; Ry.m[0][2]=sy;  Ry.m[2][0]=-sy; Ry.m[2][2]=cy;
        Mat3 Rz = Mat3::Identity(); Rz.m[0][0]=cz; Rz.m[0][1]=-sz; Rz.m[1][0]=sz; Rz.m[1][1]=cz;

        // Structure of Y*X*Z
        Mat3 R = Multiply(Ry, Rx);
        R = Multiply(R, Rz);
        return R;
    }

    Mat3 FromAxisAngle(const Vec3& axis, float angleMin) {
        float rad = 3.14159265f / 180.0f * angleMin;
        float c = cosf(rad);
        float s = sinf(rad);
        float t = 1.0f - c;
        float x = axis.x, y = axis.y, z = axis.z;
        
        Mat3 m;
        m.m[0][0] = t*x*x + c;   m.m[0][1] = t*x*y - z*s; m.m[0][2] = t*x*z + y*s;
        m.m[1][0] = t*x*y + z*s; m.m[1][1] = t*y*y + c;   m.m[1][2] = t*y*z - x*s;
        m.m[2][0] = t*x*z - y*s; m.m[2][1] = t*y*z + x*s; m.m[2][2] = t*z*z + c;
        return m;
    }

    Vec3 EulerYXZFromMat3(const Mat3& m) {
        Vec3 rot;
        float rad2deg = 180.0f / 3.14159265f;
        float sx = -m.m[1][2];
        if (sx > 0.9999f) {
            rot.x = 90.0f;
            rot.y = atan2f(m.m[2][0], m.m[2][2]) * rad2deg;
            rot.z = 0.0f;
        } else if (sx < -0.9999f) {
            rot.x = -90.0f;
            rot.y = atan2f(m.m[2][0], m.m[2][2]) * rad2deg;
            rot.z = 0.0f;
        } else {
            rot.x = asinf(sx) * rad2deg;
            rot.y = atan2f(m.m[0][2], m.m[2][2]) * rad2deg;
            rot.z = atan2f(m.m[1][0], m.m[1][1]) * rad2deg;
        }
        return rot;
    }

    Mat3 Transpose(const Mat3& M) {
        Mat3 R;
        for(int i=0;i<3;i++) for(int j=0;j<3;j++) R.m[i][j] = M.m[j][i];
        return R;
    }

    void Scene::TranslateCameraLocal(const Vec3& localDelta, bool followPitch) {
        for (auto& e : m_Registry) {
            if (e.Type.Type == EntityType::Camera) {
                // Fully View-Relative Movement
                // 1. Get Camera Rotation Matrix
                Mat3 R = Mat3FromEulerYXZ(e.Transform.Rotation);
                
                // 2. Transform the local movement vector into world space
                // Input conventions (from EditorMain.cpp):
                // Z/S (Forward/Back) -> +/- delta.z (where "Forward" is -Z in local space)
                // Q/D (Left/Right)   -> +/- delta.x (Right is +X)
                // Ctrl/Shift (Up/Dn) -> +/- delta.y (Up is +Y)
                
                // However, the input delta.z is usually sent as:
                // Forward (Z key) -> delta.z -= 0.1
                // Back (S key)    -> delta.z += 0.1
                // So "Forward" is Negative Z.
                
                // Local Delta Vector:
                // x = Right (+), y = Up (+), z = Back (+) (since forward is negative)
                
                // We just multiply R * localDelta.
                // If the user presses Z (delta.z = -0.1), that's movement along local -Z (Forward).
                // R * (0, 0, -0.1) gives the world forward vector scaled by 0.1.
                
                Vec3 worldDelta = Multiply(R, localDelta);
                
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
                // Unlimited Pitch (Looping) + Stabilized Roll
                
                // 1. Calculate Target Roll (Manual Only)
                float targetRoll = e.Transform.Rotation.z + delta.z;
                
                // 2. Compute Stabilized Orientation Matrix
                // Start with current, apply Local Yaw/Pitch
                Mat3 currentRot = Mat3FromEulerYXZ(e.Transform.Rotation);
                Mat3 dYaw   = FromAxisAngle({0,1,0}, delta.y); // Local Yaw
                Mat3 dPitch = FromAxisAngle({1,0,0}, delta.x); // Local Pitch
                
                // Apply changes locally: Current * Yaw * Pitch
                Mat3 newRot = Multiply(currentRot, dYaw);
                newRot = Multiply(newRot, dPitch);
                
                // 3. Unroll (remove target Roll) to extract Pitch/Yaw
                // We assume: M_final = Ry * Rx * Rz(targetRoll)
                // So: Ry * Rx = M_final * Inv(Rz(targetRoll))
                Mat3 invRoll = Transpose(FromAxisAngle({0,0,1}, targetRoll));
                Mat3 noRollMat = Multiply(newRot, invRoll);
                
                // 4. Extract Pitch/Yaw from Ry*Rx using atan2 (Unlimited range)
                float rad2deg = 180.0f / 3.14159265f;
                // Pitch (x) around local X. Ry*Rx[1][2] = -sx, [1][1] = cx
                float pitch = atan2f(-noRollMat.m[1][2], noRollMat.m[1][1]) * rad2deg;
                // Yaw (y) around global Y. Ry*Rx[2][0] = -sy, [0][0] = cy
                float yaw = atan2f(-noRollMat.m[2][0], noRollMat.m[0][0]) * rad2deg;
                
                e.Transform.Rotation.x = pitch;
                e.Transform.Rotation.y = yaw;
                e.Transform.Rotation.z = targetRoll;
                
                // 5. No Clamping (Requested)
                // if (e.Transform.Rotation.x > 90.0f) e.Transform.Rotation.x = 90.0f;
                // if (e.Transform.Rotation.x < -90.0f) e.Transform.Rotation.x = -90.0f;
                
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
