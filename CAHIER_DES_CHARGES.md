# Cahier des charges — Plume Engine

Version: 0.1
Date: 2025-10-14
Auteur: Noa Second

Plume Engine est un moteur de jeu 3D léger en C++.

## 1. Interface utilisateur et éditeur

### 1.1 Fenêtres et onglets principaux

- Editeur de scène (Scene) : vue 3D (perspective/orthographique), gizmos, navigation caméra.
- Hiérarchie (Hierarchy) : liste des entités de la scène, drag & drop, recherche.
- Inspecteur (Inspector) : propriétés de l'entité sélectionnée (transform, composants, valeurs éditables).
- Gestionnaire d'assets (Assets) : navigateur de fichiers, prévisualisation, import/export.
	- Content Browser (navigateur de contenu) : voir la section 1.1.1 pour plus de détails.
- Editeur de matériaux/shaders : éditeur node-based et éditeur texte pour shaders, aperçu temps réel.
- Editeur d'animation : timeline, keyframes, courbes, blend trees basiques.
- Console/Logs : sortie standard, erreurs, filtres et recherche.
- Fenêtre de build/configuration : paramètres de build, cibles, profils.

#### 1.1.1 Content Browser (navigateur de contenu)

Le Content Browser est un navigateur d'assets. Il doit pouvoir être ouvert :

- via le menu `View > Content Browser` ;
- via le raccourci clavier global `Ctrl+Space` (configurable dans les préférences).

Fonctionnalités clés :

- Vue arborescente / grille hybride : navigation par dossier et aperçu en vignettes.
- Recherche instantanée (filtre par nom, type, tag, métadonnées) avec résultats mis à jour à la frappe.
- Filtres rapides : textures, modèles, matériaux, audio, scripts, scènes, etc.
- Drag & drop d'un asset vers la Scene view ou la Hiérarchie pour instancier ou référencer.
- Aperçu détaillé : mini-viewer pour images/textures, aperçu de modèle simple, waveform pour audio.
- Context menu riche : Open, Rename, Delete, Show in Explorer, Reimport, Create Material from Texture, Convert to Prefab.
- Multi-selection et opérations en masse (delete, move, tag, export).
- Tags et favoris : marquer des assets pour accès rapide.
- Support glTF/FBX/PNG/WAV et autres via le pipeline d'import.
- Option dockable/floating : le Content Browser peut être ancré dans l'interface ou ouvert en fenêtre séparée.
- Historique et recent items : accès rapide aux fichiers récemment utilisés.

Comportements UX recommandés :

- `Ctrl+Space` ouvre/ferme le Content Browser quel que soit le focus actuel, avec focus directement sur la recherche si la fenêtre est ouverte.
- Si le Content Browser est déjà ancré, `Ctrl+Space` le mettra en évidence (bring to front) ; s'il est flottant, `Ctrl+Space` basculera sa visibilité.
- L'ouverture par raccourci doit être rapide (préférer lazy-loading des métadonnées mais garder un cache pour recherche instantanée).

### 1.2 Menus recommandés

- Fichier (File) : Nouveau, Ouvrir, Enregistrer, Importer/Exporter, Paramètres du projet, Quitter.
- Edition (Edit) : Annuler/Rétablir, Couper/Copier/Coller, Préférences.
- Affichage (View) : basculer panneaux, thèmes, réinitialiser layout.
- Objet (Object) : créer entités (Camera, Light, Mesh...), grouper, aligner.
- Outils (Tools) : transformation, snap, terrain, profiler.
- Exécution (Play) : Play/Pause/Stop, options d'exécution dans l'éditeur.

### 1.3 Barres d'outils et raccourcis

- Barre principale : New/Open/Save, Play/Pause/Stop, Undo/Redo, gizmo mode (Move/Rotate/Scale), snap toggle.
- Barre contextuelle pour la scène : modes de rendu (Shaded/Wireframe), grille, options de caméra.
- Raccourcis essentiels : Ctrl+S (save), Ctrl+Maj+S (save-all), M/R/S (move/rotate/scale), Space-bar (switch between move/rotate/scale), Ctrl+Z/Ctrl+Y (undo/redo), Ctrl+K (quick search).
	- Edition opérateurs : Ctrl+C (copier l'entité/asset sélectionné), Ctrl+V (coller/instancier), Ctrl+X (couper), Ctrl+D (dupliquer la sélection).
	- Navigation scène : utilisation des touches fléchées du clavier pour naviguer dans la scène (pan/translate de la caméra ou sélection selon le mode — à préciser dans les préférences).

### 1.4 Dialogues et workflows

- Import wizard (options de scale, flip axes, material handling).
- Boîte de confirmation pour suppression/enregistrement.
- Preferences / Settings (global et projet).
- Gestionnaire de plugins/extensions (installer, activer, mettre à jour).

### 1.5 Considérations non-fonctionnelles liées à l'éditeur

- Performance pour grands projets (lazy loading des assets, pagination).
- Sauvegarde et sécurité (prévention de perte de données, confirmations explicites).
- Extensibilité (plugins, scripting sandbox), accessibilité (thèmes, taille des polices) et localisation.

## 2. Critères d'acceptation

- Le projet doit se compiler avec les instructions du README.
- Un exemple doit afficher un modèle importé ou un mesh simple.
- Les commits et le code doivent être en anglais.

---

Ce cahier des charges est un point de départ et pourra être affiné selon les besoins du projet et les contributions.