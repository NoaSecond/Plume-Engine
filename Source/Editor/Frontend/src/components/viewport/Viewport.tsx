import React, { useRef, useState, useEffect } from 'react';
import Gizmo3D from './Gizmo3D';
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
  const keysPressed = useRef<Set<string>>(new Set());

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

  // Send camera-input continuously while keys are held (allows smooth movement when holding arrows/WASD)
  useEffect(() => {
    let rafId: number = 0;
    const tick = () => {
      try {
        if (keysPressed.current.size > 0) {
          // @ts-ignore - WebView2 API
          if (window.chrome?.webview) {
            // @ts-ignore
            window.chrome.webview.postMessage({
              action: 'camera-input',
              keys: Array.from(keysPressed.current)
            });
          }
        }
      } catch (e) { }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Send keyboard input to C++ for camera movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!keysPressed.current.has(key)) {
        keysPressed.current.add(key);
        // @ts-ignore - WebView2 API
        if (window.chrome?.webview) {
          // @ts-ignore
          window.chrome.webview.postMessage({
            action: 'camera-input',
            keys: Array.from(keysPressed.current)
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
      // @ts-ignore - WebView2 API
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'camera-input',
          keys: Array.from(keysPressed.current)
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) { // Right mouse button
      isRightMouseDownRef.current = true;
      e.currentTarget.requestPointerLock();
      // @ts-ignore
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'camera-mouse',
          button: 'right',
          state: 'down'
        });
      }
    }
  };
  const handleViewportMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) {
      isRightMouseDownRef.current = false;
      document.exitPointerLock();
      // @ts-ignore
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'camera-mouse',
          button: 'right',
          state: 'up'
        });
      }
    }
  };
  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (isRightMouseDownRef.current && (e.movementX !== 0 || e.movementY !== 0)) {
      const rotX = -e.movementY * 0.15;
      const rotY = -e.movementX * 0.15;

      // Update local React state for gizmo
      setCameraTransform(prev => ({
        ...prev,
        rotation: {
          x: Math.max(-89, Math.min(89, prev.rotation.x + rotX)),
          y: prev.rotation.y + rotY,
          z: prev.rotation.z
        }
      }));

      // Send to C++ for actual camera rotation
      // @ts-ignore
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'camera-rotate',
          deltaX: rotX,
          deltaY: rotY
        });
      }
    }
  };
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
                <Box size={12} className="mr-2" /> Cube
              </button>
              <button
                className="text-xs text-left px-3 py-1.5 flex items-center transition-colors"
                style={{ color: theme.colors.text.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => onAddEntity('Mesh', 'Sphere')}
              >
                <Circle size={12} className="mr-2" /> Sphere
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
                <Sun size={12} className="mr-2" /> Directional
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
              {viewMode} <ChevronDown size={10} className="ml-1 inline" />
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
        {/* Camera position and rotation display - top right */}
        <div className="absolute top-2 right-2 z-10 opacity-90 pointer-events-none">
          <div
            className="backdrop-blur px-3 py-2 rounded text-xs font-mono"
            style={{
              backgroundColor: `${theme.colors.bg.primary}e6`,
              border: `1px solid ${theme.colors.border.default}`,
              color: theme.colors.text.secondary
            }}
          >
            <div className="flex flex-col space-y-0.5">
              <div>
                <span style={{ color: theme.colors.text.muted }}>Pos:</span>{' '}
                <span style={{ color: '#ef4444' }}>X {cameraTransform.position.x.toFixed(2)}</span>{' '}
                <span style={{ color: '#22c55e' }}>Y {cameraTransform.position.y.toFixed(2)}</span>{' '}
                <span style={{ color: '#3b82f6' }}>Z {cameraTransform.position.z.toFixed(2)}</span>
              </div>
              <div>
                <span style={{ color: theme.colors.text.muted }}>Rot:</span>{' '}
                <span style={{ color: '#ef4444' }}>X {cameraTransform.rotation.x.toFixed(1)}°</span>{' '}
                <span style={{ color: '#22c55e' }}>Y {cameraTransform.rotation.y.toFixed(1)}°</span>{' '}
                <span style={{ color: '#3b82f6' }}>Z {cameraTransform.rotation.z.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>
        {/* Native 3D rendering happens here - keep this div transparent */}
        <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          {/* Camera orientation gizmo - bottom left (WebGL 3D) */}
          <div
            className="absolute bottom-4 left-4 w-24 h-24 rounded-lg flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: `${theme.colors.bg.primary}cc`,
              border: `1px solid ${theme.colors.border.default}`,
              overflow: 'hidden'
            }}
          >
            {/* Use a dedicated WebGL canvas for a true 3D gizmo */}
            {/* @ts-ignore */}
            <Gizmo3D rotation={cameraTransform.rotation} size={96} />
          </div>
        </div>
      </div>
    </div>
  );
};
