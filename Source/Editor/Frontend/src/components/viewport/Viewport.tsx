import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check, Box, Lightbulb, Camera, Hammer, Layers, Circle, Disc, Square, Sun, Globe, Zap } from 'lucide-react';
import { Entity, ToolType } from '../../types';
import { IconButton } from '../ui/Shared';
import { useTheme } from '../../ThemeContext';
interface ViewportProps {
  entities: Entity[]; selectedId: string | null; setSelectedId: (id: string | null) => void;
  cameraTransform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } };
  setCameraTransform: React.Dispatch<React.SetStateAction<{ position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }>>;
  activeTool: ToolType; viewMode: 'Lit' | 'Unlit' | 'Wireframe'; setViewMode: (mode: 'Lit' | 'Unlit' | 'Wireframe') => void;
  onAddEntity: (type: Entity['type'], subType?: string) => void;
}
export const Viewport: React.FC<ViewportProps> = ({ entities, selectedId, setSelectedId, cameraTransform, setCameraTransform, activeTool, viewMode, setViewMode, onAddEntity }) => {
  const { theme } = useTheme();
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const isRightMouseDownRef = useRef(false);
  const [activeLeftMenu, setActiveLeftMenu] = useState<'mesh' | 'light' | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  // Notify C++ backend of viewport dimensions when they change
  useEffect(() => {
    const updateViewportDimensions = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      
      // @ts-ignore - WebView2 API
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'viewport-bounds',
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    // Update immediately
    updateViewportDimensions();

    // Update on window resize
    window.addEventListener('resize', updateViewportDimensions);
    
    // Update periodically (in case of layout changes)
    const interval = setInterval(updateViewportDimensions, 1000);

    return () => {
      window.removeEventListener('resize', updateViewportDimensions);
      clearInterval(interval);
    };
  }, []);
  
  const handleViewportMouseDown = (e: React.MouseEvent) => { if (e.button === 2) { isRightMouseDownRef.current = true; e.currentTarget.requestPointerLock(); }};
  const handleViewportMouseUp = (e: React.MouseEvent) => { if (e.button === 2) { isRightMouseDownRef.current = false; document.exitPointerLock(); }};
  const handleViewportMouseMove = (e: React.MouseEvent) => { if (isRightMouseDownRef.current) { setCameraTransform(prev => ({ ...prev, rotation: { x: Math.max(-85, Math.min(85, prev.rotation.x - e.movementY * 0.1)), y: prev.rotation.y + e.movementX * 0.1, z: prev.rotation.z } })); }};
  const selectedEntity = entities.find(e => e.id === selectedId);
  return (
    <div className="flex-1 flex overflow-hidden">
        <div 
          className="w-10 flex flex-col items-center py-2 space-y-2 shrink-0 z-30 relative"
          style={{
            backgroundColor: theme.colors.bg.primary,
            borderRight: `1px solid ${theme.colors.border.default}`
          }}
        >
           <div className="relative">
             <IconButton icon={Box} title="Place Static Mesh" active={activeLeftMenu === 'mesh'} onClick={() => setActiveLeftMenu(activeLeftMenu === 'mesh' ? null : 'mesh')} />
             {activeLeftMenu === 'mesh' && (
               <div 
                 className="absolute left-full top-0 ml-2 rounded shadow-xl w-32 py-1 z-50 flex flex-col"
                 style={{
                   backgroundColor: theme.colors.bg.secondary,
                   border: `1px solid ${theme.colors.border.default}`
                 }}
               >
                 <button 
                   className="text-xs text-left px-3 py-1.5 flex items-center transition-colors"
                   style={{ color: theme.colors.text.primary }}
                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                   onClick={() => onAddEntity('Mesh', 'Cube')}
                 >
                   <Box size={12} className="mr-2"/> Cube
                 </button>
                 <button 
                   className="text-xs text-left px-3 py-1.5 flex items-center transition-colors"
                   style={{ color: theme.colors.text.primary }}
                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                   onClick={() => onAddEntity('Mesh', 'Sphere')}
                 >
                   <Circle size={12} className="mr-2"/> Sphere
                 </button>
               </div>
             )}
           </div>
           <div className="relative">
             <IconButton icon={Lightbulb} title="Place Light" active={activeLeftMenu === 'light'} onClick={() => setActiveLeftMenu(activeLeftMenu === 'light' ? null : 'light')} />
             {activeLeftMenu === 'light' && (
               <div 
                 className="absolute left-full top-0 ml-2 rounded shadow-xl w-36 py-1 z-50 flex flex-col"
                 style={{
                   backgroundColor: theme.colors.bg.secondary,
                   border: `1px solid ${theme.colors.border.default}`
                 }}
               >
                 <button 
                   className="text-xs text-left px-3 py-1.5 flex items-center transition-colors"
                   style={{ color: theme.colors.text.primary }}
                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                   onClick={() => onAddEntity('Light', 'Directional')}
                 >
                   <Sun size={12} className="mr-2"/> Directional
                 </button>
               </div>
             )}
           </div>
           <IconButton icon={Camera} onClick={() => onAddEntity('Camera')} />
        </div>
        <div 
          ref={viewportRef}
          className="flex-1 relative flex flex-col overflow-hidden" 
          style={{ backgroundColor: 'transparent' }}
          onMouseDown={handleViewportMouseDown} 
          onMouseUp={handleViewportMouseUp} 
          onMouseMove={handleViewportMouseMove} 
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="absolute top-2 left-2 flex space-x-2 z-10 opacity-90 transition-opacity pointer-events-auto">
            <div 
              className="backdrop-blur px-2 py-1 rounded text-xs cursor-pointer"
              style={{
                backgroundColor: `${theme.colors.bg.primary}e6`, // 90% opacity
                border: `1px solid ${theme.colors.border.default}`,
                color: theme.colors.text.primary
              }}
            >
              Perspective
            </div>
            <div className="relative" onClick={() => setShowViewModeMenu(!showViewModeMenu)}>
              <div 
                className="backdrop-blur px-2 py-1 rounded text-xs cursor-pointer"
                style={{
                  backgroundColor: `${theme.colors.bg.primary}e6`, // 90% opacity
                  border: `1px solid ${theme.colors.border.default}`,
                  color: theme.colors.text.primary
                }}
              >
                {viewMode} <ChevronDown size={10} className="ml-1 inline"/>
              </div>
              {showViewModeMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 w-32 rounded shadow-xl flex flex-col py-1 z-50"
                  style={{
                    backgroundColor: theme.colors.bg.primary,
                    border: `1px solid ${theme.colors.border.default}`
                  }}
                >
                  {['Lit', 'Unlit', 'Wireframe'].map((mode) => (
                    <div 
                      key={mode} 
                      onClick={() => setViewMode(mode as any)} 
                      className="px-3 py-1.5 text-xs flex justify-between cursor-pointer transition-colors"
                      style={{ color: theme.colors.text.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{mode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Native 3D rendering happens here - keep this div transparent */}
          <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: 'transparent' }}>
            {/* Overlay UI elements can go here with pointer-events-none */}
          </div>
        </div>
    </div>
  );
};
