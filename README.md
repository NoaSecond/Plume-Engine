# Plume Engine 🪶

**Plume Engine 🪶 — A small, lightweight 3D game engine written in modern C++.**

---

## 🧰 Prerequisites

Before building, make sure you have the following installed:

### 🔹 Required
- **CMake** ≥ 3.15
  - 👉 [Download CMake](https://cmake.org/download/)
- **C++ Toolchain**
  - Windows → MSVC (Visual Studio 2022 or Build Tools)
  - Linux/macOS → GCC or Clang
- **Git** → [git-scm.com](https://git-scm.com/)

### 🔹 Recommended
- **vcpkg** (C++ package manager by Microsoft)
  - 👉 [https://github.com/microsoft/vcpkg](https://github.com/microsoft/vcpkg)

### 🔹 Recommended Development Environment
- **Visual Studio Code**
- **CMake Tools Extension** (by Microsoft)
  - This extension automatically configures IntelliSense, resolving `#include` errors in the editor and providing code completion for your dependencies.

---

## Dependencies

It is recommended to install dependencies via **vcpkg**.

- **SDL2** — Windowing, input, and OpenGL context management.
- **glad** — OpenGL function loader, essential for accessing modern OpenGL features.
- **GLM** — Mathematics library for vectors and matrices.
- **ufbx** — Lightweight library for loading `.fbx` models.

---

## Build (using CMake and vcpkg)

1.  **Clone the repository:**
    ```powershell
    git clone [https://github.com/NoaSecond/Plume-Engine.git](https://github.com/NoaSecond/Plume-Engine.git)
    cd Plume-Engine
    ```
2.  **Install dependencies with vcpkg:**
    ```powershell
    vcpkg install sdl2 glad glm ufbx
    ```
3.  **Configure and build with CMake:**
    ```powershell
    # Configure the project
    cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=<path-to-vcpkg>/scripts/buildsystems/vcpkg.cmake

    # Build the project (in Release mode)
    cmake --build build --config Release
    ```
    **Note**: Replace `<path-to-vcpkg>` with the root path of your vcpkg installation (e.g., `C:\dev\vcpkg`).

---

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

## Contributing

Contributions are welcome. A few guidelines:

- Keep code and commit messages in English.
- Use clear, focused pull requests and include a short description of the change.
- Open an issue to discuss larger design changes before implementing them.

If you'd like, I can add a `CONTRIBUTING.md` with commit examples and a pre-commit hook template.

## License

This project is licensed under the MIT License. See `LICENSE` for details.