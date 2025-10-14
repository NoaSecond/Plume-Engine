// src/Renderer/Camera.cpp
#include "Camera.h"
#include "../Core/Input.h"
#include <glm/gtc/matrix_transform.hpp>

Camera::Camera(float fov, float aspectRatio, float near, float far) 
    : m_Fov(fov), m_AspectRatio(aspectRatio), m_NearClip(near), m_FarClip(far) 
{
    m_Orientation = glm::quat(1.0f, 0.0f, 0.0f, 0.0f); // Initialiser à aucune rotation
    UpdateProjectionMatrix();
}

void Camera::Update(Input& input, float deltaTime) {
    // --- 1. Traiter les changements d'orientation (souris et roll) ---
    int mouseX, mouseY;
    input.GetMouseMotion(mouseX, mouseY);
    if (input.IsMouseButtonPressed(SDL_BUTTON_RIGHT)) {
        // CORRECTION : Les signes négatifs ont été retirés pour un contrôle standard
        glm::quat yawRotation = glm::angleAxis(glm::radians(mouseX * m_MouseSensitivity), glm::vec3(0, 1, 0));
        glm::quat pitchRotation = glm::angleAxis(glm::radians(mouseY * m_MouseSensitivity), m_Right);

        m_Orientation = yawRotation * m_Orientation * pitchRotation;
    }
    
    float rollVelocity = m_RollSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_E)) {
        glm::quat rollRotation = glm::angleAxis(glm::radians(-rollVelocity), m_Front);
        m_Orientation = m_Orientation * rollRotation;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_Q)) {
        glm::quat rollRotation = glm::angleAxis(glm::radians(rollVelocity), m_Front);
        m_Orientation = m_Orientation * rollRotation;
    }

    m_Orientation = glm::normalize(m_Orientation);

    // --- 2. Mettre à jour les vecteurs de direction à partir du quaternion ---
    m_Front = glm::conjugate(m_Orientation) * glm::vec3(0.0, 0.0, -1.0);
    m_Right = glm::conjugate(m_Orientation) * glm::vec3(1.0, 0.0, 0.0);
    m_Up    = glm::conjugate(m_Orientation) * glm::vec3(0.0, 1.0, 0.0);
    
    // --- 3. Traiter les changements de position (clavier) ---
    float velocity = m_MovementSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_W) || input.IsKeyPressed(SDL_SCANCODE_UP))    { m_Position += m_Front * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_S) || input.IsKeyPressed(SDL_SCANCODE_DOWN))  { m_Position -= m_Front * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_A) || input.IsKeyPressed(SDL_SCANCODE_LEFT))  { m_Position -= m_Right * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_D) || input.IsKeyPressed(SDL_SCANCODE_RIGHT)) { m_Position += m_Right * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_LSHIFT)) { m_Position += glm::vec3(0, 1, 0) * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_LCTRL))  { m_Position -= glm::vec3(0, 1, 0) * velocity; }

    // --- 4. Mettre à jour la matrice de vue finale ---
    m_ViewMatrix = glm::mat4_cast(m_Orientation) * glm::translate(glm::mat4(1.0f), -m_Position);
    
    // --- 5. Traiter le zoom ---
    int scrollY = input.GetMouseWheelY();
    if (scrollY != 0) {
        ProcessMouseScroll(scrollY);
    }
}

void Camera::UpdateProjectionMatrix() {
    m_ProjectionMatrix = glm::perspective(glm::radians(m_Fov), m_AspectRatio, m_NearClip, m_FarClip);
}

void Camera::ProcessMouseScroll(int yoffset) {
    m_Fov -= (float)yoffset;
    if (m_Fov < 1.0f) m_Fov = 1.0f;
    if (m_Fov > 45.0f) m_Fov = 45.0f;
    
    UpdateProjectionMatrix();
}