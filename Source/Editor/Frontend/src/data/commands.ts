export interface CommandInfo {
  usage: string;
  description: string;
}

export const COMMANDS: { [key: string]: CommandInfo } = {
  'help': {
    usage: "help [prefix]    // Show command list or children of a prefix",
    description: "Show help. e.g. 'help' lists top-level prefixes, 'help viewport' lists commands under viewport"
  },
  'clear': {
    usage: "clear    // Clear the console",
    description: "Clears the console log history"
  },
  'fps': {
    usage: "fps [0|1]    // Get or set FPS display (1 = visible, 0 = hidden)",
    description: "Show or hide FPS overlay. 'fps' returns current state (1 or 0). 'fps 1' shows, 'fps 0' hides."
  },
  'vsync': {
    usage: "vsync [0|1]    // Get or set VSync (1 = on, 0 = off)",
    description: "Get or set vertical sync. 'vsync' returns current value (1/0). 'vsync 1' enables, 'vsync 0' disables."
  },
  'maxfps': {
    usage: "maxfps [value]    // Get or set the max FPS cap (0 = uncapped)",
    description: "Get or set the max FPS cap used when VSync is off. 'maxfps' returns current value."
  },
  'viewport.cam.loc': {
    usage: "viewport.cam.loc x y z    // Teleport the viewport camera to position (x,y,z)",
    description: "Teleport the camera. Parameters: x y z (numbers, e.g. viewport.cam.loc 10 20 -30)",
  },
  'viewport.cam.rot': {
    usage: "viewport.cam.rot pitch yaw roll    // Set viewport camera rotation in degrees",
    description: "Set camera rotation (pitch yaw roll). Pitch is clamped between -89 and 89 degrees",
  }
};
