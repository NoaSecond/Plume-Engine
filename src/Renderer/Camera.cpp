// src/Renderer/Camera.cpp
#include "Camera.h"
#include "../Core/Input.h"

Camera::Camera(float fov, float aspectRatio, float near, float far) 
    : m_Fov(fov), m_AspectRatio(aspectRatio), m_NearClip(near), m_FarClip(far) 
{
    UpdateProjectionMatrix();
    UpdateCameraVectors();
    m_ViewMatrix = glm::lookAt(m_Position, m_Position + m_Front, m_Up);
}

void Camera::Update(Input& input, float deltaTime) {
    // --- 1. Traiter les changements d'orientation (souris et roll) ---
    int mouseX, mouseY;
    input.GetMouseMotion(mouseX, mouseY);
    if (input.IsMouseButtonPressed(SDL_BUTTON_RIGHT)) {
         ProcessMouseMovement(static_cast<float>(mouseX), static_cast<float>(mouseY));
    }

    float rollVelocity = m_RollSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_E)) { m_Roll += rollVelocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_Q)) { m_Roll -= rollVelocity; }

    // --- 2. Mettre à jour les vecteurs de direction de la caméra ---
    UpdateCameraVectors();

    // --- 3. Traiter les changements de position (clavier) en utilisant les nouveaux vecteurs ---
    float velocity = m_MovementSpeed * deltaTime;
    if (input.IsKeyPressed(SDL_SCANCODE_W) || input.IsKeyPressed(SDL_SCANCODE_UP)) { m_Position += m_Front * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_S) || input.IsKeyPressed(SDL_SCANCODE_DOWN)) { m_Position -= m_Front * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_A) || input.IsKeyPressed(SDL_SCANCODE_LEFT)) { m_Position -= m_Right * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_D) || input.IsKeyPressed(SDL_SCANCODE_RIGHT)) { m_Position += m_Right * velocity; }
    
    // Touches modifiées pour Shift/Ctrl Gauche
    if (input.IsKeyPressed(SDL_SCANCODE_LSHIFT)) { m_Position += m_WorldUp * velocity; }
    if (input.IsKeyPressed(SDL_SCANCODE_LCTRL)) { m_Position -= m_WorldUp * velocity; }

    // --- 4. Mettre à jour la matrice de vue finale avec la nouvelle position et orientation ---
    m_ViewMatrix = glm::lookAt(m_Position, m_Position + m_Front, m_Up);
    
    // --- 5. Traiter le zoom ---
    int scrollY = input.GetMouseWheelY();
    if (scrollY != 0) {
        ProcessMouseScroll(scrollY);
    }
}

void Camera::UpdateCameraVectors() {
    // Calculer le vecteur "Front" à partir du yaw et du pitch
    glm::vec3 front;
    front.x = cos(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    front.y = sin(glm::radians(m_Pitch));
    front.z = sin(glm::radians(m_Yaw)) * cos(glm::radians(m_Pitch));
    m_Front = glm::normalize(front);

    // Calculer le vecteur "Right" et "Up" non-incliné pour former une base
    m_Right = glm::normalize(glm::cross(m_Front, m_WorldUp));
    glm::vec3 localUp = glm::normalize(glm::cross(m_Right, m_Front));

    // Appliquer l'inclinaison (roll) en faisant tourner le vecteur "Up" local autour de l'axe "Front"
    glm::mat4 rollMatrix = glm::rotate(glm::mat4(1.0f), glm::radians(m_Roll), m_Front);
    m_Up = glm::vec3(rollMatrix * glm::vec4(localUp, 0.0f));
    
    // Recalculer le vecteur "Right" pour qu'il reste perpendiculaire après l'inclinaison
    m_Right = glm::normalize(glm::cross(m_Front, m_Up));
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
}

void Camera::ProcessMouseScroll(int yoffset) {
    m_Fov -= (float)yoffset;
    if (m_Fov < 1.0f) m_Fov = 1.0f;
    if (m_Fov > 45.0f) m_Fov = 45.0f;
    
    UpdateProjectionMatrix();
}