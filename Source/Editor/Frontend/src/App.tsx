import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { TabSystem, Tab } from './components/layout/TabSystem';
import { SceneEditor } from './components/editors/SceneEditor';
import { StaticMeshEditor } from './components/editors/StaticMeshEditor';
import { TextureViewer } from './components/editors/TextureViewer';
import { MaterialEditor } from './components/editors/MaterialEditor/MaterialEditor';
import { SoundViewer } from './components/editors/SoundViewer';
import { AnimationEditor } from './components/editors/AnimationEditor';
import { SkeletonEditor } from './components/editors/SkeletonEditor';
import { PhysicsAssetEditor } from './components/editors/PhysicsAssetEditor';
import { SkeletalMeshEditor } from './components/editors/SkeletalMeshEditor';
import { ContentBrowserPanel } from './components/panels/ContentBrowserPanel';
import { ConsolePanel } from './components/panels/ConsolePanel';
import { EditorPreferences } from './components/panels/EditorPreferences';
import { PluginManager } from './components/panels/PluginManager';
import { ProjectSettings } from './components/modals/ProjectSettings';
import { PlumeLogo } from './components/ui/PlumeLogo';
// COMMANDS import removed as it is now handled by useCommandSystem
import { Entity, LogEntry, ToolType } from './types';
import { useNativeBridge } from './hooks/useNativeBridge';
import { useCommandSystem } from './hooks/useCommandSystem';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';

