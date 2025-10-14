# Cahier des charges — Plume Engine

Version: 0.1
Date: 2025-10-14
Auteur: Noa Second

## 1. Contexte

Plume Engine est un moteur de jeu 3D léger en C++.

## 2. Objectifs

- Permettre le chargement de modèles FBX et un pipeline de rendu basique.
- Être facile à compiler et étendre (CMake + vcpkg).

## 3. Périmètre

Inclus:

- Création de fenêtre et gestion des entrées (SDL2).
- Contexte de rendu OpenGL (initialisation et boucle de rendu).
- Chargement de modèles FBX (utilisation de `ufbx`).
- Mathématiques via GLM.
- Structure basique d'ECS (entités, composants, systèmes) minimale.

Exclus (hors périmètre initial):

- Système de rendu physique (PBR) complet
- Editeur visuel intégré
- Réseau/Multijoueur avancé

## 4. Exigences fonctionnelles

RF1 — Initialisation

- Le moteur doit créer une fenêtre et initialiser un contexte OpenGL.

RF2 — Entrées

- Le moteur doit capter les entrées clavier et souris via SDL2.

RF3 — Chargement de modèles

- Le moteur doit pouvoir charger un modèle FBX simple et exposer ses meshes et matériaux.

RF4 — Rendu de base

- Le moteur doit afficher un mesh simple (triangle/maillage importé) avec une couleur/textures basiques.

RF5 — Architecture ECS

- Le projet doit fournir une implémentation minimale d'ECS permettant d'attacher des composants transform, mesh, et script à des entités.

## 5. Exigences non-fonctionnelles

RNF1 — Portabilité

- Le projet doit construire sur Windows (MSVC) et idéalement Linux/macOS (GCC/Clang) sans modifications majeures.

RNF2 — Licence

- Code publié sous licence MIT.

RNF3 — Lisibilité

- Le code doit être documenté et suivre des conventions de nommage cohérentes.

RNF4 — Dépendances

- Les dépendances externes devraient être gérées via vcpkg pour simplifier l'installation.

## 8. Critères d'acceptation

- Le projet doit se compiler avec les instructions du README.
- Un exemple doit afficher un modèle importé ou un mesh simple.
- Les commits et le code doivent être en anglais.

---

Ce cahier des charges est un point de départ et pourra être affiné selon les besoins du projet et les contributions.