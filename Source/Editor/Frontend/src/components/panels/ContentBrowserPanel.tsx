import React, { useRef, useEffect, useState } from 'react';
import { Search, X, AppWindow, Minus, Plus, Upload, ChevronRight } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Toast } from '../ui/Toast';
import { SimpleModal } from '../ui/SimpleModal';
import ColorPicker from '../ui/ColorPicker';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { useContentBrowser } from '../../hooks/useContentBrowser';
import { FolderTree } from './content/FolderTree';
import { AssetGrid } from './content/AssetGrid';

interface ContentBrowserProps {
  show: boolean;
  onClose: () => void;
  onLog: (msg: string, type: 'WARN' | 'INFO' | 'ERROR') => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenAsset?: (asset: { id: string; name: string; type: string; path?: string }) => void;
  isDocked?: boolean;
  onDock?: () => void;
}

export const ContentBrowserPanel: React.FC<ContentBrowserProps> = ({ show, onClose, onLog, searchQuery: propsSearchQuery, setSearchQuery: propsSetSearchQuery, onOpenAsset, isDocked, onDock }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Use the core business logic hook
  const browser = useContentBrowser(show, onLog);

  // Sync external search query if provided
  useEffect(() => {
    if (propsSearchQuery !== undefined && propsSetSearchQuery) {
      if (propsSearchQuery !== browser.searchQuery) {
        browser.setSearchQuery(propsSearchQuery);
      }
    }
  }, [propsSearchQuery]);

  // Handle sync back to props
  const handleSearchChange = (val: string) => {
    browser.setSearchQuery(val);
    if (propsSetSearchQuery) propsSetSearchQuery(val);
  };

  // UI State (View-specific)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Context Menu
  const [ctxVisible, setCtxVisible] = useState(false);
  const [ctxX, setCtxX] = useState(0);
  const [ctxY, setCtxY] = useState(0);
  const [ctxType, setCtxType] = useState<'empty' | 'asset' | 'folder' | null>(null);
  const [ctxTarget, setCtxTarget] = useState<{ id: string; name: string; type: string; path?: string; meta?: any } | null>(null);

  // Modals & Popups
  const [colorPicker, setColorPicker] = useState<{ open: boolean; x: number; y: number; target?: any; } | null>(null);
  const [toast, setToast] = useState<string | null>(null); // Local toast state if needed, though onLog is preferred
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDefault, setModalDefault] = useState<string>('');
  const [modalAction, setModalAction] = useState<string | null>(null);

  // Layout & Zoom
  const [sidebarWidth, setSidebarWidth] = useState(192);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Search
      if (show && e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Select All
      if (show && e.ctrlKey && e.key.toLowerCase() === 'a') {
        const active = document.activeElement as HTMLElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isInput) return;

        e.preventDefault();
        const allIds = browser.assets.map(a => a.id);
        browser.setSelectedIds(new Set(allIds));
        if (allIds.length > 0) browser.setLastSelectedId(allIds[allIds.length - 1]);
      }

      // Operations
      if (show && !modalOpen && !colorPicker) {
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          const selected = browser.assets.filter(a => browser.selectedIds.has(a.id));
          if (selected.length > 0) {
            // Handle multi-select copy if needed, but hook might only take one.
            // Hook copyItem handles list if multiple selected?
            // Checking hook: const itemsToCopy = selectedIds.has(item.id) && selectedIds.size > 1 ...
            // It requires an 'item' argument but uses selectedIds if that item is selected.
            // We can pass the first selected item.
            browser.copyItem(selected[0]);
          }
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'v') {
          e.preventDefault();
          browser.pasteClipboard();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          const selected = browser.assets.filter(a => browser.selectedIds.has(a.id));
          if (selected.length > 0) browser.duplicateItem(selected[0]);
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          browser.createFolder();
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          const selected = browser.assets.filter(a => browser.selectedIds.has(a.id));
          if (selected.length > 0) browser.deleteItem(selected[0]);
        }
        if (e.key === 'F2') {
          e.preventDefault();
          const selected = browser.assets.filter(a => browser.selectedIds.has(a.id));
          if (selected.length === 1) browser.renameItem(selected[0]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, browser.assets, browser.selectedIds, browser.clipboard, modalOpen, colorPicker]);

  // Delete Confirmation Enter Key
  useEffect(() => {
    if (!browser.deletePending) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        browser.confirmDeleteNow();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        browser.setDeletePending(null);
      }
    };
    window.addEventListener('keydown', onKey, true); // Capture phase
    return () => window.removeEventListener('keydown', onKey, true);
  }, [browser.deletePending, browser.confirmDeleteNow, browser.setDeletePending]);

  // Sidebar Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      setSidebarWidth(Math.max(100, Math.min(600, e.clientX)));
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = 'default';
    };
    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.0, prev + 0.1));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.1));
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      setZoomLevel(prev => e.deltaY < 0 ? Math.min(2.0, prev + 0.1) : Math.max(0.5, prev - 0.1));
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (show && e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Logic to import files via native bridge
      const filesToImport: any[] = [];
      let hasPaths = false;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fullPath = (file as any).path;
        if (fullPath) {
          filesToImport.push({ path: fullPath, name: file.name });
          hasPaths = true;
        }
      }
      const __webview = (window as any).chrome?.webview;
      if (__webview) {
        if (hasPaths) {
          __webview.postMessage({ action: 'import-files', path: browser.currentPath, files: filesToImport });
          onLog(`Importing ${filesToImport.length} files...`, 'INFO');
        } else {
          if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Content = result.split(',')[1];
              if (base64Content) {
                __webview.postMessage({
                  action: 'import-file-blob',
                  path: browser.currentPath,
                  name: file.name,
                  content: base64Content
                });
                onLog(`Uploading ${file.name}...`, 'INFO');
              }
            };
            reader.readAsDataURL(file);
            if (files.length > 1) onLog("Multi-file import via drop not supported without paths.", "WARN");
          }
        }
      }
    }
  };

  const handleAssetClick = (asset: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey) {
      browser.setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(asset.id)) newSet.delete(asset.id);
        else newSet.add(asset.id);
        return newSet;
      });
      browser.setLastSelectedId(asset.id);
    } else if (e.shiftKey && browser.lastSelectedId) {
      const startIdx = browser.assets.findIndex(a => a.id === browser.lastSelectedId);
      const endIdx = browser.assets.findIndex(a => a.id === asset.id);
      if (startIdx !== -1 && endIdx !== -1) {
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        const rangeIds = browser.assets.slice(start, end + 1).map(a => a.id);
        browser.setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } else {
      browser.setSelectedIds(new Set([asset.id]));
      browser.setLastSelectedId(asset.id);
    }
  };

  const handleAssetDoubleClick = (asset: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.type === 'folder') {
      browser.openFolder(asset);
    } else {
      const cleanPath = asset.path || asset.name;
      let finalPath = cleanPath;
      if (!cleanPath.includes('/') && !cleanPath.includes('\\')) {
        const sep = (browser.currentPath.endsWith('/') || browser.currentPath.endsWith('\\')) ? '' : '/';
        finalPath = `${browser.currentPath}${sep}${cleanPath}`;
      }
      if (onOpenAsset) onOpenAsset({ ...asset, path: finalPath });
    }
  };

  const handleAssetContextMenu = (e: React.MouseEvent, asset: any, info: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!browser.selectedIds.has(asset.id)) {
      browser.setSelectedIds(new Set([asset.id]));
      browser.setLastSelectedId(asset.id);
    }
    setCtxX(e.clientX);
    setCtxY(e.clientY);
    setCtxType(asset.type === 'folder' ? 'folder' : 'asset');
    setCtxTarget(asset);
    setCtxVisible(true);
  };

  const handleModalSubmit = (value: string) => {
    setModalOpen(false);
    if (!modalAction) return;
    try {
      const meta = JSON.parse(modalAction);
      if (meta.action === 'change-color') {
        onLog(`Changed color -> #${value}`, 'INFO');
        const __webview = (window as any).chrome?.webview;
        if (__webview) {
          __webview.postMessage({ action: 'change-color', id: meta.id, path: meta.path, color: `#${value}` });
          __webview.postMessage({ action: 'list-content', path: 'Content' });
        }
      }
    } catch (e) {
      console.warn("Failed to parse modal action:", e);
    }
    setModalAction(null);
  };

  // Close context menu on click
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) setCtxVisible(false);
  };

  // Helper to get initial color safely
  const getInitialColor = () => {
    if (!colorPicker?.target?.meta?.color) return '#ffffff';
    const c = colorPicker.target.meta.color;
    return c.startsWith('#') ? c : '#' + c;
  };

  return (
    <div
      className={`flex flex-col ${isDocked ? 'w-full h-full' : 'fixed left-0 right-0 shadow-2xl transition-transform duration-300 ease-out'}`}
      onMouseDown={handleContainerMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: theme.colors.bg.primary,
        borderTop: isDocked ? 'none' : `1px solid ${theme.colors.accent.primary}`,
        height: isDocked ? '100%' : '35vh',
        bottom: isDocked ? undefined : '24px',
        zIndex: isDocked ? 'auto' : 40,
        transform: isDocked ? 'none' : (show ? 'translateY(0)' : 'translateY(100%)'),
        pointerEvents: show ? 'auto' : 'none',
        position: isDocked ? 'static' : 'fixed'
      }}
    >
      {/* Header Bar */}
      <div className="h-10 flex items-center justify-between px-4 shrink-0" style={{ backgroundColor: theme.colors.bg.secondary, borderBottom: `1px solid ${theme.colors.border.default}` }}>
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm" style={{ color: theme.colors.text.primary }}>{t('browser.title')}</span>

          {/* Navigation Buttons */}
          <div className="flex space-x-1 ml-4" style={{ color: theme.colors.text.secondary }}>
            <button
              className="hover:bg-opacity-20 hover:bg-white rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!browser.currentPath || browser.currentPath === 'Content'}
              onClick={() => {
                const parts = browser.currentPath.split('/');
                if (parts.length > 1) {
                  const parentPath = parts.slice(0, -1).join('/');
                  browser.setCurrentPath(parentPath || 'Content');
                  const __webview = (window as any).chrome?.webview;
                  if (__webview) __webview.postMessage({ action: 'list-content', path: parentPath || 'Content' });
                }
              }}
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button className="hover:bg-opacity-20 hover:bg-white rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={true}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Search Bar */}
          <div
            className="ml-2 flex items-center rounded px-2 py-0.5 w-64 border transition-colors"
            style={{ backgroundColor: theme.colors.bg.primary, borderColor: theme.colors.border.default }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
            onBlurCapture={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
          >
            <Search size={12} className="mr-2" style={{ color: theme.colors.text.muted }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('browser.search_placeholder')}
              className="bg-transparent border-none outline-none text-xs w-full"
              style={{ color: theme.colors.text.primary }}
              value={browser.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isDocked && onDock && (
            <button
              className="text-xs px-2 py-1 rounded font-medium shadow-sm transition-colors flex items-center gap-1"
              style={{ backgroundColor: theme.colors.bg.elevated, color: theme.colors.text.primary, border: `1px solid ${theme.colors.border.default}` }}
              onClick={onDock}
            >
              <AppWindow size={14} />{t('browser.docker')}
            </button>
          )}
          {/* Zoom Controls */}
          <div className="flex items-center mx-2 bg-black/20 rounded p-0.5">
            <button className="p-1 hover:bg-white/10 rounded" onClick={handleZoomOut}><Minus size={12} style={{ color: theme.colors.text.secondary }} /></button>
            <span className="text-[10px] mx-1 w-8 text-center" style={{ color: theme.colors.text.muted }}>{Math.round(zoomLevel * 100)}%</span>
            <button className="p-1 hover:bg-white/10 rounded" onClick={handleZoomIn}><Plus size={12} style={{ color: theme.colors.text.secondary }} /></button>
          </div>

          <button
            className="text-xs px-3 py-1 rounded font-medium shadow-sm transition-colors flex items-center gap-1"
            style={{ backgroundColor: theme.colors.accent.primary, color: theme.colors.text.primary }}
            onClick={browser.handleImport}
          >
            <Upload size={14} />{t('browser.import')}
          </button>
          <button
            className="p-1 rounded ml-2 transition-colors"
            style={{ color: theme.colors.text.secondary }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Tree) */}
        <div className="p-2 overflow-y-auto flex-shrink-0" style={{ backgroundColor: theme.colors.bg.elevated, borderRight: `1px solid ${theme.colors.border.default}`, width: `${sidebarWidth}px` }}>
          <FolderTree
            nodes={browser.folderTree && browser.folderTree.length ? browser.folderTree : browser.assets}
            currentPath={browser.currentPath}
            expandedIds={browser.expandedIds}
            toggleExpand={browser.toggleExpand}
            setCurrentPath={browser.setCurrentPath}
            setSelectedIds={browser.setSelectedIds}
            setLastSelectedId={browser.setLastSelectedId}
            openFolder={browser.openFolder}
            onOpenAsset={onOpenAsset}
            setCtxX={setCtxX}
            setCtxY={setCtxY}
            setCtxType={setCtxType}
            setCtxTarget={setCtxTarget}
            setCtxVisible={setCtxVisible}
          />
        </div>

        {/* Resize Sidebar Handle */}
        <div
          className="w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
          style={{ backgroundColor: isResizingSidebar ? theme.colors.accent.primary : 'transparent' }}
          onMouseDown={(e) => { e.preventDefault(); setIsResizingSidebar(true); }}
        />

        {/* Assets Grid */}
        <div
          ref={contentAreaRef}
          onWheel={handleWheel}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('asset-grid-container')) {
              browser.setSelectedIds(new Set());
              browser.setLastSelectedId(null);
            }
          }}
          className="flex-1 p-2 overflow-y-auto relative asset-grid-container"
          style={{ backgroundColor: theme.colors.bg.secondary }}
          onContextMenu={(e) => {
            e.preventDefault();
            setCtxX(e.clientX);
            setCtxY(e.clientY);
            setCtxType('empty');
            setCtxTarget(null);
            setCtxVisible(true);
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 border-2 border-dashed rounded flex items-center justify-center pointer-events-none" style={{ borderColor: theme.colors.accent.primary, backgroundColor: theme.colors.accent.primary + '20' }}>
              <div style={{ color: theme.colors.text.primary }} className="text-center">
                <Upload size={32} className="mx-auto mb-2" />
                <div className="text-sm font-medium">{t('browser.drop_files')}</div>
              </div>
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="mb-2 text-xs" style={{ color: theme.colors.text.muted }}>
            {(() => {
              const parts = (browser.currentPath || 'Content').replace(/\\\\/g, '/').split(/[\\/]+/).filter(Boolean);
              if (parts.length === 0 || parts[0] !== 'Content') parts.unshift('Content');
              return parts.map((p, idx) => {
                const path = parts.slice(0, idx + 1).join('/');
                return (
                  <span key={idx} style={{ cursor: 'pointer', color: theme.colors.text.secondary }} onClick={() => {
                    const target = idx === 0 ? 'Content' : path;
                    browser.setCurrentPath(target);
                    const __webview = (window as any).chrome?.webview;
                    if (__webview) __webview.postMessage({ action: 'list-content', path: target });
                  }}>
                    {idx > 0 && <span style={{ margin: '0 6px' }}>{'/'}</span>}
                    <strong style={{ color: browser.currentPath === path ? theme.colors.text.primary : undefined }}>{p}</strong>
                  </span>
                );
              });
            })()}
          </div>

          {/* Grid */}
          <AssetGrid
            assets={browser.assets}
            searchQuery={browser.searchQuery}
            zoomLevel={zoomLevel}
            selectedIds={browser.selectedIds}
            lastSelectedId={browser.lastSelectedId}
            editingId={browser.editingId}
            editingValue={browser.editingValue}
            setEditingValue={browser.setEditingValue}
            setEditingId={browser.setEditingId}
            commitRename={browser.commitRename}
            setAssets={browser.setAssets}
            setSelectedIds={browser.setSelectedIds}
            setLastSelectedId={browser.setLastSelectedId}
            handleAssetClick={handleAssetClick}
            handleAssetDoubleClick={handleAssetDoubleClick}
            handleAssetContextMenu={handleAssetContextMenu}
          />

          {/* Context Menu */}
          {ctxVisible && ctxType && (
            <ContextMenu
              x={ctxX}
              y={ctxY}
              direction="up"
              items={(ctxType === 'empty' ? [
                { id: 'create_folder', label: t('browser.context.create_folder'), shortcut: 'Ctrl+N' },
                { id: 'open_in_explorer', label: t('browser.context.open_explorer') },
                { id: 'paste', label: t('browser.context.paste'), disabled: browser.clipboard == null, shortcut: 'Ctrl+V' },
                { id: 'import', label: t('browser.context.import') },
                { id: 'sep1', type: 'separator' },
                { id: 'create_material', label: t('browser.context.create_material') },
                { id: 'create_level', label: t('browser.context.create_level') }
              ] : ctxType === 'folder' ? [
                { id: 'change_color', label: t('browser.context.change_color') },
                { id: 'rename', label: t('browser.context.rename'), shortcut: 'F2' },
                { id: 'delete', label: t('browser.context.delete'), shortcut: 'Del' },
                { id: 'duplicate', label: t('browser.context.duplicate'), shortcut: 'Ctrl+D' },
                { id: 'copy', label: t('browser.context.copy'), shortcut: 'Ctrl+C' }
              ] : [
                { id: 'delete', label: t('browser.context.delete'), shortcut: 'Del' },
                { id: 'rename', label: t('browser.context.rename'), shortcut: 'F2' },
                { id: 'duplicate', label: t('browser.context.duplicate'), shortcut: 'Ctrl+D' },
                { id: 'copy', label: t('browser.context.copy'), shortcut: 'Ctrl+C' }
              ]) as ContextMenuItem[]}
              onSelect={(id) => {
                if (id === 'create_folder') browser.createFolder();
                else if (id === 'paste') browser.pasteClipboard();
                else if (id === 'open_in_explorer') browser.openInExplorer(ctxTarget ?? undefined);
                else if (id === 'import') browser.handleImport();
                else if (id === 'rename' && ctxTarget) browser.renameItem(ctxTarget as any);
                else if (id === 'delete' && ctxTarget) browser.deleteItem(ctxTarget as any);
                else if (id === 'duplicate' && ctxTarget) browser.duplicateItem(ctxTarget as any);
                else if (id === 'copy' && ctxTarget) browser.copyItem(ctxTarget as any);
                else if (id === 'change_color' && ctxTarget) setColorPicker({ open: true, x: ctxX, y: ctxY, target: ctxTarget });
                else if (id === 'create_material') browser.createAsset('M_NewMaterial', 'Material');
                else if (id === 'create_level') browser.createAsset('L_NewLevel', 'Level');

                const payload = { action: id, target: ctxTarget };
                document.dispatchEvent(new CustomEvent('contentBrowserAction', { detail: payload }));
                onLog(`Context action: ${id}${ctxTarget ? ` on ${ctxTarget.name}` : ''}`, 'INFO');
                setCtxVisible(false);
              }}
              onClose={() => setCtxVisible(false)}
            />
          )}
        </div>

        {/* Confirmation & Modals */}
        {browser.deletePending && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 60 }}>
            <div className="flex items-center space-x-2 p-3 rounded shadow" style={{ backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}` }}>
              <div className="text-sm" style={{ color: theme.colors.text.primary }}>{t('browser.delete_confirm').replace('{name}', browser.deletePending.name)}</div>
              <button
                className="px-3 py-1 rounded text-sm"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
                onClick={browser.confirmDeleteNow}
              >
                {t('browser.delete')} <span className="opacity-75 text-xs ml-1">(Enter)</span>
              </button>
              <button
                className="px-3 py-1 rounded text-sm"
                style={{ backgroundColor: theme.colors.bg.elevated, color: theme.colors.text.primary }}
                onClick={() => browser.setDeletePending(null)}
              >
                {t('browser.cancel')} <span className="opacity-75 text-xs ml-1">(Esc)</span>
              </button>
            </div>
          </div>
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        <SimpleModal
          title={modalTitle}
          defaultValue={modalDefault}
          open={modalOpen}
          placeholder={''}
          onCancel={() => { setModalOpen(false); setModalAction(null); }}
          onSubmit={handleModalSubmit}
        />

        {colorPicker && colorPicker.open && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
            <ColorPicker
              initial={getInitialColor()}
              onPick={(hex) => {
                const targetPath = (colorPicker.target as any).path;
                // Update Browser hook folderTree if needed (recursive update)
                // Note: useContentBrowser doesn't expose a reducer for this directly, but we can iterate. 
                // Or better, we just send msg to backend and wait for refresh.
                // To be instant, we should update local state.

                // Re-implementing simplified local update helper
                const updateNodeColor = (nodes: any[], tPath: string, clr: string): any[] => {
                  return nodes.map(node => {
                    if (node.path === tPath) return { ...node, meta: { ...node.meta, color: clr } };
                    if (node.children && node.children.length > 0) return { ...node, children: updateNodeColor(node.children, tPath, clr) };
                    return node;
                  });
                };

                browser.setFolderTree(prev => updateNodeColor(prev, targetPath, hex));
                browser.setAssets(prev => prev.map(asset => asset.path === targetPath ? { ...asset, meta: { ...asset.meta, color: hex } } : asset));

                const __webview = (window as any).chrome?.webview;
                if (__webview) {
                  __webview.postMessage({ action: 'change-color', path: targetPath, color: hex });
                  __webview.postMessage({ action: 'list-content', path: browser.currentPath });
                }
                setColorPicker(null);
              }}
              onCancel={() => setColorPicker(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
