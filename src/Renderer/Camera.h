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
    void UpdateViewMatrix();
    void ProcessKeyboard(Input& input, float deltaTime);
    void ProcessMouseMovement(float xoffset, float yoffset);

    glm::mat4 m_ProjectionMatrix;
    glm::mat4 m_ViewMatrix;
    
    glm::vec3 m_Position = glm::vec3(0.0f, 0.0f, 3.0f);
    glm::vec3 m_Front = glm::vec3(0.0f, 0.0f, -1.0f);
    glm::vec3 m_Up = glm::vec3(0.0f, 1.0f, 0.0f);
    glm::vec3 m_Right;
    glm::vec3 m_WorldUp = glm::vec3(0.0f, 1.0f, 0.0f);

    float m_Yaw = -90.0f; // Rotation sur l'axe Y
    float m_Pitch = 0.0f; // Rotation sur l'axe X

    float m_MovementSpeed = 2.5f;
    float m_MouseSensitivity = 0.1f;
};