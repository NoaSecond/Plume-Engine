// src/Renderer/Camera.cpp
#include "Camera.h"
#include "../Core/Input.h" // Inclure Input.h

Camera::Camera(float fov, float aspectRatio, float near, float far) {
    m_ProjectionMatrix = glm::perspective(glm::radians(fov), aspectRatio, near, far);
    UpdateViewMatrix();
}

void Camera::Update(Input& input, float deltaTime) {
    ProcessKeyboard(input, deltaTime);

    int mouseX, mouseY;
    input.GetMouseMotion(mouseX, mouseY);
    
    // Pour une caméra FPS, on ne traite le mouvement de la souris
    // que si le clic droit est maintenu, par exemple.
    if (input.IsMouseButtonPressed(SDL_BUTTON_RIGHT)) {
         ProcessMouseMovement(static_cast<float>(mouseX), static_cast<float>(mouseY));
    }
}

void Camera::UpdateViewMatrix() {
    // Calculer le nouveau vecteur Front basé sur le yaw et le pitch
    glm::vec3 front;
    front.x = cos(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    front.y = sin(glm::radians(m_Pitch));
    front.z = sin(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    m_Front = glm::normalize(front);

    // Recalculer les vecteurs Right et Up
    m_Right = glm::normalize(glm::cross(m_Front, m_WorldUp));
    m_Up = glm::normalize(glm::cross(m_Right, m_Front));

    // Mettre à jour la matrice de vue
    m_ViewMatrix = glm::lookAt(m_Position, m_Position + m_Front, m_Up);
}

void Camera::ProcessKeyboard(Input& input, float deltaTime) {
    float velocity = m_MovementSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_W))
        m_Position += m_Front * velocity;
    if (input.IsKeyPressed(SDL_SCANCODE_S))
        m_Position -= m_Front * velocity;
    if (input.IsKeyPressed(SDL_SCANCODE_A))
        m_Position -= m_Right * velocity;
    if (input.IsKeyPressed(SDL_SCANCODE_D))
        m_Position += m_Right * velocity;
}

void Camera::ProcessMouseMovement(float xoffset, float yoffset) {
    xoffset *= m_MouseSensitivity;
    yoffset *= m_MouseSensitivity;

    m_Yaw += xoffset;
    m_Pitch -= yoffset; // Inversé car les coordonnées Y vont de bas en haut

    // Contraintes pour éviter le retournement
    if (m_Pitch > 89.0f)
        m_Pitch = 89.0f;
    if (m_Pitch < -89.0f)
        m_Pitch = -89.0f;

    // Mettre à jour les vecteurs et la matrice de vue
    UpdateViewMatrix();
}