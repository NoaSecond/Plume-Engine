// src/Renderer/Camera.cpp
#include "Camera.h"
#include "../Core/Input.h"

Camera::Camera(float fov, float aspectRatio, float near, float far) 
    : m_Fov(fov), m_AspectRatio(aspectRatio), m_NearClip(near), m_FarClip(far) 
{
    UpdateProjectionMatrix();
    UpdateViewMatrix();
}

void Camera::Update(Input& input, float deltaTime) {
    // On garde une trace si un mouvement a eu lieu pour mettre à jour la matrice
    bool moved = false;

    // Traitement du clavier
    float velocity = m_MovementSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_W) || input.IsKeyPressed(SDL_SCANCODE_UP)) {
        m_Position += m_Front * velocity;
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_S) || input.IsKeyPressed(SDL_SCANCODE_DOWN)) {
        m_Position -= m_Front * velocity;
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_A) || input.IsKeyPressed(SDL_SCANCODE_LEFT)) {
        m_Position -= m_Right * velocity;
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_D) || input.IsKeyPressed(SDL_SCANCODE_RIGHT)) {
        m_Position += m_Right * velocity;
        moved = true;
    }

    // Traitement de la souris
    int mouseX, mouseY;
    input.GetMouseMotion(mouseX, mouseY);
    if (input.IsMouseButtonPressed(SDL_BUTTON_RIGHT) && (mouseX != 0 || mouseY != 0)) {
         ProcessMouseMovement(static_cast<float>(mouseX), static_cast<float>(mouseY));
         // ProcessMouseMovement appelle déjà UpdateViewMatrix, donc pas besoin de 'moved = true'
    } else if (moved) {
        // Si seul le clavier a bougé, on met à jour la matrice ici
        UpdateViewMatrix();
    }
    
    // Traitement du zoom
    int scrollY = input.GetMouseWheelY();
    if (scrollY != 0) {
        ProcessMouseScroll(scrollY);
    }
}

void Camera::UpdateViewMatrix() {
    glm::vec3 front;
    front.x = cos(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    front.y = sin(glm::radians(m_Pitch));
    front.z = sin(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    m_Front = glm::normalize(front);

    m_Right = glm::normalize(glm::cross(m_Front, m_WorldUp));
    m_Up = glm::normalize(glm::cross(m_Right, m_Front));

    m_ViewMatrix = glm::lookAt(m_Position, m_Position + m_Front, m_Up);
}

void Camera::UpdateProjectionMatrix() {
    m_ProjectionMatrix = glm::perspective(glm::radians(m_Fov), m_AspectRatio, m_NearClip, m_FarClip);
}

// CETTE FONCTION EST MAINTENANT INTÉGRÉE DANS Update()
// void Camera::ProcessKeyboard(Input& input, float deltaTime) { ... }

void Camera::ProcessMouseMovement(float xoffset, float yoffset) {
    xoffset *= m_MouseSensitivity;
    yoffset *= m_MouseSensitivity;

    m_Yaw += xoffset;
    m_Pitch -= yoffset;

    if (m_Pitch > 89.0f) m_Pitch = 89.0f;
    if (m_Pitch < -89.0f) m_Pitch = -89.0f;

    UpdateViewMatrix(); // Important : on met à jour la vue après un mouvement de souris
}

void Camera::ProcessMouseScroll(int yoffset) {
    m_Fov -= (float)yoffset;
    if (m_Fov < 1.0f) m_Fov = 1.0f;
    if (m_Fov > 45.0f) m_Fov = 45.0f;
    
    UpdateProjectionMatrix(); // Le zoom affecte la projection, pas la vue
}