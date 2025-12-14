import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { Viewport } from './components/viewport/Viewport';
import { OutlinerPanel } from './components/panels/OutlinerPanel';
import { DetailsPanel } from './components/panels/DetailsPanel';
import { ContentBrowserPanel } from './components/panels/ContentBrowserPanel';
import { ConsolePanel } from './components/panels/ConsolePanel';
import { EditorPreferences } from './components/panels/EditorPreferences';
import { PluginManager } from './components/panels/PluginManager';
import { ProjectSettings } from './components/modals/ProjectSettings';
import { PlumeLogo } from './components/ui/PlumeLogo';
import { DEFAULT_SCENE } from './data/constants';
import { COMMANDS } from './data/commands';
import { Entity, LogEntry, ToolType } from './types';
import { useTheme } from './ThemeContext';

export default function App() {
  const { theme } = useTheme();

  // Plugin System State
  const [plugins, setPlugins] = useState<any[]>([]);
  const [refreshingPluginId, setRefreshingPluginId] = useState<string | null>(null);

  // Editor State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContentBrowser, setShowContentBrowser] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isAboutClosing, setIsAboutClosing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [renderingAPI, setRenderingAPI] = useState<'DirectX12' | 'Vulkan' | 'OpenGL' | 'Metal'>('OpenGL');
  const [cameraTransform, setCameraTransform] = useState({ position: { x: 0, y: -50, z: -150 }, rotation: { x: 20, y: 0, z: 0 } });

  // Settings
  const [showFPS, setShowFPS] = useState(false);
  const [fpsValue, setFpsValue] = useState(0);
  const showFPSRef = useRef<boolean>(showFPS);
  const [vsyncEnabled, setVsyncEnabled] = useState(true);
  const [maxFpsCap, setMaxFpsCap] = useState(144);
  const [viewMode, setViewMode] = useState<'Lit' | 'Unlit' | 'Wireframe'>('Lit');

  // Refs
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const handleAboutClose = () => {
    setIsAboutClosing(true);
    setTimeout(() => {
      setIsAboutClosing(false);
      setShowAboutModal(false);
    }, 180);
  };

  const addLog = useCallback((msg: string, level: 'INFO' | 'WARN' | 'ERROR' | 'USER') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-99), { id: Date.now(), time, level, msg }]);
  }, []);

  const refreshPlugin = (id: string) => {
    if (refreshingPluginId) return;
    setRefreshingPluginId(id);

    if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.postMessage({ action: 'refresh-plugin', id });
    }

    // Minimum "Refreshing..." display time of 1s
    setTimeout(() => {
      setRefreshingPluginId(null);
    }, 1000);
  };

  // Main Initialization & Event Listener Effect
  useEffect(() => {
    // Listen to messages from native (WebView2 PostWebMessage)
    const handleNativeMessage = (e: any) => {
      try {
        const data = (e && e.data) ? e.data : (e && e.detail) ? e.detail : e;
        if (!data) return;
        const action = data.action;

        if (action === 'plugin-list') {
          if (data.plugins) {
            setPlugins(data.plugins);
            addLog(`Loaded ${data.plugins.length} plugins`, 'INFO');
          }
        }

        if (action === 'ui_config' && data.uiConfig) {
          if (typeof data.uiConfig.showFPS !== 'undefined') {
            const val = !!data.uiConfig.showFPS;
            setShowFPS(val);
            showFPSRef.current = val;
          }
          if (typeof data.uiConfig.vsync !== 'undefined') {
            setVsyncEnabled(!!data.uiConfig.vsync);
          }
          if (typeof data.uiConfig.maxFPS !== 'undefined') {
            setMaxFpsCap(data.uiConfig.maxFPS);
          }
        }
      } catch (e) { }
    };

    try {
      if ((window as any).chrome?.webview) {
        (window as any).chrome.webview.addEventListener('message', handleNativeMessage);
        // Request initial plugin list once listener is attached
        setTimeout(() => {
          (window as any).chrome.webview.postMessage({ action: 'get-plugins' });
        }, 500);
      }
      else window.addEventListener('message', handleNativeMessage as any);
    } catch (e) { }

    const loadSceneData = () => {
      const script = document.createElement('script');
      script.src = './scene_data.js';
      script.onload = () => {
        const data = (window as any).PLUME_SCENE_DATA;
        if (data) {
          setEntities(data);
          addLog('Scene loaded successfully', 'INFO');
        }
      };
      script.onerror = () => {
        setEntities(DEFAULT_SCENE);
        addLog('Failed to load scene, using default', 'WARN');
      };
      document.body.appendChild(script);
    };

    const loadRenderingData = () => {
      const script = document.createElement('script');
      script.src = './rendering_data.js';
      script.onload = () => {
        const data = (window as any).PLUME_RENDERING_DATA;
        if (data && data.graphicsAPI) {
          setRenderingAPI(data.graphicsAPI);
        }
        if (data && typeof data.fps === 'number') {
          setFpsValue(Math.round(data.fps));
        }
        if (data && data.uiConfig) {
          if (typeof data.uiConfig.showFPS !== 'undefined') {
            const val = !!data.uiConfig.showFPS;
            setShowFPS(val);
            showFPSRef.current = val;
          }
          if (typeof data.uiConfig.vsync !== 'undefined') {
            setVsyncEnabled(!!data.uiConfig.vsync);
          }
          if (typeof data.uiConfig.maxFPS !== 'undefined') {
            setMaxFpsCap(data.uiConfig.maxFPS);
          }
        }
      };
      document.body.appendChild(script);
    };

    loadSceneData();
    loadRenderingData();

    // Initial sycn
    try {
      const init = (window as any).PLUME_RENDERING_DATA;
      if (init) {
        if (init.graphicsAPI) setRenderingAPI(init.graphicsAPI);
        if (typeof init.fps === 'number') setFpsValue(Math.round(init.fps));
        if (init.uiConfig && typeof init.uiConfig.showFPS !== 'undefined') {
          const val = !!init.uiConfig.showFPS;
          setShowFPS(val);
          showFPSRef.current = val;
        }
        if (init.camera) {
          const rawRot = init.camera.rotation || { x: 0, y: 0, z: 0 };
          const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
          const normalizeAngle = (v: number) => { let a = ((v % 360) + 360) % 360; if (a >= 180) a -= 360; return a; };
          const normRaw = { x: normalizeAngle(rawRot.x), y: normalizeAngle(rawRot.y), z: normalizeAngle(rawRot.z) };
          const normRot = { x: clamp(normRaw.x, -89, 89), y: normRaw.y, z: normRaw.z };
          setCameraTransform({ position: init.camera.position || { x: 0, y: 0, z: 0 }, rotation: normRot });
        }
      }
    } catch (e) { }

    // Poll for rendering data updates every 500ms
    const renderingInterval = setInterval(() => {
      const script = document.createElement('script');
      script.src = './rendering_data.js?t=' + Date.now();
      script.onload = () => {
        const data = (window as any).PLUME_RENDERING_DATA;
        if (data && data.graphicsAPI) {
          setRenderingAPI(data.graphicsAPI);
        }
        // Update FPS and sync camera transform from C++ backend
        if (data && typeof data.fps === 'number') {
          setFpsValue(Math.round(data.fps));
        }
        if (data && data.uiConfig && typeof data.uiConfig.showFPS !== 'undefined') {
          const val = !!data.uiConfig.showFPS;
          if (val !== showFPSRef.current) {
            showFPSRef.current = val;
            setShowFPS(val);
          } else {
            setShowFPS(val);
          }
        }
        if (data && data.uiConfig) {
          if (typeof data.uiConfig.vsync !== 'undefined') setVsyncEnabled(!!data.uiConfig.vsync);
          if (typeof data.uiConfig.maxFPS !== 'undefined') setMaxFpsCap(data.uiConfig.maxFPS);
        }

        if (data && data.camera) {
          // Normalize and clamp rotation values coming from the native backend
          const rawRot = data.camera.rotation || { x: 0, y: 0, z: 0 };
          const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
          const normalizeAngle = (v: number) => {
            // Normalize to [-180,180)
            let a = ((v % 360) + 360) % 360;
            if (a >= 180) a -= 360;
            return a;
          };
          // First normalize all incoming angles, then clamp pitch
          const normRaw = {
            x: normalizeAngle(rawRot.x),
            y: normalizeAngle(rawRot.y),
            z: normalizeAngle(rawRot.z)
          };
          const normRot = {
            x: clamp(normRaw.x, -89, 89), // restrict pitch to avoid gimbal/inversion
            y: normRaw.y,
            z: normRaw.z
          };
          setCameraTransform({
            position: data.camera.position || { x: 0, y: 0, z: 0 },
            rotation: normRot
          });
        }
        document.body.removeChild(script);
      };
      script.onerror = () => {
        document.body.removeChild(script);
      };
      document.body.appendChild(script);
    }, 500);

    addLog('Plume Engine Editor initialized', 'INFO');

    return () => clearInterval(renderingInterval);
  }, [addLog]);

  const normalizeAngle = (v: number) => {
    let a = ((v % 360) + 360) % 360;
    if (a >= 180) a -= 360;
    return a;
  };

  const handleExecuteCommand = (cmd: string) => {
    const raw = cmd.trim();
    if (!raw) return;
    addLog(`> ${raw}`, 'USER');

    const helpPrefixMatch = raw.match(/^(help|\?|commands)\s+([a-z0-9_.-]+)$/i);
    if (helpPrefixMatch) {
      const prefix = helpPrefixMatch[2].toLowerCase();
      const exact = COMMANDS[prefix];
      if (exact) {
        addLog(`${prefix}: ${exact.description}`, 'INFO');
        addLog(`${exact.usage}`, 'INFO');
        return;
      }
      const keys = Object.keys(COMMANDS);
      const normalized = prefix.replace(/^\.+|\.+$/g, '');
      const matched = keys.filter(k => k === normalized || k.startsWith(normalized + '.'));
      if (matched.length === 0) {
        addLog(`No commands under ${prefix}`, 'WARN');
        return;
      }
      addLog(`Commands under '${prefix}':`, 'INFO');
      const children = new Set<string>();
      for (const k of matched) {
        if (k === normalized) {
          children.add('');
        } else {
          const rest = k.slice(normalized.length + 1);
          const next = rest.split('.')[0];
          children.add(next);
        }
      }
      Array.from(children).sort().forEach((child) => {
        if (child === '') {
          const info = COMMANDS[normalized];
          if (info) addLog(`${normalized}: ${info.usage} — ${info.description}`, 'INFO');
          return;
        }
        const full = normalized + '.' + child;
        const isLeaf = !!COMMANDS[full];
        const descendantCount = keys.filter(k => k === full || k.startsWith(full + '.')).length;
        if (isLeaf) {
          const info = COMMANDS[full];
          addLog(`${full}: ${info.usage} — ${info.description}`, 'INFO');
        }
        if (descendantCount > 1) {
          addLog(`${full}/ (${descendantCount})`, 'INFO');
        }
      });
      return;
    }

    if (/^(help|\?|commands)$/i.test(raw)) {
      addLog('Top-level command prefixes:', 'INFO');
      const keys = Object.keys(COMMANDS);
      const top = Array.from(new Set(keys.map(k => k.split('.')[0]))).sort();
      top.forEach(t => {
        const count = keys.filter(k => k === t || k.startsWith(t + '.')).length;
        addLog(`${t}/ (${count})`, 'INFO');
      });
      addLog("Note: to see child commands of a prefix use e.g. 'help viewport' or 'help viewport.cam'", 'INFO');
      return;
    }

    const parts = raw.replace(/,/g, ' ').split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1).map(v => Number(v));

    if (name === 'fps') {
      if (args.length === 0) {
        addLog(`${showFPS ? 1 : 0}`, 'INFO');
        return;
      }
      const v = args[0];
      if (v === 0) {
        setShowFPS(false);
        addLog('FPS display hidden', 'INFO');
        return;
      }
      if (v === 1) {
        setShowFPS(true);
        addLog('FPS display shown', 'INFO');
        return;
      }
      addLog("Usage: fps [0|1]", 'ERROR');
      return;
    }

    if (name === 'vsync') {
      if (args.length === 0) {
        addLog(`${vsyncEnabled ? 1 : 0}`, 'INFO');
        return;
      }
      const v = args[0];
      if (v === 0) {
        setVsyncEnabled(false);
        if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-vsync', value: false });
        addLog('VSync disabled', 'INFO');
        return;
      }
      if (v === 1) {
        setVsyncEnabled(true);
        if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-vsync', value: true });
        addLog('VSync enabled', 'INFO');
        return;
      }
      addLog("Usage: vsync [0|1]", 'ERROR');
      return;
    }

    if (name === 'maxfps') {
      if (args.length === 0) {
        addLog(`${maxFpsCap}`, 'INFO');
        return;
      }
      const v = args[0];
      if (v >= 0) {
        setMaxFpsCap(v);
        if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'set-maxfps', value: v });
        addLog(`Max FPS set to ${v}`, 'INFO');
        return;
      }
      addLog('Usage: maxfps [value >= 0]', 'ERROR');
      return;
    }

    if (name === 'clear') {
      setLogs([]);
      return;
    }

    if (name === 'viewport.cam.loc') {
      if (args.length < 3 || !args.slice(0, 3).every(Number.isFinite)) {
        addLog('Usage: viewport.cam.loc x y z', 'ERROR');
        return;
      }
      const [x, y, z] = args;
      setCameraTransform(prev => ({ ...prev, position: { x, y, z } }));
      if ((window as any).chrome?.webview) {
        (window as any).chrome.webview.postMessage({ action: 'set-camera', position: { x, y, z } });
      }
      addLog(`Camera position set to (${x}, ${y}, ${z})`, 'INFO');
      return;
    }

    if (name === 'viewport.cam.rot') {
      if (args.length < 3 || !args.slice(0, 3).every(Number.isFinite)) {
        addLog('Usage: viewport.cam.rot pitch yaw roll', 'ERROR');
        return;
      }
      let [px, py, pz] = args;
      px = Math.max(-89, Math.min(89, normalizeAngle(px)));
      py = normalizeAngle(py);
      pz = normalizeAngle(pz);
      setCameraTransform(prev => ({ ...prev, rotation: { x: px, y: py, z: pz } }));
      if ((window as any).chrome?.webview) {
        (window as any).chrome.webview.postMessage({ action: 'set-camera', rotation: { x: px, y: py, z: pz } });
      }
      addLog(`Camera rotation set to (${px}, ${py}, ${pz})`, 'INFO');
      return;
    }

    addLog(`Unknown command: ${name}`, 'WARN');
  };

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      const moveSpeed = deltaTime * 0.1;

      // Batch camera updates to reduce state changes
      let needsCameraUpdate = false;
      const cameraUpdates: any = {};

      if (keysPressed.current['KeyW']) {
        cameraUpdates.z = moveSpeed;
        needsCameraUpdate = true;
      }
      if (keysPressed.current['KeyS']) {
        cameraUpdates.z = -moveSpeed;
        needsCameraUpdate = true;
      }

      if (needsCameraUpdate) {
        setCameraTransform(prev => ({
          ...prev,
          position: {
            ...prev.position,
            z: prev.position.z + (cameraUpdates.z || 0)
          }
        }));
      }

      // Optimize entity rotation updates
      if (isPlaying) {
        setEntities(prev => prev.map(ent => {
          if (ent.type === 'Mesh') {
            return {
              ...ent,
              transform: {
                ...ent.transform,
                rotation: {
                  ...ent.transform.rotation,
                  z: ent.transform.rotation.z + (deltaTime * 0.001)
                }
              }
            };
          }
          return ent;
        }));
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);

  useEffect(() => { requestRef.current = requestAnimationFrame(animate); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [animate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTyping = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping && !(e.ctrlKey || e.altKey || e.metaKey) && e.key !== 'Escape') {
        return;
      }

      keysPressed.current[e.code] = true;

      if (e.key === 'Escape') {
        if (showPreferences) {
          setShowPreferences(false);
          return;
        }
        if (showPluginManager) {
          setShowPluginManager(false);
          return;
        }
        if (showProjectSettings) {
          setShowProjectSettings(false);
          return;
        }
        if (showContentBrowser) {
          setShowContentBrowser(false);
          return;
        }
      }

      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setShowContentBrowser(p => !p);
        setShowConsole(false);
      }
      if (e.ctrlKey && e.code === 'KeyI') {
        e.preventDefault();
        setShowConsole(p => !p);
        setShowContentBrowser(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [showPreferences, showPluginManager, showProjectSettings, showContentBrowser]);

  const selectedEntity = entities.find(e => e.id === selectedId);

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden font-sans select-none"
      style={{
        backgroundColor: 'transparent',
        color: theme.colors.text.primary
      }}
    >
      <Header isPlaying={isPlaying} onSave={() => { }} onAbout={() => setShowAboutModal(true)} onPreferences={() => setShowPreferences(true)} onPlugins={() => setShowPluginManager(true)} onProjectSettings={() => setShowProjectSettings(true)} />
      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} onSave={() => { }} onDelete={() => { }} isPlaying={isPlaying} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onStop={() => setIsPlaying(false)} />
      <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: 'transparent' }}>
        <Viewport entities={entities} selectedId={selectedId} setSelectedId={setSelectedId} cameraTransform={cameraTransform} setCameraTransform={setCameraTransform} activeTool={activeTool} viewMode={viewMode} setViewMode={setViewMode} onAddEntity={(type) => setEntities([...entities, { id: Date.now().toString(), name: type, type, visible: true, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } }])} />
        <div
          className="w-80 flex flex-col shrink-0 border-l"
          style={{
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default
          }}
        >
          <OutlinerPanel
            entities={entities}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onAddEntity={(type) => {
              const newEntity: Entity = {
                id: Date.now().toString(),
                name: type,
                type,
                visible: true,
                transform: {
                  position: { x: 0, y: 0, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 }
                }
              };
              setEntities([...entities, newEntity]);
            }}
            setEntities={setEntities}
            onDuplicate={(ent) => {
              const newEntity: Entity = {
                ...ent,
                id: Date.now().toString(),
                name: `${ent.name}_Copy`
              };
              setEntities([...entities, newEntity]);
            }}
            onDelete={(id) => {
              setEntities(entities.filter(e => e.id !== id));
              if (selectedId === id) {
                setSelectedId(null);
              }
            }}
          />
          <DetailsPanel selectedEntity={selectedEntity} setEntities={setEntities} />
        </div>
      </div>
      <ContentBrowserPanel show={showContentBrowser} onClose={() => setShowContentBrowser(false)} onLog={addLog} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <ConsolePanel
        logs={logs}
        onClear={() => setLogs([])}
        onExecuteCommand={(cmd) => handleExecuteCommand(cmd)}
        isOpen={showConsole}
        setIsOpen={setShowConsole}
      />
      <EditorPreferences isOpen={showPreferences} onClose={() => setShowPreferences(false)} />
      <PluginManager
        isOpen={showPluginManager}
        onClose={() => setShowPluginManager(false)}
        plugins={plugins}
        onTogglePlugin={(id, enabled) => {
          if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage({ action: 'toggle-plugin', id, enabled });
            // Optimistic update
            setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
          }
        }}
      />
      <ProjectSettings isOpen={showProjectSettings} onClose={() => setShowProjectSettings(false)} />
      <div
        className="h-6 border-t flex items-center justify-between px-2 text-[10px]"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderColor: theme.colors.border.default,
          color: theme.colors.text.muted,
          zIndex: 2000,
          position: 'relative',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowContentBrowser(p => !p);
              setShowConsole(false);
            }}
            className="hover:underline cursor-pointer"
          >
            Content Browser (Ctrl+Space)
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <button
            onClick={() => {
              setShowConsole(p => !p);
              setShowContentBrowser(false);
            }}
            className="hover:underline cursor-pointer"
          >
            Console (Ctrl+I)
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{entities.length} entities</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Plugins Section */}
          <div className="flex items-center gap-3 border-r pr-3" style={{ borderColor: theme.colors.border.default }}>
            {plugins.filter(p => p.enabled).map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <span style={{ color: theme.colors.text.primary }}>{p.name} {p.version ? `v${p.version}` : ''}</span>
                <button
                  onClick={() => refreshPlugin(p.id)}
                  className={`hover:text-white cursor-pointer px-1 ${refreshingPluginId === p.id ? 'animate-spin' : ''}`}
                  title="Refresh Plugin"
                  style={{ color: theme.colors.text.muted }}
                  disabled={refreshingPluginId === p.id}
                >
                  {refreshingPluginId === p.id ? '↻' : '↺'}
                </button>
                {refreshingPluginId === p.id && <span className="text-[9px] italic" style={{ color: theme.colors.text.muted }}>Refreshing...</span>}
                <span style={{ color: theme.colors.border.default, marginLeft: 8 }}>|</span>
              </div>
            ))}
          </div>

          <span style={{ color: theme.colors.accent.primary }}>Plume Engine v0.1 Alpha</span>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{theme.displayName}</span>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{renderingAPI}</span>
          {showFPS && (
            <>
              <span style={{ color: theme.colors.border.default }}>|</span>
              <span>FPS: {fpsValue}</span>
            </>
          )}
        </div>
      </div>
      {(showAboutModal || isAboutClosing) && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isAboutClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}`}>
          <div
            className={`border rounded p-6 ${isAboutClosing ? 'modal-content-exit' : 'modal-content'}`}
            style={{
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.border.default,
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <PlumeLogo />
            <h2 className="text-2xl font-light mt-4" style={{ color: theme.colors.text.primary }}>Plume Engine</h2>
            <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>Version 0.1 Alpha</p>
            <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>Created by Noa Second</p>
            <p className="text-xs mt-4" style={{ color: theme.colors.text.muted }}>Current theme: {theme.displayName}</p>
            <button
              onClick={handleAboutClose}
              className="mt-4 px-4 py-2 rounded"
              style={{
                backgroundColor: theme.colors.accent.primary,
                color: theme.colors.text.primary
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
