// src/Renderer/Camera.h
#pragma once

#include <glm/glm.hpp>
#include <glm/gtc/quaternion.hpp> // <-- INCLURE LES QUATERNIONS

class Input; // Déclaration anticipée

class Camera {
public:
    Camera(float fov, float aspectRatio, float near, float far);

    void Update(Input& input, float deltaTime);

    const glm::mat4& GetProjectionMatrix() const { return m_ProjectionMatrix; }
    const glm::mat4& GetViewMatrix() const { return m_ViewMatrix; }

private:
    void UpdateProjectionMatrix();
    void ProcessMouseScroll(int yoffset);

    glm::mat4 m_ProjectionMatrix;
    glm::mat4 m_ViewMatrix;
    
    // NOUVEAU : L'orientation est gérée par un quaternion
    glm::quat m_Orientation;

    glm::vec3 m_Position = glm::vec3(0.0f, 0.0f, 3.0f);
    
    // Ces vecteurs seront maintenant calculés à partir du quaternion
    glm::vec3 m_Front;
    glm::vec3 m_Up;
    glm::vec3 m_Right;

    float m_MovementSpeed = 2.5f;
    float m_MouseSensitivity = 0.1f;
    float m_RollSpeed = 50.0f;
    
    // Propriétés pour la projection
    float m_Fov;
    float m_AspectRatio;
    float m_NearClip;
    float m_FarClip;
};