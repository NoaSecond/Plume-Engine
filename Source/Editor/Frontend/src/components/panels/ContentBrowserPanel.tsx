import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, Search, Folder, X, ChevronDown } from 'lucide-react';
import { AssetTile } from '../ui/Shared';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { useTheme } from '../../ThemeContext';
interface ContentBrowserProps { show: boolean; onClose: () => void; onLog: (msg: string, type: 'WARN' | 'INFO' | 'ERROR') => void; searchQuery: string; setSearchQuery: (q: string) => void; }
export const ContentBrowserPanel: React.FC<ContentBrowserProps> = ({ show, onClose, onLog, searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [ctxVisible, setCtxVisible] = useState(false);
  const [ctxX, setCtxX] = useState(0);
  const [ctxY, setCtxY] = useState(0);
  const [ctxType, setCtxType] = useState<'empty'|'asset'|'folder'|null>(null);
  const [ctxTarget, setCtxTarget] = useState<{id:string,name:string,type:string}|null>(null);
  const [assets, setAssets] = useState<Array<{id:string,name:string,type:string}>>([
    { id: 'maps', name: 'Maps', type: 'folder' },
    { id: 'scripts', name: 'Scripts', type: 'folder' }
  ]);
  const [clipboard, setClipboard] = useState<{id:string,name:string,type:string}|null>(null);
  useEffect(() => { if (show && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 50); }, [show]);
  
  const createFolder = (name?: string) => {
    const folderName = name ?? window.prompt('Folder name', 'New Folder') ?? 'New Folder';
    const id = `${folderName.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_${Date.now()}`;
    const item = { id, name: folderName, type: 'folder' };
    setAssets(prev => [item, ...prev]);
    onLog(`Created folder ${folderName}`, 'INFO');
    // Inform backend
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'create-folder', name: folderName });
  };

  const renameItem = (item: {id:string,name:string,type:string}) => {
    const newName = window.prompt('Rename item', item.name);
    if (!newName || newName === item.name) return;
    setAssets(prev => prev.map(a => a.id === item.id ? { ...a, name: newName } : a));
    onLog(`Renamed ${item.name} -> ${newName}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'rename', id: item.id, name: newName });
  };

  const deleteItem = (item: {id:string,name:string,type:string}) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setAssets(prev => prev.filter(a => a.id !== item.id));
    onLog(`Deleted ${item.name}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'delete', id: item.id });
  };

  const duplicateItem = (item: {id:string,name:string,type:string}) => {
    const newName = `${item.name}_copy`;
    const id = `${item.id}_copy_${Date.now()}`;
    const copy = { id, name: newName, type: item.type };
    setAssets(prev => [copy, ...prev]);
    onLog(`Duplicated ${item.name} -> ${newName}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'duplicate', id: item.id, newId: id });
  };

  const copyItem = (item: {id:string,name:string,type:string}) => {
    setClipboard(item);
    onLog(`Copied ${item.name} to clipboard`, 'INFO');
    // Inform backend clipboard if needed
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'copy', id: item.id });
  };

  const pasteClipboard = () => {
    if (!clipboard) return;
    const id = `${clipboard.id}_paste_${Date.now()}`;
    const pasted = { id, name: `${clipboard.name}_pasted`, type: clipboard.type };
    setAssets(prev => [pasted, ...prev]);
    onLog(`Pasted ${clipboard.name}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'paste', id: clipboard.id });
  };

  const openInExplorer = (item?: {id:string,name:string,type:string}) => {
    onLog(`Open in Explorer${item ? ' : ' + item.name : ''}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'open-in-explorer', name: item ? item.name : undefined });
  };
  
  return (
    <div 
      className="fixed left-0 right-0 shadow-2xl transition-transform duration-300 ease-out flex flex-col"
      onMouseDown={(e) => {
        // Close context menu on left-click only (button 0). Ignore right-clicks (button 2)
        if ((e as React.MouseEvent).button === 0) setCtxVisible(false);
      }}
      style={{ 
        backgroundColor: theme.colors.bg.primary,
        borderTop: `1px solid ${theme.colors.accent.primary}`,
        height: '35vh', 
        bottom: '24px', 
        zIndex: 40,
        transform: show ? 'translateY(0)' : 'translateY(calc(100% + 24px))', 
        pointerEvents: show ? 'auto' : 'none',
        willChange: 'transform'
      }}
    >
      <div 
        className="h-10 flex items-center justify-between px-4 shrink-0"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.border.default}`
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm" style={{ color: theme.colors.text.primary }}>
            Content Browser
          </span>
          <div className="flex space-x-1 ml-4" style={{ color: theme.colors.text.secondary }}>
            <ChevronRight size={16} className="rotate-180"/>
            <ChevronRight size={16}/>
          </div>
          <div 
            className="ml-2 flex items-center rounded px-2 py-0.5 w-64 border transition-colors"
            style={{
              backgroundColor: theme.colors.bg.primary,
              borderColor: theme.colors.border.default
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border.default;
            }}
          >
            <Search size={12} className="mr-2" style={{ color: theme.colors.text.muted }}/>
            <input 
              ref={searchInputRef} 
              type="text" 
              placeholder="Filter assets..." 
              className="bg-transparent border-none outline-none text-xs w-full" 
              style={{ color: theme.colors.text.primary }}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="text-xs px-3 py-1 rounded font-medium shadow-sm transition-colors"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: theme.colors.text.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.primary;
            }}
            onClick={() => onLog("Import not implemented", "WARN")}
          >
            Import
          </button>
          <button 
            className="p-1 rounded ml-2 transition-colors"
            style={{ color: theme.colors.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
              e.currentTarget.style.color = theme.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.text.secondary;
            }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
         <div 
           className="w-48 p-2 overflow-y-auto"
           style={{
             backgroundColor: theme.colors.bg.elevated,
             borderRight: `1px solid ${theme.colors.border.default}`
           }}
         >
            <div 
              className="text-xs font-bold mb-2 flex items-center"
              style={{ color: theme.colors.text.secondary }}
            >
              <ChevronDown size={12} className="mr-1"/> Root
            </div>
            <div className="pl-4 space-y-1">
              <div 
                className="flex items-center text-xs rounded px-1 py-0.5 cursor-pointer"
                style={{
                  color: theme.colors.accent.primary,
                  backgroundColor: theme.colors.bg.secondary
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtxX(e.clientX);
                  setCtxY(e.clientY);
                  setCtxType('folder');
                  setCtxTarget({ id: 'root_game', name: 'Game', type: 'folder' });
                  setCtxVisible(true);
                }}
              >
                <Folder size={12} className="mr-2 fill-current"/> Game
              </div>
            </div>
         </div>
         <div 
           className="flex-1 p-2 overflow-y-auto"
           style={{ backgroundColor: theme.colors.bg.secondary }}
           onContextMenu={(e) => {
             // Right click on empty area
             e.preventDefault();
            console.log('ContentBrowser: right-click empty at', e.clientX, e.clientY);
            // @ts-ignore
            if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'debug-context', context: 'empty', x: e.clientX, y: e.clientY });
             setCtxX(e.clientX);
             setCtxY(e.clientY);
             setCtxType('empty');
             setCtxTarget(null);
             setCtxVisible(true);
           }}
         >
           <div className="flex flex-wrap gap-2 content-start">
             {assets.map(a => (
               <AssetTile key={a.id} name={a.name} type={a.type} onContextMenu={(_e, info) => {
                console.log('ContentBrowser: right-click asset', info, 'at', _e.clientX, _e.clientY);
                // @ts-ignore
                if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'debug-context', context: 'asset', info, x: _e.clientX, y: _e.clientY });
                setCtxX(_e.clientX);
                setCtxY(_e.clientY);
                setCtxType(info.type === 'folder' ? 'folder' : 'asset');
                setCtxTarget(a);
                setCtxVisible(true);
               }} />
             ))}
           </div>
         </div>
         {ctxVisible && ctxType && (
           <ContextMenu
             x={ctxX}
             y={ctxY}
             items={(ctxType === 'empty' ? [
               { id: 'create_folder', label: 'Create Folder' },
               { id: 'open_in_explorer', label: 'Open In Explorer' },
               { id: 'paste', label: 'Paste', disabled: clipboard == null },
               { id: 'import', label: 'Import' },
               { id: 'create_asset', label: 'Create Asset...' }
             ] : ctxType === 'folder' ? [
               { id: 'change_color', label: 'Change Color' },
               { id: 'rename', label: 'Rename' },
               { id: 'delete', label: 'Delete' },
               { id: 'duplicate', label: 'Duplicate' },
               { id: 'copy', label: 'Copy' }
             ] : [
               { id: 'delete', label: 'Delete' },
               { id: 'rename', label: 'Rename' },
               { id: 'duplicate', label: 'Duplicate' },
               { id: 'copy', label: 'Copy' }
             ]) as ContextMenuItem[]}
            onSelect={(id) => {
               // Handle built-in actions
               if (id === 'create_folder') createFolder();
               else if (id === 'paste') pasteClipboard();
               else if (id === 'open_in_explorer') openInExplorer(ctxTarget ?? undefined);
               else if (id === 'rename' && ctxTarget) renameItem(ctxTarget as any);
               else if (id === 'delete' && ctxTarget) deleteItem(ctxTarget as any);
               else if (id === 'duplicate' && ctxTarget) duplicateItem(ctxTarget as any);
               else if (id === 'copy' && ctxTarget) copyItem(ctxTarget as any);
               else if (id === 'change_color' && ctxTarget) {
                 const color = window.prompt('Hex color (without #)', 'ffffff');
                 if (color) {
                   onLog(`Changed color of ${ctxTarget.name} to #${color}`, 'INFO');
                   // send to backend
                   // @ts-ignore
                   if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'change-color', id: ctxTarget.id, color: `#${color}` });
                 }
               }

               const payload = { action: id, target: ctxTarget };
               document.dispatchEvent(new CustomEvent('contentBrowserAction', { detail: payload }));
               const targetStr = ctxTarget ? ` on ${ctxTarget.name}` : '';
               onLog(`Context action: ${id}${targetStr}`, 'INFO');
               setCtxVisible(false);
             }}
             onClose={() => setCtxVisible(false)}
           />
         )}
      </div>
    </div>
  );
};
