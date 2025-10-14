// src/Renderer/Camera.h
#pragma once

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

class Input; // Déclaration anticipée

class Camera {
public:
    Camera(float fov, float aspectRatio, float near, float far);

    void Update(Input& input, float deltaTime);

    const glm::mat4& GetProjectionMatrix() const { return m_ProjectionMatrix; }
    const glm::mat4& GetViewMatrix() const { return m_ViewMatrix; }

private:
    void UpdateCameraVectors();
    void UpdateProjectionMatrix();
    void ProcessMouseMovement(float xoffset, float yoffset);
    void ProcessMouseScroll(int yoffset);

    glm::mat4 m_ProjectionMatrix;
    glm::mat4 m_ViewMatrix;
    
    glm::vec3 m_Position = glm::vec3(0.0f, 0.0f, 3.0f);
    glm::vec3 m_Front = glm::vec3(0.0f, 0.0f, -1.0f);
    glm::vec3 m_Up = glm::vec3(0.0f, 1.0f, 0.0f);
    glm::vec3 m_Right;
    glm::vec3 m_WorldUp = glm::vec3(0.0f, 1.0f, 0.0f);

    float m_Yaw = -90.0f;
    float m_Pitch = 0.0f;
    float m_Roll = 0.0f; // NOUVEAU : Angle d'inclinaison

    float m_MovementSpeed = 2.5f;
    float m_MouseSensitivity = 0.1f;
    float m_RollSpeed = 50.0f;
    
    // Propriétés pour la projection
    float m_Fov;
    float m_AspectRatio;
    float m_NearClip;
    float m_FarClip;
};