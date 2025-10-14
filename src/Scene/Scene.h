// src/Scene/Scene.h
#pragma once

#include <entt/entt.hpp>

class Entity; // Déclaration anticipée

class Scene {
public:
    Scene();
    ~Scene();

    Entity CreateEntity(const std::string& name = std::string());

    // Exposer le registre pour que les systèmes (comme le rendu) puissent l'utiliser
    entt::registry& GetRegistry() { return m_Registry; }

private:
    entt::registry m_Registry;

    friend class Entity;
};