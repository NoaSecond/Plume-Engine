Plume Launcher - Specifications
Le Plume Launcher est l’application officielle permettant d’installer, gérer et maintenir les différentes versions du Plume Engine Editor sur un ordinateur. Il assure également la gestion des projets, des mises à jour et des dépendances nécessaires au bon fonctionnement du moteur.
1. Rôle général du Launcher
Le Launcher constitue la porte d’entrée de l’écosystème Plume Engine.
Il centralise :
L'installation et la désinstallation des versions du moteur
La gestion des mises à jour
La création et l’organisation des projets
Le lien avec la documentation officielle et le site web
Les paramètres utilisateur globaux (installations, chemins, préférences)
Le téléchargement des composants additionnels (templates, plugins, packs de contenu)
L’objectif du Launcher est d’offrir une expérience simple, fluide, moderne et intuitive, à l’image de l’éditeur lui-même.
2. Plateformes supportées
Le Launcher doit fonctionner sur :
Windows (plateforme principale)
Linux
MacOS
Des builds natives sont prévues pour chaque OS, avec auto-update compatible.
Système de fichiers et architecture
Le Launcher doit maintenir une structure claire :
PlumeEngine/
├─ Projects/
│  ├─ MyGame/
│  │  ├─ MyGame.plume
├─ Launcher/
├─ Versions/
│  ├─ 1.0 /
│  ├─ 1.4 /



Plume Engine Editor - Specifications
1. Informations Techniques et Objectifs
1.1. Vision générale
Plume Engine est un moteur de jeu créé par Noa Second et développé en C++. Léger, simple d’utilisation, mais inspiré des workflows professionnels (Unreal Engine).
1.2. Objectifs du moteur
Offrir une expérience de développement fluide et accessible tout en gardant une base technique solide.
Assurer une compatibilité étendue et une longue durée de vie.
Séparation stricte entre le Runtime (Performance) et l'Éditeur (Ergonomie Web).
1.3. Plateformes visées
Le moteur doit être capable de fonctionner sur ces plateformes et de compiler/packager des projets (Builds standalone) pour celles-ci.
Windows
Linux
MacOS
1.4. Système de rendu
Rendu principal sur Vulkan
Conçu pour être extensible vers :
DirectX 12
OpenGL
Metal
Nécessite un Rendering Hardware Interface (RHI) permettant l’abstraction graphique
1.5. Éditeur
Le frontend est développé avec une technologie web. L’éditeur tourne dans une application propre à lui même, sans avoir besoin de navigateur tiers.
Il inclut un logo / icône du moteur ainsi qu’un splash screen au lancement.
Une gestion du Hot-Reloading de l'UI pour le développement de l'éditeur lui-même.
Les éléments de branding seront stoqués en format vectoriel .SVG dans un dossier dédié.
1.5.1. Splash screen

1.5.2. Icone

