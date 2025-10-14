"""
Kit de presse — Plume Engine
"""

Ce fichier rassemble les ressources de marque officielles pour Plume Engine et décrit les règles d'utilisation recommandées.

Ressources maîtres
- `branding/logo.svg` — Fichier vectoriel maître (source de vérité). Utilisez toujours le SVG pour les impressions, affichages grand format ou pour générer de nouveaux exports.

Exports fournis
- `branding/PlumeEngineIcon_1000px.png` — PNG 1000×1000 px, usage grande résolution (README, presse).
- `branding/PlumeEngineIcon_500px.png` — PNG 500×500 px, usage web et marketing.
- `branding/PlumeEngineIcon_256px.png` — PNG 256×256 px, usage icônes standards.
- `assets/icons/PlumeEngineIcon.png` — Icône utilisée à l'exécution par l'application (ne pas supprimer).
- `assets/icons/*.ico` — Variantes ICO pour Windows (256/128/48 selon besoin).

Règles d'utilisation
- Préférence : utilisez le SVG pour tout redimensionnement. Les PNG fournis sont des exports canoniques pour usages rapides.
- Espace de respiration : laissez au moins 8 % de la plus petite dimension du logo en marge autour du logo (ex. 80 px sur l'export 1000 px).
- Contrainte de couleur : n'appliquez pas d'effets ni de dégradés non-autorisés sur le logo ; utilisez plutôt la palette indiquée.
- Taille minimale recommandée : 64×64 px pour une lisibilité acceptable sur les interfaces.

Exemples d'usage
- README GitHub : `branding/PlumeEngineIcon_1000px.png` (ou `PlumeEngineIcon_500px.png` pour un rendu plus léger).
- Icône de l'application (Windows) : `assets/icons/PlumeEngineIcon.png` et les `.ico` générés.
- Communiqués de presse / images marketing : `branding/logo.svg` exporté en PNG à la résolution souhaitée.

Crédits et licence
- Auteur : Noa Second (noasecond.com)
- Licence des assets : MIT (les fichiers de `branding/` sont placés sous la même licence que le dépôt, sauf mention contraire). Si vous avez besoin d'une licence différente pour un média particulier, contactez le mainteneur.

Contact
- Pour toute question branding, contact@noasecond.com.

Remarques techniques
- Le SVG est le maître : si vous automatisez des conversions, pensez à conserver le profil de couleur sRGB et l'alpha lorsque vous exportez en PNG.
- Les scripts d'export automatique ont été retirés du dépôt ; si vous préférez une chaîne d'outils automatisée (Inkscape, CairoSVG), je peux en ajouter une et l'intégrer à CMake/CI.

Annexe — chemins utiles
- `branding/logo.svg`
- `branding/PlumeEngineIcon_1000px.png`
- `branding/PlumeEngineIcon_500px.png`
- `branding/PlumeEngineIcon_256px.png`
- `assets/icons/PlumeEngineIcon.png`