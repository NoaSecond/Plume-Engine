import React, { useRef, useState, useEffect } from 'react';
import Gizmo3D from './Gizmo3D';
import { ChevronDown, Check, Box, Lightbulb, Camera, Hammer, Layers, Circle, Disc, Square, Sun, Globe, Zap } from 'lucide-react';
import { Entity, ToolType } from '../../types';
import { IconButton } from '../ui/Shared';
import { useTheme } from '../../ThemeContext';

interface ViewportProps {
  entities: Entity[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  cameraTransform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } };
  setCameraTransform: React.Dispatch<React.SetStateAction<{ position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }>>;
  activeTool: ToolType;
  viewMode: 'Lit' | 'Unlit' | 'Wireframe';
  setViewMode: (mode: 'Lit' | 'Unlit' | 'Wireframe') => void;
  onAddEntity: (type: Entity['type'], subType?: string) => void;
  showToolbar?: boolean;
  controlsEnabled?: boolean;
}

export const Viewport: React.FC<ViewportProps> = ({ entities, selectedId, setSelectedId, cameraTransform, setCameraTransform, activeTool, viewMode, setViewMode, onAddEntity, showToolbar = true, controlsEnabled = true }) => {
  const { theme } = useTheme();
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showCameraModeMenu, setShowCameraModeMenu] = useState(false);
  const [showViewOrientationMenu, setShowViewOrientationMenu] = useState(false);
  const [cameraMode, setCameraMode] = useState<'SixDOF' | 'ThreeDOF'>('ThreeDOF');
  const [viewportView, setViewportView] = useState('Perspective');
  const isRightMouseDownRef = useRef(false);
  const [activeLeftMenu, setActiveLeftMenu] = useState<'mesh' | 'light' | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const viewModeRef = useRef<HTMLDivElement>(null);
  const cameraModeRef = useRef<HTMLDivElement>(null);
  const viewOrientationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync initial camera mode to backend
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({
        action: 'set-camera-mode',
        mode: cameraMode === 'SixDOF' ? 0 : 1
      });
    }
  }, []); // Run once on mount

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close View Mode if open and click is outside
      if (showViewModeMenu && viewModeRef.current && !viewModeRef.current.contains(event.target as Node)) {
        setShowViewModeMenu(false);
      }
      // Close Camera Mode if open and click is outside
      if (showCameraModeMenu && cameraModeRef.current && !cameraModeRef.current.contains(event.target as Node)) {
        setShowCameraModeMenu(false);
      }
      // Close View Orientation if open and click is outside
      if (showViewOrientationMenu && viewOrientationRef.current && !viewOrientationRef.current.contains(event.target as Node)) {
        setShowViewOrientationMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showViewModeMenu, showCameraModeMenu]);

  // Notify C++ backend of viewport dimensions when they change
  useEffect(() => {
    const updateViewportDimensions = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();

      // Only send updates if the viewport is visible and has dimension
      if (rect.width <= 0 || rect.height <= 0) return;

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

  // Clear controls when disabled
  useEffect(() => {
    if (!controlsEnabled) {
      keysPressed.current.clear();
      // @ts-ignore - WebView2 API
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({
          action: 'camera-input',
          keys: []
        });
      }
    }
  }, [controlsEnabled]);

  // Send camera-input continuously while keys are held (allows smooth movement when holding arrows/WASD)
  useEffect(() => {
    let rafId: number = 0;
    const tick = () => {
      try {
        if (controlsEnabled && keysPressed.current.size > 0) {
          // @ts-ignore - WebView2 API
          if (window.chrome?.webview) {
            // @ts-ignore
            window.chrome.webview.postMessage({
              action: 'camera-input',
              keys: Array.from(keysPressed.current)
            });
          }
        }
      } catch (e) {
        console.error("Error in camera tick:", e);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [controlsEnabled]);

  // Send keyboard input to C++ for camera movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsEnabled) return;
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
      // Always handle key up to prevent stuck keys if controls get disabled while pressed
      const key = e.key.toLowerCase();
      if (keysPressed.current.has(key)) {
        keysPressed.current.delete(key);
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlsEnabled]);

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (!controlsEnabled) return;
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
    // Always handle mouse up for cleanup
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

  const is2DView = ['Front', 'Back', 'Top', 'Bottom', 'Left', 'Right'].includes(viewportView);

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (!controlsEnabled) return;
    if (isRightMouseDownRef.current && (e.movementX !== 0 || e.movementY !== 0)) {
      if (is2DView) {
        // Send to C++ for panning
        // @ts-ignore
        if (window.chrome?.webview) {
          // @ts-ignore
          window.chrome.webview.postMessage({
            action: 'camera-pan',
            dx: e.movementX,
            dy: e.movementY
          });
        }
      } else {
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
    }
  };

  const selectedEntity = entities.find(e => e.id === selectedId);

  const viewOptions = [
    { label: 'Perspective', value: 'Perspective', category: '3D' },
    { label: 'Orthographic', value: 'Orthographic', category: '3D' },
    { type: 'separator' },
    { label: 'Front', value: 'Front', category: '2D' },
    { label: 'Back', value: 'Back', category: '2D' },
    { label: 'Top', value: 'Top', category: '2D' },
    { label: 'Bottom', value: 'Bottom', category: '2D' },
    { label: 'Left', value: 'Left', category: '2D' },
    { label: 'Right', value: 'Right', category: '2D' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {showToolbar && (
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
      )}

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
          <div className="relative" ref={viewOrientationRef} onClick={() => {
            const newState = !showViewOrientationMenu;
            setShowViewOrientationMenu(newState);
            if (newState) {
              setShowViewModeMenu(false);
              setShowCameraModeMenu(false);
            }
          }}>
            <div
              className="backdrop-blur px-2 py-1 rounded text-xs cursor-pointer flex items-center"
              style={{
                backgroundColor: `${theme.colors.bg.primary}e6`, // 90% opacity
                border: `1px solid ${theme.colors.border.default}`,
                color: theme.colors.text.primary
              }}
            >
              {viewportView} <ChevronDown size={10} className="ml-1" />
            </div>
            {showViewOrientationMenu && (
              <div
                className="absolute top-full left-0 mt-1 w-32 rounded shadow-xl flex flex-col py-1 z-50 pointer-events-auto"
                style={{
                  backgroundColor: theme.colors.bg.primary,
                  border: `1px solid ${theme.colors.border.default}`
                }}
              >
                {viewOptions.map((opt, idx) => {
                  if (opt.type === 'separator') {
                    return <div key={`sep-${idx}`} className="h-px mx-1 my-1" style={{ backgroundColor: theme.colors.border.subtle }} />;
                  }
                  return (
                    <div
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewportView(opt.value!);
                        // @ts-ignore
                        if (window.chrome?.webview) {
                          // @ts-ignore
                          window.chrome.webview.postMessage({
                            action: 'set-viewport-view',
                            view: opt.value
                          });
                        }
                        setShowViewOrientationMenu(false);
                      }}
                      className="px-3 py-1.5 text-xs flex justify-between cursor-pointer transition-colors"
                      style={{ color: theme.colors.text.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{opt.label}</span>
                      {viewportView === opt.value && <Check size={12} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative" ref={viewModeRef} onClick={() => {
            const newState = !showViewModeMenu;
            setShowViewModeMenu(newState);
            if (newState) setShowCameraModeMenu(false);
          }}>
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
                className="absolute top-full left-0 mt-1 w-32 rounded shadow-xl flex flex-col py-1 z-50 pointer-events-auto"
                style={{
                  backgroundColor: theme.colors.bg.primary,
                  border: `1px solid ${theme.colors.border.default}`
                }}
              >
                {['Lit', 'Unlit', 'Wireframe'].map((mode) => (
                  <div
                    key={mode}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode(mode as any);
                      setShowViewModeMenu(false);
                    }}
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

          <div className="relative" ref={cameraModeRef} onClick={() => {
            const newState = !showCameraModeMenu;
            setShowCameraModeMenu(newState);
            if (newState) setShowViewModeMenu(false);
          }}>
            <div
              className="backdrop-blur px-2 py-1 rounded text-xs cursor-pointer select-none transition-colors flex items-center"
              style={{
                backgroundColor: `${theme.colors.bg.primary}e6`,
                border: `1px solid ${theme.colors.border.default}`,
                color: theme.colors.text.primary
              }}
            >
              {cameraMode === 'SixDOF' ? "6DOF" : "3DOF"} <ChevronDown size={10} className="ml-1" />
            </div>
            {showCameraModeMenu && (
              <div
                className="absolute top-full left-0 mt-1 w-32 rounded shadow-xl flex flex-col py-1 z-50 pointer-events-auto"
                style={{
                  backgroundColor: theme.colors.bg.primary,
                  border: `1px solid ${theme.colors.border.default}`
                }}
              >
                {['SixDOF', 'ThreeDOF'].map((mode) => (
                  <div
                    key={mode}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newMode = mode as 'SixDOF' | 'ThreeDOF';
                      setCameraMode(newMode);
                      // @ts-ignore
                      if (window.chrome?.webview) {
                        // @ts-ignore
                        window.chrome.webview.postMessage({
                          action: 'set-camera-mode',
                          mode: newMode === 'SixDOF' ? 0 : 1
                        });
                      }
                      setShowCameraModeMenu(false);
                    }}
                    className="px-3 py-1.5 text-xs flex justify-between cursor-pointer transition-colors"
                    style={{ color: theme.colors.text.primary }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.accent.primary}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>{mode === 'SixDOF' ? "6DOF" : "3DOF"}</span>
                    {cameraMode === mode && <Check size={12} />}
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
                <span style={{ color: '#ef4444' }}>X {cameraTransform.position.x.toFixed(1)}</span>{' '}
                <span style={{ color: '#22c55e' }}>Y {cameraTransform.position.y.toFixed(1)}</span>{' '}
                <span style={{ color: '#3b82f6' }}>Z {cameraTransform.position.z.toFixed(1)}</span>
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

        {/* Gizmo overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <Gizmo3D rotation={cameraTransform.rotation} />
        </div>

        {/* Center overlay for tool info or hints could go here */}
      </div>
    </div>
  );
};
