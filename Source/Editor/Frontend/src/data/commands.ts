export interface CommandInfo {
  usage: string;
  description: string;
}

export const COMMANDS: { [key: string]: CommandInfo } = {
  'help': {
    usage: 'help [prefix]    // Affiche la liste des commandes ou les enfants d\'un préfixe',
    description: "Affiche l'aide. Ex: 'help' liste les préfixes, 'help viewport' liste les commandes sous viewport"
  },
  'viewport.cam.loc': {
    usage: 'viewport.cam.loc x y z    // Teleporte la caméra à la position (x,y,z)',
    description: "Téléporte la caméra. Paramètres: x y z (nombres, ex: viewport.cam.loc 10 20 -30)",
  },
  'viewport.cam.rot': {
    usage: 'viewport.cam.rot pitch yaw roll    // Définit la rotation de la caméra en degrés',
    description: "Définit la rotation de la caméra (pitch yaw roll). Pitch sera clampé entre -89 et 89°",
  }
};
