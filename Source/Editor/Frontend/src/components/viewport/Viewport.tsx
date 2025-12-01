import React, { useRef, useState } from 'react';
import { ChevronDown, Check, Box, Lightbulb, Camera, Hammer, Layers, Circle, Disc, Square, Sun, Globe, Zap } from 'lucide-react';
import { Entity, ToolType } from '../../types';
import { IconButton } from '../ui/Shared';
interface ViewportProps {
  entities: Entity[]; selectedId: string | null; setSelectedId: (id: string | null) => void;
  cameraTransform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } };
  setCameraTransform: React.Dispatch<React.SetStateAction<{ position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }>>;
  activeTool: ToolType; viewMode: 'Lit' | 'Unlit' | 'Wireframe'; setViewMode: (mode: 'Lit' | 'Unlit' | 'Wireframe') => void;
  onAddEntity: (type: Entity['type'], subType?: string) => void;
}
export const Viewport: React.FC<ViewportProps> = ({ entities, selectedId, setSelectedId, cameraTransform, setCameraTransform, activeTool, viewMode, setViewMode, onAddEntity }) => {
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const isRightMouseDownRef = useRef(false);
  const [activeLeftMenu, setActiveLeftMenu] = useState<'mesh' | 'light' | null>(null);
  const handleViewportMouseDown = (e: React.MouseEvent) => { if (e.button === 2) { isRightMouseDownRef.current = true; e.currentTarget.requestPointerLock(); }};
  const handleViewportMouseUp = (e: React.MouseEvent) => { if (e.button === 2) { isRightMouseDownRef.current = false; document.exitPointerLock(); }};
  const handleViewportMouseMove = (e: React.MouseEvent) => { if (isRightMouseDownRef.current) { setCameraTransform(prev => ({ ...prev, rotation: { x: Math.max(-85, Math.min(85, prev.rotation.x - e.movementY * 0.1)), y: prev.rotation.y + e.movementX * 0.1, z: prev.rotation.z } })); }};
  const selectedEntity = entities.find(e => e.id === selectedId);
  return (
    <div className="flex-1 flex overflow-hidden">
        <div className="w-10 bg-[#1e1e1e] border-r border-black flex flex-col items-center py-2 space-y-2 shrink-0 z-30 relative">
           <div className="relative"><IconButton icon={Box} title="Place Static Mesh" active={activeLeftMenu === 'mesh'} onClick={() => setActiveLeftMenu(activeLeftMenu === 'mesh' ? null : 'mesh')} />{activeLeftMenu === 'mesh' && (<div className="absolute left-full top-0 ml-2 bg-[#252525] border border-black rounded shadow-xl w-32 py-1 z-50 flex flex-col"><button className="text-xs text-left px-3 py-1.5 hover:bg-blue-600 flex items-center" onClick={() => onAddEntity('Mesh', 'Cube')}><Box size={12} className="mr-2"/> Cube</button><button className="text-xs text-left px-3 py-1.5 hover:bg-blue-600 flex items-center" onClick={() => onAddEntity('Mesh', 'Sphere')}><Circle size={12} className="mr-2"/> Sphere</button></div>)}</div>
           <div className="relative"><IconButton icon={Lightbulb} title="Place Light" active={activeLeftMenu === 'light'} onClick={() => setActiveLeftMenu(activeLeftMenu === 'light' ? null : 'light')} />{activeLeftMenu === 'light' && (<div className="absolute left-full top-0 ml-2 bg-[#252525] border border-black rounded shadow-xl w-36 py-1 z-50 flex flex-col"><button className="text-xs text-left px-3 py-1.5 hover:bg-blue-600 flex items-center" onClick={() => onAddEntity('Light', 'Directional')}><Sun size={12} className="mr-2"/> Directional</button></div>)}</div>
           <IconButton icon={Camera} onClick={() => onAddEntity('Camera')} />
        </div>
        <div className="flex-1 bg-[#0a0a0a] relative flex flex-col overflow-hidden" onMouseDown={handleViewportMouseDown} onMouseUp={handleViewportMouseUp} onMouseMove={handleViewportMouseMove} onContextMenu={(e) => e.preventDefault()}>
          <div className="absolute top-2 left-2 flex space-x-2 z-10 opacity-90 transition-opacity pointer-events-auto">
            <div className="bg-[#1e1e1e]/90 backdrop-blur px-2 py-1 rounded text-xs border border-slate-700 cursor-pointer">Perspective</div>
            <div className="relative" onClick={() => setShowViewModeMenu(!showViewModeMenu)}><div className="bg-[#1e1e1e]/90 backdrop-blur px-2 py-1 rounded text-xs border border-slate-700 cursor-pointer">{viewMode} <ChevronDown size={10} className="ml-1 inline"/></div>{showViewModeMenu && (<div className="absolute top-full left-0 mt-1 w-32 bg-[#1e1e1e] border border-slate-700 rounded shadow-xl flex flex-col py-1 z-50">{['Lit', 'Unlit', 'Wireframe'].map((mode) => (<div key={mode} onClick={() => setViewMode(mode as any)} className="px-3 py-1.5 hover:bg-blue-600 text-xs flex justify-between cursor-pointer"><span>{mode}</span></div>))}</div>)}</div>
          </div>
          <div className={`w-full h-full relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#050505] ${viewMode === 'Wireframe' ? 'grayscale contrast-125' : ''}`}>
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px', transform: `perspective(1000px) rotateX(${60 + cameraTransform.rotation.x}deg) rotateY(${cameraTransform.rotation.y}deg) translateY(${cameraTransform.position.y - 100}px) translateX(${cameraTransform.position.x}px) translateZ(${cameraTransform.position.z}px) scale(2)`, transformOrigin: 'center 80%' }}></div>
             <div className="absolute top-1/2 left-1/2 w-0 h-0" style={{ transformStyle: 'preserve-3d', transform: `perspective(1000px) rotateX(${-20 + cameraTransform.rotation.x}deg) rotateY(${15 + cameraTransform.rotation.y}deg) translateX(${cameraTransform.position.x}px) translateY(${cameraTransform.position.y}px) translateZ(${cameraTransform.position.z}px)` }}>
                {entities.filter(e => e.visible).map((ent) => (
                  <div key={ent.id} onMouseDown={(e) => { e.stopPropagation(); if(e.button===0) setSelectedId(ent.id); }} className={`absolute -ml-10 -mt-10 border cursor-pointer transition-colors duration-75 flex items-center justify-center ${selectedId === ent.id ? 'border-orange-500 bg-orange-500/20' : 'border-slate-600 bg-slate-700/50'} ${ent.subType === 'Sphere' ? 'rounded-full' : ''}`} style={{ transform: `translate3d(${ent.transform.position.x}px, ${-ent.transform.position.y}px, ${-ent.transform.position.z}px) rotateX(${ent.transform.rotation.x}deg) rotateY(${ent.transform.rotation.y}deg) rotateZ(${ent.transform.rotation.z}deg) scale3d(${ent.transform.scale.x}, ${ent.transform.scale.y}, ${ent.transform.scale.z})`, width: '80px', height: '80px' }}>
                    <span className="text-[8px] opacity-50">{ent.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
    </div>
  );
};
