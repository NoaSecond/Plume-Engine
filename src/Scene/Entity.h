// src/Scene/Entity.h
#pragma once

#include "Scene.h"
#include <entt/entt.hpp>
#include <cassert> // Pour les assertions

class Entity {
public:
    Entity() = default;
    Entity(entt::entity handle, Scene* scene);
    Entity(const Entity& other) = default;

    template<typename T, typename... Args>
    T& AddComponent(Args&&... args) {
        assert(!HasComponent<T>() && "L'entité a déjà ce composant !");
        return m_Scene->m_Registry.emplace<T>(m_EntityHandle, std::forward<Args>(args)...);
    }

    template<typename T>
    T& GetComponent() {
        assert(HasComponent<T>() && "L'entité n'a pas ce composant !");
        return m_Scene->m_Registry.get<T>(m_EntityHandle);
    }

    template<typename T>
    bool HasComponent() {
        return m_Scene->m_Registry.all_of<T>(m_EntityHandle);
    }

    // On rendra l'opérateur booléen pour vérifier si l'entité est valide
    operator bool() const { return m_EntityHandle != entt::null; }

private:
    entt::entity m_EntityHandle{ entt::null };
    Scene* m_Scene = nullptr;
};