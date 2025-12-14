# Plume Engine Plugins

Ce dossier contient tous les plugins pour Plume Engine.

## Structure

Chaque plugin doit avoir son propre sous-dossier avec la structure suivante:

```
PluginName/
├── PluginName.h          # Header principal du plugin
├── PluginName.cpp        # Implémentation du plugin
├── README.md             # Documentation du plugin
└── Assets/               # Ressources du plugin (optionnel)
```

## Créer un nouveau plugin

1. Créer un nouveau dossier dans `Plugins/`
2. Créer une classe qui hérite de `IPlugin` (définie dans `Core/Plugin.h`)
3. Implémenter les méthodes requises:
   - `GetInfo()` - Informations du plugin
   - `Initialize()` - Initialisation
   - `Shutdown()` - Nettoyage
   - `Update()` - Mise à jour (appelée chaque frame)
   - `IsEnabled()` / `SetEnabled()` - État d'activation

4. Enregistrer le plugin dans `EditorMain.cpp`:
```cpp
auto plugin = std::shared_ptr<Plume::IPlugin>(&YourPlugin::Get(), [](Plume::IPlugin*){});
Plume::PluginManager::Get().RegisterPlugin(plugin);
```

5. Ajouter les sources au `CMakeLists.txt`

## Catégories de plugins

- **Official** - Plugins créés par l'équipe Plume Engine
- **Community** - Plugins créés par la communauté
- **System** - Plugins système essentiels (non désactivables)

## Gestion des plugins

Les plugins peuvent être gérés via l'interface graphique:
- Menu **Tools > Plugins**
- Activer/désactiver les plugins
- Rechercher et filtrer par catégorie

## Architecture

Le système de plugins utilise:
- `IPlugin` - Interface de base
- `PluginManager` - Gestionnaire singleton
- `PluginInfo` - Métadonnées (nom, version, auteur, catégorie)

Les plugins sont chargés au démarrage et mis à jour dans la boucle principale de l'éditeur.