export default function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();

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
  // Modal states removed
  const [renderingAPI, setRenderingAPI] = useState<'DirectX12' | 'Vulkan' | 'OpenGL' | 'Metal'>('OpenGL');
  const [cameraTransform, setCameraTransform] = useState({ position: { x: 0, y: -50, z: -150 }, rotation: { x: 20, y: 0, z: 0 } });

  // Global Drag State to manage overlays
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  useEffect(() => {
    const handleDragStart = () => setIsDraggingGlobal(true);
    const handleDragEnd = () => setIsDraggingGlobal(false);

    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, []);

  // Tab System State
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('plume_editor_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure scene is always there? Or trust storage. 
        // Let's ensure at least Basic Scene is present if array is empty, though logic below handles that.
        return parsed.length > 0 ? parsed : [{ id: 'scene', title: 'EmptyLevel', type: 'scene', closable: false }];
      } catch (e) {
        console.error("Failed to load tabs", e);
      }
    }
    return [{ id: 'scene', title: 'EmptyLevel', type: 'scene', closable: false }];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return localStorage.getItem('plume_editor_active_tab') || 'scene';
  });


  // Save tabs effect
  useEffect(() => {
    localStorage.setItem('plume_editor_tabs', JSON.stringify(tabs));
  }, [tabs]);

  // Disable Global Zoom (Ctrl + Wheel / Keydown)
  useEffect(() => {
    // 1. Prevent Ctrl + Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Allow propagation so custom zoom handlers work
      }
    };

    // 2. Prevent Ctrl + (+/-) zoom
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Check codes for layout independence
        if (
          e.code === 'NumpadAdd' ||
          e.code === 'NumpadSubtract' ||
          e.code === 'Equal' ||
          e.code === 'Minus' ||
          e.key === '+' ||
          e.key === '-' ||
          e.key === '='
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // 3. Block pinch gestures (Trackpad/Touch)
    // Note: 'gesturestart' is non-standard but works in Safari/some Webkit views. 
    // For standard Chrome/Edge events, they often come as specific wheel/touch events.
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Use non-passive listener to be able to preventDefault effectively
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { capture: true }); // Capture to stop it early
    window.addEventListener('gesturestart', preventDefault);
    window.addEventListener('gesturechange', preventDefault);
    window.addEventListener('gestureend', preventDefault);

    // Also try to block touchmove if it involves multiple touches (pinch)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('gesturestart', preventDefault);
      window.removeEventListener('gesturechange', preventDefault);
      window.removeEventListener('gestureend', preventDefault);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);



  const handleOpenTab = (type: Tab['type'], title: string, data?: any) => {
    // For editors that support multiple instances (like texture viewer), check based on ID/data if possible, 
    // or just allow multiple tabs if handled.
    // However, basic implementation often checks type.
    // If it's a texture, we probably want a specific tab per texture.
    /* SINGLETON TABS */
    const singletonTypes = ['editor-preferences', 'project-settings', 'plugin-manager', 'content-browser', 'console'];

    // Default unique ID generation
    let uniqueId: string = type;

    // For multi-instance types, append title/identifier
    if (!singletonTypes.includes(type)) {
      uniqueId = `${type}-${title}`;
    }

    const existingTab = tabs.find(t => t.id === uniqueId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      setTabs(prev => [...prev, { id: uniqueId, title, type, data, closable: true }]);
      setActiveTabId(uniqueId);
    }
  };

  // Centralized asset opening logic
  const handleOpenAsset = (asset: any) => {
    // Identify Asset Types based on Type property primarily
    const type = asset.type ? asset.type : '';

    let tabType: 'static-mesh' | 'texture' | 'sound' | 'material-editor' | 'animation-sequence' | 'skeleton' | 'physics-asset' | 'skeletal-mesh' | null = null;

    // Prioritize explicit types
    if (type === 'StaticMesh') tabType = 'static-mesh';
    else if (type === 'Texture') tabType = 'texture';
    else if (type === 'SoundWave') tabType = 'sound';
    else if (type === 'Material') tabType = 'material-editor';
    else if (type === 'AnimationSequence') tabType = 'animation-sequence';
    else if (type === 'Skeleton') tabType = 'skeleton';
    else if (type === 'PhysicsAsset') tabType = 'physics-asset';
    else if (type === 'SkeletalMesh') tabType = 'skeletal-mesh';



    if (tabType) {
      const tabId = `${tabType}-${asset.id}`;
      setTabs(prev => {
        if (prev.find(t => t.id === tabId)) return prev;
        // Clean up name if it has an extension (just in case backend sends it)
        const title = asset.name.replace(/\.plumeasset$/i, '');
        return [...prev, {
          id: tabId,
          title: title,
          type: tabType as any,
          // Pass full path if available or ID
          data: typeof asset.path === 'string' ? asset.path : (asset.path || asset.id),
          closable: true
        }];
      });
      setActiveTabId(tabId);
      addLog(`Opened asset: ${asset.name}`, 'INFO');
      // If it's the main browser, close it (optional, logic might differ but acceptable default)
      if (showContentBrowser) setShowContentBrowser(false);
    } else if (asset.type === 'texture' || asset.type === 'image') {
      // Fallback for generic textures if type matching failed above
      handleOpenTab('texture', asset.name, asset.path || asset.id);
      if (showContentBrowser) setShowContentBrowser(false);
    } else {
      addLog(`Cannot open asset type: ${asset.type}`, 'WARN');
    }
  };

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

  // Save active tab effect & Sync Backend State
  useEffect(() => {
    localStorage.setItem('plume_editor_active_tab', activeTabId);

    // Sync Backend State with Active Tab
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      if (activeTab.type === 'static-mesh') {
        const assetPath = activeTab.data?.entityId || 'Unknown';
        // We pass the ID or Name as path for now. 
        // In real asset system, we'd pass the full path or UUID.

        if ((window as any).chrome?.webview) {
          (window as any).chrome.webview.postMessage({ action: 'preview-asset', path: assetPath });
          addLog(`Previewing asset: ${assetPath}`, 'INFO');
        }
      } else {
        // For scene or any other tab, we assume we want the main scene
        // If we had multiple types of 3D editors, we'd need more logic.
        if ((window as any).chrome?.webview) {
          (window as any).chrome.webview.postMessage({ action: 'restore-main-scene' });
        }
      }
    }
  }, [activeTabId, tabs, addLog]);

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

  // Call Custom Hooks
  useNativeBridge({
    setPlugins,
    setShowFPS,
    showFPSRef,
    setVsyncEnabled,
    setMaxFpsCap,
    setRenderingAPI,
    setFpsValue,
    setCameraTransform,
    setEntities,
    addLog
  });

  const { handleExecuteCommand } = useCommandSystem({
    addLog,
    setShowFPS,
    showFPS,
    setVsyncEnabled,
    vsyncEnabled,
    setMaxFpsCap,
    maxFpsCap,
    setLogs,
    setTabs,
    setActiveTabId,
    setCameraTransform,
    t
  });

  // Global Drag & Drop prevention (stop WebView from opening files)
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'none';
    };
    const showDropEffect = (e: DragEvent) => {
      // We allow the drop effect to be handled by specific components (like ContentBrowser) 
      // effectively, but we prevent the default browser behavior of navigating.
      e.preventDefault();
    };

    // We bind to window to catch everything. 
    // Components that *want* the drop (like ContentBrowser) will handle it in their own listeners 
    // and stopPropagation(), or we just rely on preventDefault here to stop navigation.
    window.addEventListener('dragover', showDropEffect, false);
    window.addEventListener('drop', showDropEffect, false);

    return () => {
      window.removeEventListener('dragover', showDropEffect);
      window.removeEventListener('drop', showDropEffect);
    };
  }, []);



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
        // Prevent camera movement if not in scene tab
        const currentActiveTab = tabs.find(t => t.id === activeTabId);
        if (currentActiveTab && currentActiveTab.type === 'scene') {
          setCameraTransform(prev => ({
            ...prev,
            position: {
              ...prev.position,
              z: prev.position.z + (cameraUpdates.z || 0)
            }
          }));
        }
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
  }, [isPlaying, activeTabId, tabs]);

  useEffect(() => { requestRef.current = requestAnimationFrame(animate); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [animate]);

  // Manage Global Rendering State based on active tab
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    const shouldRender = activeTab ? (activeTab.type === 'scene' || activeTab.type === 'static-mesh') : false;

    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({
        action: 'set-rendering-enabled',
        enabled: shouldRender
      });
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTyping = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping && !(e.ctrlKey || e.altKey || e.metaKey) && e.key !== 'Escape') {
        return;
      }

      keysPressed.current[e.code] = true;

      if (e.key === 'Escape') {
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
  }, [showContentBrowser]);

  const handleTabClose = (id: string) => {
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleTabReorder = (fromIndex: number, toIndex: number) => {
    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    setTabs(newTabs);
  };

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden font-sans select-none"
      style={{
        backgroundColor: 'transparent',
        color: theme.colors.text.primary
      }}
    >
      <Header
        isPlaying={isPlaying}
        onSave={() => { }}
        onAbout={() => setShowAboutModal(true)}
        onPreferences={() => handleOpenTab('editor-preferences', t('app.tab.preferences'))}
        onPlugins={() => handleOpenTab('plugin-manager', t('app.tab.plugins'))}
        onProjectSettings={() => handleOpenTab('project-settings', t('app.tab.project_settings'))}
      />

      {/* Tab System Area */}
      <TabSystem
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={handleTabClose}
        onReorder={handleTabReorder}
      >
        {/* Children unused in this prop pattern, we render content below */}
      </TabSystem>

      {/* Main Content Area - switching based on active tab */}
      <div className="flex-1 flex overflow-hidden relative" style={{ backgroundColor: 'transparent' }}>
        {tabs.map(tab => {
          // We can either mount/unmount or hide/show. For 3D contexts, preserving the DOM (hide/show) is often better to avoid re-initializing WebGL contexts if they are attached to the DOM.
          // However, our SceneEditor passes state down. If we unmount, state in App is preserved, but SceneEditor internal state (if any) resets.
          // Let's use display: none for now to support quick switching.
          const isTabActive = tab.id === activeTabId;
          // Inputs should only be active if the tab is selected AND no overlays (ContentBrowser/Console) are covering it
          const isActive = isTabActive && !showContentBrowser && !showConsole;

          return (
            <div key={tab.id} className="w-full h-full absolute inset-0" style={{ display: isTabActive ? 'block' : 'none' }}>
              {tab.type === 'scene' && (
                <SceneEditor
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  onSave={() => { }}
                  onDelete={() => {
                    if (selectedId) {
                      setEntities(entities.filter(e => e.id !== selectedId));
                      setSelectedId(null);
                    }
                  }}
                  isPlaying={isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onStop={() => setIsPlaying(false)}
                  entities={entities}
                  setEntities={setEntities}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  cameraTransform={cameraTransform}
                  setCameraTransform={setCameraTransform}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onAddEntity={(type) => setEntities([...entities, { id: Date.now().toString(), name: type, type, visible: true, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } }])}
                  onDuplicate={(ent) => {
                    const newEntity = { ...ent, id: Date.now().toString(), name: `${ent.name}_Copy` };
                    setEntities([...entities, newEntity]);
                  }}
                  onDeleteEntity={(id) => {
                    setEntities(entities.filter(e => e.id !== id));
                    if (selectedId === id) setSelectedId(null);
                  }}
                  controlsEnabled={!showContentBrowser && !showConsole && isActive}
                />
              )}
              {tab.type === 'static-mesh' && (
                <StaticMeshEditor
                  entityId={tab.data?.entityId || 'Unknown'}
                  onClose={() => handleTabClose(tab.id)}
                  isActive={isActive}
                />
              )}
              {tab.type === 'texture' && (
                <TextureViewer assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')} name={tab.title} />
              )}
              {tab.type === 'material-editor' && (
                <MaterialEditor
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  onDirtyChange={(dirty) => setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isDirty: dirty } : t))}
                />
              )}
              {tab.type === 'sound' && (
                <SoundViewer
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  isActive={isActive}
                />
              )}
              {tab.type === 'animation-sequence' && (
                <AnimationEditor
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  isActive={isActive}
                />
              )}
              {tab.type === 'skeleton' && (
                <SkeletonEditor
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  isActive={isActive}
                />
              )}
              {tab.type === 'physics-asset' && (
                <PhysicsAssetEditor
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  isActive={isActive}
                />
              )}
              {tab.type === 'skeletal-mesh' && (
                <SkeletalMeshEditor
                  assetId={typeof tab.data === 'string' ? tab.data : (tab.data?.entityId || tab.data?.assetId || '')}
                  name={tab.title}
                  isActive={isActive}
                />
              )}
              {tab.type === 'editor-preferences' && (
                <EditorPreferences
                  isOpen={true} // Ignored by component
                  onClose={() => handleTabClose(tab.id)}
                />
              )}
              {tab.type === 'project-settings' && (
                <ProjectSettings
                  isOpen={true} // Ignored by component
                  onClose={() => handleTabClose(tab.id)}
                />
              )}
              {tab.type === 'plugin-manager' && (
                <PluginManager
                  isOpen={true}
                  onClose={() => handleTabClose(tab.id)}
                  plugins={plugins}
                  onTogglePlugin={(id, enabled) => {
                    if ((window as any).chrome?.webview) {
                      (window as any).chrome.webview.postMessage({ action: 'toggle-plugin', id, enabled });
                      // Optimistic update
                      setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
                    }
                  }}
                />
              )}
              {tab.type === 'content-browser' && (
                <ContentBrowserPanel
                  show={isTabActive}
                  isDocked={true}
                  onClose={() => handleTabClose(tab.id)}
                  onLog={addLog}
                  onOpenAsset={handleOpenAsset}
                />
              )}
              {tab.type === 'console' && (
                <ConsolePanel
                  logs={logs}
                  onClear={() => setLogs([])}
                  onExecuteCommand={handleExecuteCommand}
                  isOpen={true}
                  setIsOpen={() => handleTabClose(tab.id)}
                  isDocked={true}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Backdrop for Panels */}
      {(showContentBrowser || showConsole) && (
        <div
          className={`fixed inset-0 z-40 bg-transparent ${isDraggingGlobal ? 'pointer-events-none' : ''}`}
          onClick={() => {
            setShowContentBrowser(false);
            setShowConsole(false);
          }}
        />
      )}

      <ContentBrowserPanel
        show={showContentBrowser}
        onClose={() => setShowContentBrowser(false)}
        onDock={() => {
          const newTabId = `content-browser-${Date.now()}`;
          setTabs(prev => [...prev, { id: newTabId, title: t('browser.title'), type: 'content-browser', closable: true }]);
          setActiveTabId(newTabId);
          setShowContentBrowser(false);
        }}
        onLog={addLog}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAsset={handleOpenAsset}
      />
      <ConsolePanel
        logs={logs}
        onClear={() => setLogs([])}
        onExecuteCommand={(cmd) => handleExecuteCommand(cmd)}
        isOpen={showConsole}
        setIsOpen={setShowConsole}
        onDock={() => {
          const existing = tabs.find(t => t.type === 'console');
          if (existing) {
            setActiveTabId(existing.id);
          } else {
            const newTabId = `console-${Date.now()}`;
            setTabs(prev => [...prev, { id: newTabId, title: t('console.title'), type: 'console', closable: true }]);
            setActiveTabId(newTabId);
          }
          setShowConsole(false);
        }}
      />

      {/* Footer / Status Bar - Persistent */}
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
            {t('footer.content_browser')}
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <button
            onClick={() => {
              setShowConsole(p => !p);
              setShowContentBrowser(false);
            }}
            className="hover:underline cursor-pointer"
          >
            {t('footer.console')}
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{t('footer.entities').replace('{count}', entities.length.toString())}</span>
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
