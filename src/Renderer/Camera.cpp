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
    bool moved = false;

    // --- Traitement du clavier ---
    float velocity = m_MovementSpeed * deltaTime;

    // Mouvement avant/arrière
    if (input.IsKeyPressed(SDL_SCANCODE_W) || input.IsKeyPressed(SDL_SCANCODE_UP)) {
        m_Position += m_Front * velocity;
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_S) || input.IsKeyPressed(SDL_SCANCODE_DOWN)) {
        m_Position -= m_Front * velocity;
        moved = true;
    }

    // Mouvement gauche/droite
    if (input.IsKeyPressed(SDL_SCANCODE_A) || input.IsKeyPressed(SDL_SCANCODE_LEFT)) {
        m_Position -= m_Right * velocity;
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_D) || input.IsKeyPressed(SDL_SCANCODE_RIGHT)) {
        m_Position += m_Right * velocity;
        moved = true;
    }

    // NOUVEAU : Mouvement haut/bas
    if (input.IsKeyPressed(SDL_SCANCODE_RSHIFT)) {
        m_Position += m_WorldUp * velocity; // Utilise le vecteur "Up" du monde
        moved = true;
    }
    if (input.IsKeyPressed(SDL_SCANCODE_RCTRL)) {
        m_Position -= m_WorldUp * velocity;
        moved = true;
    }

    // --- Traitement de la souris ---
    int mouseX, mouseY;
    input.GetMouseMotion(mouseX, mouseY);
    if (input.IsMouseButtonPressed(SDL_BUTTON_RIGHT) && (mouseX != 0 || mouseY != 0)) {
         ProcessMouseMovement(static_cast<float>(mouseX), static_cast<float>(mouseY));
    } else if (moved) {
        // Mettre à jour la matrice de vue si le clavier a causé un mouvement
        UpdateViewMatrix();
    }
    
    // Traitement du zoom (molette)
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

void Camera::ProcessMouseMovement(float xoffset, float yoffset) {
    xoffset *= m_MouseSensitivity;
    yoffset *= m_MouseSensitivity;

    m_Yaw += xoffset;
    m_Pitch -= yoffset;

    if (m_Pitch > 89.0f) m_Pitch = 89.0f;
    if (m_Pitch < -89.0f) m_Pitch = -89.0f;

    UpdateViewMatrix();
}

void Camera::ProcessMouseScroll(int yoffset) {
    m_Fov -= (float)yoffset;
    if (m_Fov < 1.0f) m_Fov = 1.0f;
    if (m_Fov > 45.0f) m_Fov = 45.0f;
    
    UpdateProjectionMatrix();
}