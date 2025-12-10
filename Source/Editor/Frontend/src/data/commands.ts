export interface CommandInfo {
  usage: string;
  description: string;
}

export const COMMANDS: { [key: string]: CommandInfo } = {
  'viewport.cam.loc': {
    usage: 'viewport.cam.loc x y z    // Teleporte la caméra à la position (x,y,z)',
    description: "Téléporte la caméra. Paramètres: x y z (nombres, ex: viewport.cam.loc 10 20 -30)",
  },
  'viewport.cam.rot': {
    usage: 'viewport.cam.rot pitch yaw roll    // Définit la rotation de la caméra en degrés',
    description: "Définit la rotation de la caméra (pitch yaw roll). Pitch sera clampé entre -89 et 89°",
  }
};
