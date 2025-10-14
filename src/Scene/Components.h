// src/Scene/Components.h
#pragma once

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <string>
#include <memory>
// On a besoin d'inclure Model.h maintenant
#include "../Renderer/Model/Model.h"

struct TagComponent {
    std::string Tag;
    TagComponent() = default;
    TagComponent(const TagComponent&) = default;
    TagComponent(const std::string& tag) : Tag(tag) {}
};

struct TransformComponent {
    glm::vec3 Translation = { 0.0f, 0.0f, 0.0f };
    glm::vec3 Rotation = { 0.0f, 0.0f, 0.0f };
    glm::vec3 Scale = { 1.0f, 1.0f, 1.0f };
    TransformComponent() = default;
    TransformComponent(const TransformComponent&) = default;

    glm::mat4 GetTransform() const {
        glm::mat4 rotation = glm::rotate(glm::mat4(1.0f), Rotation.x, { 1, 0, 0 })
                           * glm::rotate(glm::mat4(1.0f), Rotation.y, { 0, 1, 0 })
                           * glm::rotate(glm::mat4(1.0f), Rotation.z, { 0, 0, 1 });
        return glm::translate(glm::mat4(1.0f), Translation)
             * rotation
             * glm::scale(glm::mat4(1.0f), Scale);
    }
};

// RENOMMÉ et MODIFIÉ : Ce composant contient maintenant un modèle 3D complet.
struct ModelComponent {
    std::shared_ptr<Model> model;

    ModelComponent() = default;
    ModelComponent(const ModelComponent&) = default;
    ModelComponent(std::shared_ptr<Model> model) : model(model) {}
};