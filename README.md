# Plume Engine 🪶

**Plume Engine 🪶 Un moteur de jeu 3D simple et léger en C++**

## Roadmap

- [x] Création de fenêtre et gestion des entrées
- [ ] Contexte de rendu 3D
- [ ] Import de modèles 3D
- [ ] Caméra 3D simple
- [ ] Système d'éclairage basique (lumières directionnelles, ponctuelles)
- [ ] Gestion des textures
- [ ] Lecture de fichiers audio
- [ ] Architecture Entité-Composant (ECS) de base

# Plume Engine 🪶

A small, lightweight 3D game engine written in C++.

## Overview

Plume Engine is an educational project: a minimal 3D engine to demonstrate a simple rendering pipeline, basic ECS ideas, and a lightweight build setup. The focus is clarity and incremental learning rather than production features.

## Prerequisites

Install the following before building:

- CMake (recommended >= 3.15): https://cmake.org/download/
- A C++ toolchain (MSVC on Windows, or GCC/Clang on Linux/macOS)
- vcpkg (optional, recommended): https://github.com/microsoft/vcpkg

## Dependencies

Recommended to install via vcpkg:

- SDL2 — windowing, input, and OpenGL context
- ufbx — FBX model loading
- GLM — math (vectors, matrices)

## Build (recommended using vcpkg)

1. Clone the repository:

```powershell
git clone https://github.com/NoaSecond/Plume-Engine.git
cd Plume-Engine
```

2. Install dependencies with vcpkg (example):

```powershell
vcpkg install sdl2 ufbx glm
```

3. Configure and build with CMake (example):

```powershell
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=<path-to-vcpkg>/scripts/buildsystems/vcpkg.cmake
cmake --build build --config Release
```

Notes:

- On Windows, replace `<path-to-vcpkg>` with your vcpkg root (e.g. `C:\dev\vcpkg`).
- If you don't use vcpkg, ensure the libraries are discoverable by your CMake configuration.

## Usage — Git, commits and style

Please write commit messages and source code in English.

We follow Gitmoji for expressive commits. Example:

```powershell
git add .
git commit -m "✨ feat: add default rendering"
```

Common examples:

- ✨ Add default rendering system
- 🐛 Fix normal calculations
- 📝 Update README
- 💄 Fix indentation and formatting
- ♻️ Simplify rendering pipeline
- ⚡️ Optimize texture loading
- ✅ Add unit tests for the ECS
- 🔧 Update build scripts

Quick tip: add a short description after the type, for example `✨ Add shadow handling (basic)`.

Optional: use `gitmoji-cli` for interactive commits:

```powershell
npm install -g gitmoji-cli
npx gitmoji-cli -c
```

## Roadmap

- [x] Window creation and input handling
- [ ] 3D rendering context
- [ ] Model import (FBX)
- [ ] Simple 3D camera
- [ ] Basic lighting (directional, point lights)
- [ ] Texture management
- [ ] Audio playback
- [ ] Simple Entity-Component System (ECS)

## Contributing

Contributions are welcome. A few guidelines:

- Keep code and commit messages in English.
- Use clear, focused pull requests and include a short description of the change.
- Open an issue to discuss larger design changes before implementing them.

If you'd like, I can add a `CONTRIBUTING.md` with commit examples and a pre-commit hook template.

## License

This project is licensed under the MIT License. See `LICENSE` for details.