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
import { Entity, LogEntry, ToolType } from './types';
import { useTheme } from './ThemeContext';

export default function App() {
  const { theme } = useTheme();
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
  const [cameraTransform, setCameraTransform] = useState({ position: {x:0, y:-50, z:-150}, rotation: {x:20, y:0, z:0} });
  const [viewMode, setViewMode] = useState<'Lit' | 'Unlit' | 'Wireframe'>('Lit');
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

  const addLog = useCallback((msg: string, level: 'INFO' | 'WARN' | 'ERROR') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-99), { id: Date.now(), time, level, msg }]);
  }, []);

  useEffect(() => {
    const loadSceneData = () => {
      const script = document.createElement('script');
      script.src = './scene_data.js'; 
      script.onload = () => {
        const data = (window as any).PLUME_SCENE_DATA;
        if (data) { 
          setEntities(data); 
          if(data.length>0) setSelectedId(data[0].id);
          addLog('Scene loaded successfully', 'INFO');
        }
      };
      script.onerror = () => { 
        setEntities(DEFAULT_SCENE);
        addLog('Failed to load scene, using default', 'WARN');
      };
      document.body.appendChild(script);
    };
    loadSceneData();
    addLog('Plume Engine Editor initialized', 'INFO');
  }, [addLog]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      if (keysPressed.current['KeyW']) setCameraTransform(p => ({...p, position: {...p.position, z: p.position.z + 0.5}}));
      if (keysPressed.current['KeyS']) setCameraTransform(p => ({...p, position: {...p.position, z: p.position.z - 0.5}}));
      if (isPlaying) setEntities(prev => prev.map(ent => (ent.type === 'Mesh' ? {...ent, transform: {...ent.transform, rotation: {...ent.transform.rotation, z: ent.transform.rotation.z + 0.5}}} : ent)));
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);

  useEffect(() => { requestRef.current = requestAnimationFrame(animate); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [animate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      keysPressed.current[e.code] = true; 
      
      // Handle Escape key to close modals and drawers
      if (e.key === 'Escape') {
        // Close modals first (highest priority)
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
        // Close content browser drawer
        if (showContentBrowser) {
          setShowContentBrowser(false);
          return;
        }
      }
      
      if(e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setShowContentBrowser(p => !p);
        setShowConsole(false); // Fermer la console si on ouvre le content browser
      }
      if(e.ctrlKey && e.code === 'KeyI') {
        e.preventDefault();
        setShowConsole(p => !p);
        setShowContentBrowser(false); // Fermer le content browser si on ouvre la console
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
        backgroundColor: theme.colors.bg.primary, 
        color: theme.colors.text.primary 
      }}
    >
      <Header isPlaying={isPlaying} onSave={() => {}} onAbout={() => setShowAboutModal(true)} onPreferences={() => setShowPreferences(true)} onPlugins={() => setShowPluginManager(true)} onProjectSettings={() => setShowProjectSettings(true)} />
      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} onSave={() => {}} onDelete={() => {}} isPlaying={isPlaying} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onStop={() => setIsPlaying(false)} />
      <div className="flex-1 flex overflow-hidden">
        <Viewport entities={entities} selectedId={selectedId} setSelectedId={setSelectedId} cameraTransform={cameraTransform} setCameraTransform={setCameraTransform} activeTool={activeTool} viewMode={viewMode} setViewMode={setViewMode} onAddEntity={(type) => setEntities([...entities, {id: Date.now().toString(), name: type, type, visible: true, transform: {position:{x:0,y:0,z:0}, rotation:{x:0,y:0,z:0}, scale:{x:1,y:1,z:1}}}])} />
        <div 
          className="w-80 flex flex-col shrink-0 border-l"
          style={{ 
            backgroundColor: theme.colors.bg.secondary, 
            borderColor: theme.colors.border.default 
          }}
        >
          <OutlinerPanel entities={entities} selectedId={selectedId} setSelectedId={setSelectedId} onAddEntity={()=>{}} setEntities={setEntities} onDuplicate={()=>{}} onDelete={()=>{}} />
          <DetailsPanel selectedEntity={selectedEntity} setEntities={setEntities} />
        </div>
      </div>
      <ContentBrowserPanel show={showContentBrowser} onClose={() => setShowContentBrowser(false)} onLog={addLog} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <ConsolePanel 
        logs={logs} 
        onClear={() => setLogs([])} 
        onExecuteCommand={(cmd) => addLog(`> ${cmd}`, 'INFO')}
        isOpen={showConsole}
        setIsOpen={setShowConsole}
      />
      <EditorPreferences isOpen={showPreferences} onClose={() => setShowPreferences(false)} />
      <PluginManager isOpen={showPluginManager} onClose={() => setShowPluginManager(false)} />
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
              setShowConsole(false); // Fermer la console
            }}
            className="hover:underline cursor-pointer"
          >
            Content Browser (Ctrl+Space)
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <button 
            onClick={() => {
              setShowConsole(p => !p);
              setShowContentBrowser(false); // Fermer le content browser
            }}
            className="hover:underline cursor-pointer"
          >
            Console (Ctrl+I)
          </button>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{entities.length} entities</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: theme.colors.accent.primary }}>Plume Engine v0.1 Alpha</span>
          <span style={{ color: theme.colors.border.default }}>|</span>
          <span>{theme.displayName}</span>

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
            <PlumeLogo/>
            <h2 className="text-2xl font-light mt-4" style={{ color: theme.colors.text.primary }}>Plume Engine</h2>
            <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>Version 0.1 Alpha</p>
            <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>Created by Noa Second</p>
            <p className="text-xs mt-4" style={{ color: theme.colors.text.muted }}>Thème actuel: {theme.displayName}</p>
            <button 
              onClick={handleAboutClose}
              className="mt-4 px-4 py-2 rounded"
              style={{ 
                backgroundColor: theme.colors.accent.primary, 
                color: theme.colors.text.primary 
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
