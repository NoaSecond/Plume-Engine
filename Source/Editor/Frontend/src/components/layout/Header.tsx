import React from 'react';
import { MenuBarItem } from '../ui/Shared';
import { PlumeLogo } from '../ui/PlumeLogo';
import { useTheme } from '../../ThemeContext';
import { Minus, Square, X } from 'lucide-react';

interface HeaderProps { 
  isPlaying: boolean; 
  onSave: () => void; 
  onAbout: () => void;
  onPreferences: () => void;
  onPlugins: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isPlaying, onSave, onAbout, onPreferences, onPlugins }) => {
  const { theme } = useTheme();
  
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Permettre le drag uniquement si on clique sur le header (pas sur les boutons)
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }
    
    // Envoyer un message au backend pour commencer le drag
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'start-drag' });
    }
  };
  
  const handleMinimize = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'minimize' });
    }
  };

  const handleMaximize = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'maximize' });
    }
  };

  const handleClose = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'close' });
    }
  };
  
  return (
    <div 
      className="h-8 flex items-center px-2 border-b shrink-0"
      onMouseDown={handleHeaderMouseDown}
      style={{
        backgroundColor: theme.colors.bg.secondary,
        borderColor: theme.colors.border.default
      }}
    >
      <div className="flex items-center mr-6 font-bold tracking-wider select-none">
        <PlumeLogo /> 
        <span style={{ color: theme.colors.text.primary }}>PLUME</span>
        <span className="ml-0.5" style={{ color: theme.colors.accent.primary }}>ENGINE</span>
      </div>
      <div className="flex space-x-1 h-full items-center">
        <MenuBarItem label="File" items={['New Level', 'Open Level', 'Save', 'Save As', 'Import Asset', 'Export Project', 'Exit']} onAction={(a) => a === 'Save' && onSave()} />
        <MenuBarItem label="Edit" items={['Undo', 'Redo', 'Editor Preferences', 'Project Settings']} onAction={(a) => a === 'Editor Preferences' && onPreferences()} />
        <MenuBarItem label="Window" items={['Viewport', 'Outliner', 'Details', 'Content Browser', 'Console']} />
        <MenuBarItem label="Tools" items={['Plugins', 'Build All']} onAction={(a) => a === 'Plugins' && onPlugins()} />
        <MenuBarItem label="Help" items={['Website', 'Documentation', 'Repository', 'About']} onAction={(a) => a === 'About' && onAbout()}/>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="text-xs font-mono" style={{ color: theme.colors.text.muted }}>
          {isPlaying ? (
            <span className="animate-pulse" style={{ color: theme.colors.status.success }}>● RUNNING</span>
          ) : (
            <span>EDITOR MODE</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-slate-600 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            title="Minimize"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-slate-600 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            title="Maximize/Restore"
          >
            <Square size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
