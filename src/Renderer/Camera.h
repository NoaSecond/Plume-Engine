// src/Renderer/Camera.h
#pragma once

#include <glm/glm.hpp>
#include <glm/gtc/quaternion.hpp>

class Input;

class Camera {
public:
    Camera(float fov, float aspectRatio, float near, float far);

    void Update(Input& input, float deltaTime);

    const glm::mat4& GetProjectionMatrix() const { return m_ProjectionMatrix; }
    const glm::mat4& GetViewMatrix() const { return m_ViewMatrix; }
    const glm::vec3& GetPosition() const { return m_Position; }

private:
    void UpdateProjectionMatrix();
    void ProcessMouseScroll(int yoffset);

    glm::mat4 m_ProjectionMatrix;
    glm::mat4 m_ViewMatrix;
    glm::quat m_Orientation;
    glm::vec3 m_Position = glm::vec3(0.0f, 0.0f, 3.0f);
    glm::vec3 m_Front, m_Up, m_Right;

    float m_MovementSpeed = 2.5f;
    float m_MouseSensitivity = 0.1f;
    float m_RollSpeed = 50.0f;
    
    float m_Fov, m_AspectRatio, m_NearClip, m_FarClip;
};