1.6. Direction graphique et designs
L’identité visuelle de l’éditeur Plume Engine adopte une approche moderne, épurée et professionnelle, inspirée des standards des moteurs AAA tels qu’Unreal Engine, Unity ou Godot 4. L’objectif est d’offrir une interface claire, lisible et élégante, en accord avec la vision d’un outil ambitieux mais accessible, destiné à durer dans le temps.
1.6.1. Principes esthétiques
Minimalisme fonctionnel : l’interface privilégie les surfaces lisses, les séparateurs fins, les contrastes précis et les éléments UI non-intrusifs.
Hiérarchie visuelle claire : chaque panneau, texte ou icône suit une grille cohérente (alignements stricts, marges uniformes, composants espacés).
Lisibilité renforcée : typographie géométrique moderne (ex : Inter, Roboto, Open Sans).
Couleurs sobres : palette orientée gris neutres, bleus discrets et nuances contrôlées pour les états (hover, selection, erreurs, warnings).
Icônes vectorielles : toutes les icônes sont en SVG, sharp et adaptables, conçues pour rester parfaitement lisibles en petite taille, elles seront stockées dans un dossier dédié.
Cohérence technique : le design UI suit une logique “flat + neumorphisme léger” pour offrir du relief subtil sans perturber l’utilisateur.
1.6.2. Mécanismes UI
Animations discrètes : transitions de menus, fade-in des panneaux, highlight progressif lors des sélections.
Thèmes dynamiques : changement de thème en temps réel (Hot-Reloading UI).
Feedback visuel constant : survol, focus, active states, chargements progressifs.
Support HDR + haute densité : l’éditeur s’adapte aux écrans haute résolution (4K, DPI scaling).
1.6.3. Thèmes par défaut
L’éditeur propose trois thèmes officiels, conçus pour répondre aux préférences de différents types d’utilisateurs.
Chaque thème applique sa propre palette, luminosité, densité, ambiance et style de feedback.
1.6.4. Thème 1 – Plume Dark
Le thème de référence, inspiré des moteurs AAA modernes.
Palette dominante : gris anthracite, touches de bleu glacier
Accent : cyan lumineux pour la sélection
Ambiance : sobre, professionnelle, optimale pour les longues sessions
Idéal pour : développeurs, artistes techniques, programmeurs Gameplay
1.6.5. Thème 2 – Nebula Midnight
Un thème stylisé pour les environnements sombres ou les écrans OLED.
Palette dominante : noirs profonds, violets froids
Accent : magenta doux + bleu néon
Ambiance : futuriste, immersive, typée “sci-fi / cyberpunk”
Idéal pour : créatifs, sound designers, level designers
1.6.6. Thème 3 – Feather Light
Thème lumineux, minimaliste et respirant.
Palette dominante : gris clair, blanc cassé
Accent : bleu pastel
Ambiance : claire, lisible, adaptée aux environnements très lumineux
Idéal pour : game designers, UI/UX designers, documentation, travail en journée
1.6.7. Cohérence ergonomique
Tous les panneaux sont redimensionnables et dockables.
Les composants (boutons, toggles, dropdowns) adoptent un format standardisé afin d’éviter la surcharge visuelle.
Les séparateurs et bordures suivent le même style : 1px, faible opacité.
Le design maintient une cohérence totale entre l’Éditeur, le Launcher, et les dialogues systèmes internes.
On privilégiera des border radius légers pour adoucir les angles.
2. Contenu de l’Éditeur (Layout)
Les panneaux qui composent le layout doivent être ancrables et redimensionnables.
2.1. Bandeau supérieur
Inclut le logo ainsi qu’un menu contenant
File : New Level, Open Level, Save, Save As, Import Asset, Export Project, Exit.
Edit : Undo/Redo history, Editor Preferences (Thème, Raccourcis), Project Settings (Game splash screen, Game icon, Start level).
Window : Permet d'afficher/masquer les panneaux (Viewport, Outliner, Details, etc.).
Tools : Plugins.
Help : Website, Documentation, Repository, About.
2.2. Bandeau inférieur
Bouton pour ouvrir le content browser (Ctrl+L), numéro de version de l’éditeur, bouton pour ouvrir la console.
2.3. Console
Outil de débogage et de logs. Fonctionnalités :
Log Output : Affichage coloré (Info=Blanc, Warning=Jaune, Error=Rouge).
Filtres : Checkbox pour masquer certains types de logs.
Command Input : Barre de saisie pour exécuter des commandes runtime (ex: r.ShowHitboxes 1, map Level2).
Clear : Bouton pour nettoyer l'historique (Ctrl+L).
2.4. Toolbar
Barre d'outils pour les actions rapides :
Sauvegarde : Save Current Level.
Outils Transform : Select, Translate, Rotate, Scale (Icônes exclusives).
Snapping : Toggle Grid Snap, Toggle Rotation Snap.
Simulation :
Play : Lance le jeu dans le Viewport ou une nouvelle fenêtre.
Pause : Fige la boucle de jeu mais garde le rendu.
Stop : Arrête la simulation et remet la scène à l'état initial.
Build : Menu déroulant (Build Geometry, Build Lighting, Build All).
2.5. Content Browser
Accessible via Ctrl + Espace (Drawer) ou ancrable. Fonctionnalités :
Gestion des fichiers du projet
Import via drag & drop ou bouton Import
Arborescence de fichiers (Tree View) à gauche + Grille d'assets à droite.
Filtrage par type (Texture, Material, Mesh, Audio).
Barre de recherche rapide.
Drag & Drop vers le Viewport ou les slots de composants.
Clic droit dans une zone vide :
Créer un dossier
Ouvrir le dossier actuel dans l’explorateur
Coller
Importer
Créer un asset (Material, Actor, Level)
Clic droit sur un élément :
Supprimer
Renommer
Dupliquer
Copier
Clic droit sur un dossier : 
Changer la couleur
Renommer
Supprimer
Dupliquer
Copier
2.6. Viewport
Le cœur de l'interaction 3D. Fonctionnalités :
Navigation : Fly Camera (Clic Droit + WASD/ZQSD/Flèches directionnelles + Q/E pour hauteur).
Gizmo fly camera : En bas à gauche du viewport, un gyzmo pour connaître l’orientation de la vue dans la scène.
Gizmos sur entité : Translation, Rotation, Scale (visible sur l'objet sélectionné). Changement Move/Rotate/Scale avec Espace ou par touches directes (ex : W/E/R).
Snapping : Grille magnétique pour Position (ex: 10/50/100 unités) et Rotation (ex: 10/45/90 degrés).
Modes de vue :
Lit (PBR complet).
Unlit (Couleur diffuse sans ombre).
Wireframe (Maillage).
Lighting Only (Débug lumières).
Modes Perspective / Orthographic
Overlay : Affichage des FPS, nombre de drawcalls, et primitives.
Synchronisation automatique avec la Hierarchy (highlight de selection)
Grille au niveau de hauteur 0 qui permet de visualiser un sol et la grille de snapping grâce à la taille des sections de la grille.

2.7. Hierarchy (outliner)
Liste complète des entités du level actif. Fonctionnalités :
Représentation arborescente (Parent/Enfant).
Barre de recherche d'entité.
Visibilité (Icône œil) : Masquer/Afficher dans l'éditeur sans supprimer.
Verrouillage (Icône cadenas) : Empêcher la sélection accidentelle.
Drag & Drop : Attacher une entité à une autre (Parenting).
Double-clic : focus caméra sur l’entité sélectionnée
Raccourcis :
F2 / Entrée : renommer
Ctrl + D : dupliquer
Ctrl + C : copier
Suppr : supprimer
Menu clic droit :
Supprimer
Renommer
Dupliquer
Copier
Move view to (focus caméra)
2.8. Details
Inspecteur de propriétés contextuelles :
Header : Nom de l'entité, ID, Tags.
Transform : Champs numériques location, rotation et scale (Vector3 avec drag sur X/Y/Z).
Variables liées à l’élément.
3. Systèmes et Types de Fichiers
3.1. Actor (Entité)
Peut être placé dans un level
Composé d’une partie script et d’une partie scène (composants : mesh, light…).
3.2. Static Mesh
Formats d'import : .FBX, .OBJ, .GLTF.
Propriétés : Géométrie, UVs, Normales.
Éditeur dédié : Prévisualisation du mesh seul, assignation des slots de matériaux, génération de collision simple.
3.3. Skeletal Mesh
Formats d'import : .FBX, .GLTF.
Support du Squelette (Hierarchy of Bones).
Gestion des sockets.
3.4. Materials
Pipeline : Physically Based Rendering (PBR).
Propriétés standards : Albedo (Base Color), Normal, Metallic, Roughness, Ambient Occlusion, Emissive.
Shader Graph (Objectif long terme) : Éditeur nodal.
Mode Simple (MVP) : Inspecteur de paramètres où l'on glisse les textures.
Compilation : Transpilation des shaders vers SPIR-V (Vulkan) ou HLSL (DirectX).
3.5. Textures
Formats : .PNG, .JPG, .JPEG, .TGA, .SVG.
Paramètres :
Compression (BC1/DXT1, BC3/DXT5, ou non compressé).
sRGB (Oui pour Albedo, Non pour Normal/Roughness).
Mipmaps : Génération automatique.
Filtrage : Nearest (Pixel Art) ou Linear.
Prise en charge du vectoriel.
3.6. Audio
Formats : .WAV (natif/haute qualité), .OGG (compressé), .MP3.
Onglet de visualisation dédié (Play, Pause, Stop) visualisation de l’onde par canaux et du volume par canaux.
3.7. Level
Format de fichier : .plumeLevel (Format JSON ou Binaire propriétaire).
Contient : La liste des entités et leurs détails sérialisés.
4. Moteur Physique et Scripting
4.1. Physique
Intégration d'un moteur tiers robuste PhysX (plus tard, offrir la possibilité de sélectionner le moteur physique entre PhysX et Jolt Physics).
Composants :
Colliders : Box, Sphere, Capsule, MeshCollider.
RigidBody : Masse, Drag, Gravity, Kinematic vs Dynamic.
Système de Raycast pour l'interaction.
4.2. Scripting (Logique de jeu)
Rechargement : Système de Hot-Reload des DLLs de jeu (si possible) pour ne pas redémarrer l'éditeur à chaque changement de code jeu.
4.3. Input System
Prise en charge des entrées (Clavier, Souris, Manette, Joysticks, MIDI, Raw inputs).
On peut créer un fichier Input (équivalent InputAction chez Unreal Engine) ou un fichier InputMapping (équivalent InputMappingContext chez Unreal Engine).
