// src/Scene/Scene.cpp
#include "Scene.h"
#include "Entity.h"
#include "Components.h"

Scene::Scene() {
}

Scene::~Scene() {
}

Entity Scene::CreateEntity(const std::string& name) {
    Entity entity = { m_Registry.create(), this };
    entity.AddComponent<TransformComponent>();
    auto& tag = entity.AddComponent<TagComponent>();
    tag.Tag = name.empty() ? "Entity" : name;
    return entity;
}

// L'implémentation de Entity(handle, scene) doit être ici
// car Scene.h est maintenant complètement défini.
Entity::Entity(entt::entity handle, Scene* scene)
    : m_EntityHandle(handle), m_Scene(scene) {}