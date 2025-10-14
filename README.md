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

#### Dépendances principales :
* **SDL2** : Pour le fenêtrage, les entrées et le contexte OpenGL.
* **ufbx** : Pour le chargement des modèles 3D au format FBX.
* **GLM** : Pour les mathématiques OpenGL (vecteurs, matrices).

#### Instructions de compilation (avec CMake & vcpkg)
1.  **Clonez le dépôt :**
    ```bash
    git clone [https://github.com/VOTRE_NOM_UTILISATEUR/plume-engine.git](https://github.com/VOTRE_NOM_UTILISATEUR/plume-engine.git)
    cd plume-engine
    ```
2.  **Installez les dépendances avec vcpkg :**
    ```bash
    vcpkg install sdl2 ufbx glm
    ```
3.  **Configurez et compilez avec CMake :**
    ```bash
    cmake -B build -DCMAKE_TOOLCHAIN_FILE=[chemin_vers_vcpkg]/scripts/buildsystems/vcpkg.cmake
    cmake --build build
    ```

## Usage de Gitmoji

Gitmoji est une convention visuelle pour les messages de commit qui utilise des emojis afin de rendre l'historique Git plus lisible et expressif. Voir le catalogue officiel : https://gitmoji.dev/

- Vous pouvez simplement préfixer vos messages de commit avec l'emoji correspondant :

```bash
git add .
git commit -m "✨ feat: add default rendering"
```

- Ou utiliser l'outil interactif `gitmoji-cli` (optionnel) :

```bash
# installation (npm)
npm install -g gitmoji-cli

# lancer l'interface interactive pour créer un commit gitmoji
npx gitmoji-cli -c
```

Remarque : veuillez rédiger les messages de commit et le code source en anglais.

Common examples

- ✨ Add default rendering system
- 🐛 Fix normal calculations
- 📝 Update README
- 💄 Fix indentation and formatting
- ♻️ Simplify rendering pipeline
- ⚡️ Optimize texture loading
- ✅ Add unit tests for the ECS
- 🔧 Update build scripts

Quick tip: add a short description after the type, for example `✨ Add shadow handling (basic)` to stay clear.

## Licence

Ce projet est distribué sous la **licence MIT**. Voir le fichier `LICENSE` pour plus de détails.