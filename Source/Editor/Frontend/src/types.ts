export type Transform = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};
export type Entity = {
  id: string;
  name: string;
  type: 'Mesh' | 'Light' | 'Camera' | 'Folder';
  subType?: string;
  visible: boolean;
  transform: Transform;
};
export type LogEntry = {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'USER';
  msg: string;
};
export type ToolType = 'select' | 'move' | 'rotate' | 'scale';
