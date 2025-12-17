import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, Search, Folder, X, ChevronDown, File as FileIcon, Upload, Box, Image as ImageIcon, Music, Layers, Globe, Bone, Film, FileCode, AppWindow, Minus, Plus } from 'lucide-react';
import { AssetTile } from '../ui/Shared';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { Toast } from '../ui/Toast';
import { SimpleModal } from '../ui/SimpleModal';
import ColorPicker from '../ui/ColorPicker';
import { useTheme } from '../../ThemeContext';
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
  // Internal state for search if not controlled
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = propsSearchQuery !== undefined ? propsSearchQuery : internalSearchQuery;
  const setSearchQuery = propsSetSearchQuery || setInternalSearchQuery;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [ctxVisible, setCtxVisible] = useState(false);
  const [ctxX, setCtxX] = useState(0);
  const [ctxY, setCtxY] = useState(0);
  const [ctxType, setCtxType] = useState<'empty' | 'asset' | 'folder' | null>(null);
  const [ctxTarget, setCtxTarget] = useState<{
    id: string;
    name: string;
    type: string;
    path?: string;
  } | null>(null);
  const [assets, setAssets] = useState<Array<{
    id: string;
    name: string;
    type: string;
    path?: string;
    meta?: any;
  }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('Content');
  const [folderTree, setFolderTree] = useState<any[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [colorPicker, setColorPicker] = useState<{
    open: boolean;
    x: number;
    y: number;
    target?: any;
  } | null>(null);
  const [clipboard, setClipboard] = useState<{
    id: string;
    name: string;
    type: string;
    path?: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDefault, setModalDefault] = useState<string>('');
  const [modalAction, setModalAction] = useState<string | null>(null);
  // UI State
  const [sidebarWidth, setSidebarWidth] = useState(192); // Default 12rem (48 * 4)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = normal size
  // Inline edit state for newly created items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  // Removed auto-focus on search bar when opening Content Browser
  // Focus will only happen when user presses Ctrl+K

  // Keyboard shortcuts: copy(Ctrl+C), duplicate(Ctrl+D), delete(Delete), rename(F2), paste(Ctrl+V)
  // Normalize a path so it always starts with 'Content' and uses '/'
  const normalizePath = (p: string) => {
    if (!p) return 'Content';
    const s = p.replace(/\\\\/g, '/');
    const idx = s.indexOf('Content');
    if (idx >= 0) return s.slice(idx);
    return s.startsWith('Content') ? s : `Content/${s}`;
  };

  // Find ancestor id chain for a target path inside a tree
  const findAncestorIds = (nodes: any[], targetPath: string, stack: string[] = []): string[] | null => {
    for (const n of nodes) {
      const np = normalizePath(n.path || n.name || 'Content');
      if (np === targetPath) return [...stack, n.id];
      if (n.children && n.children.length) {
        const res = findAncestorIds(n.children, targetPath, [...stack, n.id]);
        if (res) return res;
      }
    }
    return null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const { ctrlKey, key } = e;
      const keyLower = key.toLowerCase();

      // Ctrl+K for search (works when Content Browser is open)
      if (show && ctrlKey && keyLower === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // Ctrl+A to select all
      if (show && ctrlKey && keyLower === 'a') {
        e.preventDefault();
        const allIds = assets.map(a => a.id);
        setSelectedIds(new Set(allIds));
        if (allIds.length > 0) setLastSelectedId(allIds[allIds.length - 1]);
        return;
      }

      if (selectedIds.size === 0) return;

      const firstSelectedId = Array.from(selectedIds)[0];
      const selectedAsset = assets.find(a => a.id === firstSelectedId);
      if (!selectedAsset) return;

      if (ctrlKey && keyLower === 'c') {
        e.preventDefault();
        if (selectedIds.size === 1) copyItem(selectedAsset as any);
      } else if (ctrlKey && keyLower === 'd') {
        e.preventDefault();
        if (selectedIds.size === 1) duplicateItem(selectedAsset as any);
      } else if (keyLower === 'delete') {
        e.preventDefault();
        // Delete all selected items
        selectedIds.forEach(id => {
          const item = assets.find(a => a.id === id);
          if (item) deleteItem(item as any);
        });
      } else if (keyLower === 'f2') {
        e.preventDefault();
        if (selectedIds.size === 1) {
          // Preserve meta when starting rename
          const asset = selectedAsset as any;
          renameItem(asset);
        }
      } else if (ctrlKey && keyLower === 'v') {
        e.preventDefault();
        pasteClipboard();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [assets, selectedIds, clipboard, currentPath, show]);


  // When the panel opens, request the real content list from the native side
  useEffect(() => {
    if (!show) return;

    // We'll attach the listener first, then send list requests with retries
    const messageReceivedRef = { current: false } as { current: boolean };
    let retryTimer: any = null;
    let attempts = 0;
    const handleMessage = (ev: any) => {
      try {
        const data = ev.data;
        if (!data) return;
        // mark that we received at least one message from native
        if (data.type === 'content-list') messageReceivedRef.current = true;
        if (data.type === 'content-list' && Array.isArray(data.items)) {
          const respPath = data.path ? normalizePath(data.path) : 'Content';

          // Helper to normalize nodes
          const normalizeNode = (n: any) => {
            const node = { ...n };
            node.path = normalizePath(node.path || node.name || 'Content');
            if (node.children && Array.isArray(node.children)) {
              node.children = node.children.map((c: any) => {
                const child = { ...c };
                child.path = normalizePath(child.path || child.name || 'Content');
                if (child.children && Array.isArray(child.children)) {
                  child.children = child.children.map((g: any) => ({
                    ...g,
                    path: normalizePath(g.path || g.name || 'Content')
                  }));
                }
                return child;
              });
            }
            return node;
          };

          const nodes = data.items.map((it: any) => normalizeNode(it));

          // Logic to split tree vs assets updates
          const isRecursiveResponse = !!data.recursive;

          if (respPath === 'Content' && isRecursiveResponse) {
            setFolderTree(nodes);
          }

          // Always update assets if the response matches our current view
          const effectiveCurrent = normalizePath(currentPath || 'Content');
          if (respPath === effectiveCurrent) {
            setAssets(nodes.map((it: any) => ({
              id: it.id,
              name: it.name,
              type: it.type,
              path: it.path,
              meta: it.meta
            })));
          }
        }
        if (data.type === 'result') {
          const ok = !!data.success;
          const msg = data.message || (ok ? 'OK' : 'Error');
          // Log to console instead of showing toast
          if (ok) {
            onLog(msg, 'INFO');
            // Refresh content and tree on success to ensure UI is in sync
            const __webview = (window as any).chrome?.webview;
            if (__webview) {
              // Refresh current view
              __webview.postMessage({ action: 'list-content', path: currentPath || 'Content' });
              // Refresh full tree structure (recursive)
              __webview.postMessage({ action: 'list-content', path: 'Content', recursive: true });
            }
          } else {
            onLog(msg, 'ERROR');
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    // Attach listener for WebView2 messages (use any to satisfy TS)
    const webview = (window as any).chrome?.webview;
    if (webview && webview.addEventListener) {
      webview.addEventListener('message', handleMessage);
    } else {
      window.addEventListener('message', handleMessage as EventListener);
    }

    // Retry loop: try posting list-content until we receive a content-list or reach attempts
    const trySend = () => {
      if ((messageReceivedRef as any).current) return;
      if (attempts >= 8) return;
      attempts++;
      const __webview2 = (window as any).chrome?.webview;
      if (__webview2) __webview2.postMessage({ action: 'list-content', path: 'Content', recursive: true });
      retryTimer = setTimeout(trySend, 300);
    };
    // first send immediately after attaching listener
    trySend();

    return () => {
      const webview = (window as any).chrome?.webview;
      if (webview && webview.removeEventListener) {
        webview.removeEventListener('message', handleMessage);
      } else {
        window.removeEventListener('message', handleMessage as EventListener);
      }
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [show, currentPath]);

  // Load content for the current path when it changes or when panel opens with non-root path
  useEffect(() => {
    if (!show) return;

    // Always ensure root is expanded, and expand ancestors if deeper
    setExpandedIds(prev => {
      const next = new Set<string>(); // Start fresh to auto-collapse unused branches
      next.add('root_content');

      if (currentPath && currentPath !== 'Content' && folderTree.length > 0) {
        try {
          const anc = findAncestorIds(folderTree, normalizePath(currentPath));
          if (anc) anc.forEach(id => next.add(id));

          // Also explicitly expand direct parents in tree if they matched
          folderTree.forEach(node => {
            if (currentPath!.startsWith(node.path + '/')) {
              next.add(node.id);
            }
          });
        } catch (e) { }
      }
      return next;
    });

    // Request content load
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      // If expanding root, we likely already requested it via trySend on mount, but harmless to request again
      // unless it causes flicker. previous loop protection prevents tree destruction.
      __webview.postMessage({ action: 'list-content', path: currentPath || 'Content' });
    }
  }, [show, currentPath, folderTree]);

  const createAsset = (defaultName: string, type: string) => {
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      // Create a new asset via blob import
      const assetName = defaultName;
      const jsonContent = JSON.stringify({
        type: type,
        // Default properties based on type
        properties: type === 'Material' ? { color: [1, 1, 1], roughness: 0.5, metallic: 0.0 } : {}
      }, null, 2);

      const base64Content = btoa(jsonContent);

      // Use import-file-blob to create the file
      // We append a timestamp to ensure uniqueness if needed, but import-file-blob handles collisions?
      // Actually import-file-blob might default to overwrite or collision handling.
      // Let's rely on the backend's import logic which we saw handles collisions by renaming.
      // But we want to rename IT properly.

      // Wait, import-file-blob takes a name. Let's send a unique name.
      const uniqueName = `${assetName}_${Date.now()}.plumeasset`;

      __webview.postMessage({
        action: 'import-file-blob',
        path: currentPath,
        name: uniqueName,
        content: base64Content
      });

      onLog(`Creating new ${type}...`, 'INFO');
    }
  };

  const createFolder = (name?: string) => {
    if (name) {
      const folderName = name;
      const id = `${folderName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
      const folderPath = `${currentPath}/${folderName}`.replace(/\/{2,}/g, '/');
      const item = { id, name: folderName, type: 'folder', path: folderPath };
      setAssets(prev => [item, ...prev]);
      onLog(`Created folder ${folderName}`, 'INFO');
      // Inform backend
      const __webview = (window as any).chrome?.webview;
      if (__webview) {
        __webview.postMessage({ action: 'create-folder', name: folderName, path: currentPath });
        // Ask backend to refresh the content listing after the operation
        __webview.postMessage({ action: 'list-content', path: currentPath });
      }
      return;
    }
    // Create a placeholder folder immediately and start inline rename
    const defaultName = 'New Folder';
    const id = `${defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    const folderPath = `${currentPath}/${defaultName}`.replace(/\/{2,}/g, '/');
    const placeholder = { id, name: defaultName, type: 'folder', path: folderPath };
    setAssets(prev => [placeholder, ...prev]);
    setEditingId(id);
    setEditingValue(defaultName);
  };

  const renameItem = (item: { id: string, name: string, type: string, path?: string, meta?: any }) => {
    setEditingId(item.id);

    let startValue = item.name;
    if (item.type !== 'folder') {
      const lastDot = item.name.lastIndexOf('.');
      if (lastDot > 0) { // > 0 to ignore files starting with dot (hidden)
        startValue = item.name.substring(0, lastDot);
      }
    }
    setEditingValue(startValue);

    // Ensure meta is preserved in the assets array during rename
    setAssets(prev => prev.map(a => a.id === item.id ? { ...a, meta: { ...a.meta } } : a));
  };

  const commitRename = (asset: { id: string, name: string, type: string, path?: string, meta?: any }, newValue: string) => {
    let newName = newValue.trim();
    if (!newName) newName = asset.type === 'folder' ? 'New Folder' : 'New Asset';

    // Extension preservation logic
    if (asset.type !== 'folder' && asset.name.includes('.')) {
      const lastDot = asset.name.lastIndexOf('.');
      if (lastDot !== -1) {
        const ext = asset.name.substring(lastDot); // e.g. .png
        // If new name doesn't end with the extension, append it
        if (!newName.toLowerCase().endsWith(ext.toLowerCase())) {
          newName += ext;
        }
      }
    }

    // Update assets and preserve meta
    setAssets(prev => prev.map(it => it.id === asset.id ? { ...it, name: newName, meta: { ...it.meta } } : it));

    // Update folderTree if it's a folder
    if (asset.type === 'folder' && asset.path) {
      const updateFolderName = (nodes: any[], targetPath: string, nName: string): any[] => {
        return nodes.map(node => {
          if (node.path === targetPath) {
            return { ...node, name: nName, meta: { ...node.meta } };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: updateFolderName(node.children, targetPath, nName) };
          }
          return node;
        });
      };
      setFolderTree(prev => updateFolderName(prev, asset.path!, newName));
    }

    setEditingId(null);
    const __webview = (window as any).chrome?.webview;
    if (!asset.path) {
      // placeholder -> create folder under currentPath
      if (__webview) __webview.postMessage({ action: 'create-folder', name: newName, path: currentPath });
    } else {
      // existing item -> rename
      if (__webview) __webview.postMessage({ action: 'rename', path: asset.path, name: newName });
    }
    // request a fresh listing
    if (__webview) __webview.postMessage({ action: 'list-content', path: currentPath });
  };

  const deleteItem = React.useCallback((item: { id: string, name: string, type: string }) => {
    // If the item is part of a multi-selection, delete all selected items
    if (selectedIds.has(item.id) && selectedIds.size > 1) {
      const selectedItems = assets.filter(a => selectedIds.has(a.id));
      const names = selectedItems.map(a => a.name).join(', ');
      setDeletePending({ id: 'multi', name: `${selectedIds.size} items (${names})`, path: 'multi', items: selectedItems });
    } else {
      // Single item delete
      setDeletePending({ id: item.id, name: item.name, path: (item as any).path, items: [item] });
    }
  }, [selectedIds, assets]);

  // state for inline delete confirmation
  const [deletePending, setDeletePending] = useState<{ id: string, name: string, path?: string, items?: any[] } | null>(null);

  const confirmDeleteNow = () => {
    if (!deletePending) return;
    const itemsToDelete = deletePending.items || [];

    if (itemsToDelete.length > 0) {
      // Delete multiple items
      const idsToDelete = itemsToDelete.map(item => item.id);
      setAssets(prev => prev.filter(a => !idsToDelete.includes(a.id)));
      onLog(`Deleted ${itemsToDelete.length} item(s)`, 'INFO');

      const __webview = (window as any).chrome?.webview;
      if (__webview) {
        // Send delete message for each item
        itemsToDelete.forEach(item => {
          __webview.postMessage({ action: 'delete', path: (item as any).path });
        });
        // request refresh after delete
        __webview.postMessage({ action: 'list-content', path: currentPath });
      }

      // Clear selection
      setSelectedIds(new Set());
      setLastSelectedId(null);
    }
    setDeletePending(null);
  };

  const cancelDelete = () => setDeletePending(null);

  // Handle Enter key in delete confirmation popup
  useEffect(() => {
    if (!deletePending) return;

    const onDeletePopupKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmDeleteNow();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelDelete();
      }
    };

    window.addEventListener('keydown', onDeletePopupKey);
    return () => window.removeEventListener('keydown', onDeletePopupKey);
  }, [deletePending]);

  const duplicateItem = (item: { id: string, name: string, type: string }) => {
    // If the item is part of a multi-selection, duplicate all selected items
    const itemsToDuplicate = selectedIds.has(item.id) && selectedIds.size > 1
      ? assets.filter(a => selectedIds.has(a.id))
      : [item];

    onLog(`Duplicating ${itemsToDuplicate.length} item(s)`, 'INFO');
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      itemsToDuplicate.forEach(it => {
        __webview.postMessage({ action: 'duplicate', path: (it as any).path });
      });
    }
  };

  const copyItem = (item: { id: string, name: string, type: string }) => {
    // If the item is part of a multi-selection, copy all selected items
    const itemsToCopy = selectedIds.has(item.id) && selectedIds.size > 1
      ? assets.filter(a => selectedIds.has(a.id))
      : [item];

    setClipboard(itemsToCopy.length === 1 ? itemsToCopy[0] : itemsToCopy as any);
    onLog(`Copied ${itemsToCopy.length} item(s) to clipboard`, 'INFO');

    // Inform backend clipboard if needed
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      itemsToCopy.forEach(it => {
        __webview.postMessage({ action: 'copy', id: it.id, path: (it as any).path });
      });
    }
  };

  const pasteClipboard = () => {
    if (!clipboard) return;

    // Check if clipboard contains multiple items
    const itemsToPaste = Array.isArray(clipboard) ? clipboard : [clipboard];

    onLog(`Pasting ${itemsToPaste.length} item(s)`, 'INFO');
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      itemsToPaste.forEach(item => {
        __webview.postMessage({ action: 'paste', sourcePath: (item as any).path, path: currentPath });
      });
    }
  };

  const openInExplorer = (item?: { id: string, name: string, type: string }) => {
    onLog(`Open in Explorer${item ? ' : ' + item.name : ''}`, 'INFO');
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ action: 'open-in-explorer', path: item ? (item as any).path : currentPath });
  };

  const handleImport = () => {
    const __webview = (window as any).chrome?.webview;
    if (__webview) {
      __webview.postMessage({
        action: 'import-file',
        path: currentPath,
        filters: [
          { name: 'Textures', extensions: ['*.png', '*.jpg', '*.jpeg', '*.tga', '*.bmp', '*.psd', '*.svg'] },
          { name: 'Models', extensions: ['*.fbx', '*.obj', '*.gltf', '*.glb'] },
          { name: 'Audio', extensions: ['*.wav', '*.mp3', '*.ogg'] },
          { name: 'All Files', extensions: ['*.*'] }
        ]
      });
    } else {
      // Fallback pour le d�veloppement
      onLog('Import dialog not available', 'ERROR');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!show) return;

    // Only show import overlay if we are dragging files from OS
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only disable if we are leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
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
          __webview.postMessage({ action: 'import-files', path: currentPath, files: filesToImport });
          onLog(`Importing ${filesToImport.length} files...`, 'INFO');
        } else {
          // Fallback: Upload as Blob (Base64)
          // Handle first file only for now to keep it simple and safe
          if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Content = result.split(',')[1];
              if (base64Content) {
                __webview.postMessage({
                  action: 'import-file-blob',
                  path: currentPath,
                  name: file.name,
                  content: base64Content
                });
                onLog(`Uploading ${file.name}...`, 'INFO');
              }
            };
            reader.readAsDataURL(file);

            if (files.length > 1) {
              onLog("Multi-file import via drop not supported without paths. Importing first file only.", "WARN");
            }
          }
        }
      }
    }
  };



  // Open folder (navigate into) - set currentPath and request listing
  const openFolder = (item?: { id: string, name: string, type: string, path?: string }) => {
    if (!item) return;
    if (item.type !== 'folder') return;
    // Normalize and enforce path begins at Content
    const raw = item.path || item.name;
    const p = (() => {
      const idx = raw.indexOf('Content');
      if (idx >= 0) return raw.slice(idx).replace(/\\\\/g, '/');
      return raw.startsWith('Content') ? raw.replace(/\\\\/g, '/') : `Content/${raw}`;
    })();
    setCurrentPath(p);
    setSelectedIds(new Set([item.id]));
    setLastSelectedId(item.id);
    // Don't manually set expandedIds here - let the tree refresh handler do it
    // to avoid the open/close flicker issue

    const __webview = (window as any).chrome?.webview;
    if (__webview) __webview.postMessage({ action: 'list-content', path: p });
    // Also refresh the full tree to ensure it's up to date
    if (__webview) __webview.postMessage({ action: 'list-content', path: 'Content', recursive: true });
  };

  const handleAssetClick = (asset: any, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.ctrlKey) {
      // Toggle selection
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(asset.id)) newSet.delete(asset.id);
        else newSet.add(asset.id);
        return newSet;
      });
      setLastSelectedId(asset.id);
    } else if (e.shiftKey && lastSelectedId) {
      // Shift selection
      const startIdx = assets.findIndex(a => a.id === lastSelectedId);
      const endIdx = assets.findIndex(a => a.id === asset.id);
      if (startIdx !== -1 && endIdx !== -1) {
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        const rangeIds = assets.slice(start, end + 1).map(a => a.id);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } else {
      // Single selection
      setSelectedIds(new Set([asset.id]));
      setLastSelectedId(asset.id);
    }
  };

  const handleAssetDoubleClick = (asset: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.type === 'folder') {
      openFolder(asset);
    } else {
      // Ensure path is complete relative to Content
      const cleanPath = asset.path || asset.name;
      let finalPath = cleanPath;
      if (!cleanPath.includes('/') && !cleanPath.includes('\\')) {
        // It's a file in the current folder, prepend currentPath
        const sep = (currentPath.endsWith('/') || currentPath.endsWith('\\')) ? '' : '/';
        finalPath = `${currentPath}${sep}${cleanPath}`;
      }

      // Open asset
      if (onOpenAsset) onOpenAsset({ ...asset, path: finalPath });
    }
  };

  const handleAssetContextMenu = (e: React.MouseEvent, asset: any, info: any) => {
    e.preventDefault();
    e.stopPropagation();

    // Select if not already selected
    if (!selectedIds.has(asset.id)) {
      setSelectedIds(new Set([asset.id]));
      setLastSelectedId(asset.id);
    }

    setCtxX(e.clientX);
    setCtxY(e.clientY);
    setCtxType(asset.type === 'folder' ? 'folder' : 'asset');
    setCtxTarget(asset);
    setCtxVisible(true);
  };

  // Toggle expansion for folder tree
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  // Recursive tree node renderer
  const TreeNode: React.FC<{ node: any; depth: number }> = ({ node, depth }) => {
    const isExpanded = expandedIds.has(node.id);

    // Filter children for display in tree
    const visibleChildren = React.useMemo(() => {
      if (!node.children) return [];
      const hidden = new Set<string>();
      node.children.forEach((c: any) => {
        const meta = c.meta as any;
        if (c.name.endsWith('.plumeasset') && meta?.source) hidden.add(meta.source);
      });
      return node.children.filter((c: any) =>
        !hidden.has(c.name) &&
        c.name !== '.plume_meta' &&
        !c.name.endsWith('.plume_meta')
      );
    }, [node.children]);

    const childrenRef = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
      const el = childrenRef.current;
      if (!el) return;
      try {
        if (isExpanded) {
          const h = el.scrollHeight;
          el.style.maxHeight = h + 'px';
          el.style.opacity = '1';
        } else {
          el.style.maxHeight = '0px';
          el.style.opacity = '0';
        }
      } catch (e) { }
    }, [isExpanded, visibleChildren]);

    // Icon logic
    // Determine icon type data
    let iconColor = "#9ca3af";
    if (theme?.colors?.text?.secondary) iconColor = theme.colors.text.secondary;
    const type = node.type ? node.type.toLowerCase() : '';
    const name = node.name ? node.name.toLowerCase() : '';

    // Logic for color only
    if (type === 'folder') {
      iconColor = node.meta?.color ? (node.meta.color.startsWith('#') ? node.meta.color : ('#' + node.meta.color)) : '#eab308';
    }
    else if (type === 'staticmesh' || type === 'mesh' || name.endsWith('.plume_mesh') || name.endsWith('.fbx') || name.endsWith('.obj')) {
      iconColor = "#5DE2E7";
    }
    else if (type === 'texture' || type === 'image' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.tga')) {
      iconColor = "#D05C5E";
    }
    else if (type === 'soundwave' || type === 'sound' || name.endsWith('.wav') || name.endsWith('.mp3')) {
      iconColor = "#CC6CE7";
    }
    else if (type === 'material' || name.endsWith('.plumematerial')) {
      iconColor = "#7DDA58";
    }
    else if (type === 'level' || type === 'map' || name.endsWith('.plumemap') || name.endsWith('.map')) {
      iconColor = "#FE9900";
    }
    else if (type === 'skeletalmesh' || name.endsWith('.plumeskel')) {
      iconColor = "#FFECA1";
    }
    else if (type === 'animationsequence' || type === 'anim' || name.endsWith('.plumeanim')) {
      iconColor = "#BFD641";
    }
    else if (type === 'script' || name.endsWith('.ts') || name.endsWith('.js')) {
      iconColor = "#22c55e";
    }

    return (
      <div>
        <div
          className="flex items-center text-xs rounded px-1 py-0.5 cursor-pointer"
          style={{
            color: currentPath === node.path ? theme.colors.text.primary : theme.colors.text.secondary,
            backgroundColor: currentPath === node.path ? theme.colors.bg.elevated : 'transparent',
            border: currentPath === node.path ? `1px solid ${theme.colors.accent.primary}` : undefined,
            paddingLeft: 8 + depth * 12
          }}
          onClick={() => {
            setSelectedIds(new Set([node.id]));
            setLastSelectedId(node.id);
            // Only change path and load content for folders
            if (node.type === 'folder') {
              setCurrentPath(node.path || node.name);
              const __webview = (window as any).chrome?.webview;
              if (__webview) __webview.postMessage({ action: 'list-content', path: node.path || node.name });
            }
          }}
          onDoubleClick={() => {
            // Only open folders, not files
            if (node.type === 'folder') {
              openFolder(node);
            } else {
              if (onOpenAsset) onOpenAsset(node);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setCtxX(e.clientX);
            setCtxY(e.clientY);
            setCtxType(node.type === 'folder' ? 'folder' : 'asset');
            setCtxTarget(node);
            setCtxVisible(true);
          }}
        >
          <div onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} style={{ width: 16 }}>
            {visibleChildren && visibleChildren.length > 0 ? (
              isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            ) : (
              <span style={{ display: 'inline-block', width: 12 }} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, minWidth: 14, flexShrink: 0, marginRight: 8 }}>
            {type === 'folder' ? (
              <Folder size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={1.5} />
            ) : (type === 'staticmesh' || type === 'mesh' || name.endsWith('.plume_mesh') || name.endsWith('.fbx') || name.endsWith('.obj') ? (
              <Box size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'texture' || type === 'image' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.tga') ? (
              <ImageIcon size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'soundwave' || type === 'sound' || name.endsWith('.wav') || name.endsWith('.mp3') ? (
              <Music size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'material' || name.endsWith('.plumematerial') ? (
              <Layers size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'level' || type === 'map' || name.endsWith('.plumemap') || name.endsWith('.map') ? (
              <Globe size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'skeletalmesh' || name.endsWith('.plumeskel') ? (
              <Bone size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'animationsequence' || type === 'anim' || name.endsWith('.plumeanim') ? (
              <Film size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (type === 'script' || name.endsWith('.ts') || name.endsWith('.js') ? (
              <FileCode size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            ) : (
              <FileIcon size={14} color={iconColor} stroke={iconColor} fill="none" strokeWidth={2} />
            )))))))))}
          </div>

          <span style={{ fontWeight: currentPath === (node.path || node.name) ? 600 : 400 }}>
            {node.name.includes('.') ? node.name.substring(0, node.name.lastIndexOf('.')) : node.name}
          </span>
        </div>
        <div ref={childrenRef} style={{
          maxHeight: isExpanded ? undefined : 0,
          overflow: 'hidden',
          transition: 'max-height 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms ease',
          opacity: isExpanded ? 1 : 0
        }}>
          {visibleChildren.map((c: any) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  const handleModalSubmit = (value: string) => {
    setModalOpen(false);
    if (!modalAction) return;
    try {
      const meta = JSON.parse(modalAction);
      if (meta.action === 'change-color') {
        onLog(`Changed color -> #${value}`, 'INFO');
        const __webview5 = (window as any).chrome?.webview;
        if (__webview5) __webview5.postMessage({ action: 'change-color', id: meta.id, path: meta.path, color: `#${value}` });
        // Request refresh
        if (__webview5) __webview5.postMessage({ action: 'list-content', path: 'Content' });
      }
    } catch (e) {
      // ignore
    }
    setModalAction(null);
  };

  // Deselect all items when the browser is closed (hidden)
  useEffect(() => {
    if (!show) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    }
  }, [show]);

  // Sidebar Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      const newWidth = e.clientX;
      setSidebarWidth(Math.max(100, Math.min(600, newWidth))); // Min 100px, Max 600px
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

  // Zoom Handler
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.0, prev + 0.1));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.1));

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // e.deltaY < 0 means scrolling up (zoom in)
      if (e.deltaY < 0) {
        setZoomLevel(prev => Math.min(2.0, prev + 0.1));
      } else {
        setZoomLevel(prev => Math.max(0.5, prev - 0.1));
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      className={`flex flex-col ${isDocked ? 'w-full h-full' : 'fixed left-0 right-0 shadow-2xl transition-transform duration-300 ease-out'}`}
      onMouseDown={(e) => {
        // Close context menu on left-click only (button 0). Ignore right-clicks (button 2)
        if ((e as React.MouseEvent).button === 0) setCtxVisible(false);
      }}
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
        willChange: isDocked ? undefined : 'transform',
        position: isDocked ? 'static' : 'fixed'
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
            <button
              className="hover:bg-opacity-20 hover:bg-white rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!currentPath || currentPath === 'Content'}
              onClick={() => {
                const parts = currentPath.split('/');
                if (parts.length > 1) {
                  const parentPath = parts.slice(0, -1).join('/');
                  setCurrentPath(parentPath || 'Content');
                  const __webview = (window as any).chrome?.webview;
                  if (__webview) __webview.postMessage({ action: 'list-content', path: parentPath || 'Content' });
                }
              }}
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button
              className="hover:bg-opacity-20 hover:bg-white rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={true}
              title="Forward (not implemented)"
            >
              <ChevronRight size={16} />
            </button>
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
            <Search size={12} className="mr-2" style={{ color: theme.colors.text.muted }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Filter assets... (Ctrl+K)"
              className="bg-transparent border-none outline-none text-xs w-full"
              style={{ color: theme.colors.text.primary }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isDocked && onDock && (
            <button
              className="text-xs px-2 py-1 rounded font-medium shadow-sm transition-colors flex items-center gap-1"
              style={{
                backgroundColor: theme.colors.bg.elevated,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.default}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.default;
              }}
              onClick={onDock}
              title="Open a new permanent docked Content Browser"
            >
              <AppWindow size={14} />
              Docker
            </button>
          )}
          <div className="flex items-center mx-2 bg-black/20 rounded p-0.5">
            <button className="p-1 hover:bg-white/10 rounded" onClick={handleZoomOut} title="Zoom Out (Ctrl+Scroll Down)">
              <Minus size={12} style={{ color: theme.colors.text.secondary }} />
            </button>
            <span className="text-[10px] mx-1 w-8 text-center" style={{ color: theme.colors.text.muted }}>{Math.round(zoomLevel * 100)}%</span>
            <button className="p-1 hover:bg-white/10 rounded" onClick={handleZoomIn} title="Zoom In (Ctrl+Scroll Up)">
              <Plus size={12} style={{ color: theme.colors.text.secondary }} />
            </button>
          </div>

          <button
            className="text-xs px-3 py-1 rounded font-medium shadow-sm transition-colors flex items-center gap-1"
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
            onClick={handleImport}
          >
            <Upload size={14} />
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
          className="p-2 overflow-y-auto flex-shrink-0"
          style={{
            backgroundColor: theme.colors.bg.elevated,
            borderRight: `1px solid ${theme.colors.border.default}`,
            width: `${sidebarWidth}px`
          }}
        >
          <div
            className="text-xs font-bold mb-2 flex items-center"
            style={{ color: theme.colors.text.secondary }}
          >
            {/* Header removed: keep tree compact (no Root label) */}
          </div>
          <div className="pl-4 space-y-1">
            {/* Render Content as the root node and attach folderTree as its children */}
            {(
              <TreeNode
                key={'root_content'}
                node={{ id: 'root_content', name: 'Content', type: 'folder', path: 'Content', children: folderTree && folderTree.length ? folderTree : assets }}
                depth={0}
              />
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
          style={{ backgroundColor: isResizingSidebar ? theme.colors.accent.primary : 'transparent' }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingSidebar(true);
          }}
        />

        <div
          ref={contentAreaRef}
          onWheel={handleWheel}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('asset-grid-container')) {
              setSelectedIds(new Set());
              setLastSelectedId(null);
            }
          }}
          className="flex-1 p-2 overflow-y-auto relative asset-grid-container"
          style={{ backgroundColor: theme.colors.bg.secondary }}
          onContextMenu={(e) => {
            // Right click on empty area
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
          {isDragOver && (
            <div
              className="absolute inset-0 border-2 border-dashed rounded flex items-center justify-center pointer-events-none"
              style={{
                borderColor: theme.colors.accent.primary,
                backgroundColor: theme.colors.accent.primary + '20'
              }}
            >
              <div style={{ color: theme.colors.text.primary }} className="text-center">
                <Upload size={32} className="mx-auto mb-2" />
                <div className="text-sm font-medium">Drop files to import</div>
              </div>
            </div>
          )}
          <div className="mb-2 text-xs" style={{ color: theme.colors.text.muted }}>
            {/* Breadcrumbs for currentPath */}
            {(() => {
              const parts = (currentPath || 'Content').replace(/\\\\/g, '/').split(/[\\/]+/).filter(Boolean);
              // Ensure the first segment is 'Content'
              if (parts.length === 0 || parts[0] !== 'Content') parts.unshift('Content');
              return parts.map((p, idx) => {
                const path = parts.slice(0, idx + 1).join('/');
                return (
                  <span key={idx} style={{ cursor: 'pointer', color: theme.colors.text.secondary }} onClick={() => { const target = idx === 0 ? 'Content' : path; setCurrentPath(target); const __webview = (window as any).chrome?.webview; if (__webview) __webview.postMessage({ action: 'list-content', path: target }); }}>
                    {idx > 0 && <span style={{ margin: '0 6px' }}>{'/'}</span>}
                    <strong style={{ color: currentPath === path ? theme.colors.text.primary : undefined }}>{p}</strong>
                  </span>
                );
              });
            })()}
          </div>
          <div
            className="flex flex-wrap gap-2 content-start"
            onClick={(e) => {
              // Clear selection when clicking on empty area
              if (e.target === e.currentTarget) {
                setSelectedIds(new Set());
                setLastSelectedId(null);
              }
            }}
          >
            {(() => {
              // Helper to filter hidden sources
              const hiddenSources = new Set<string>();
              assets.forEach(a => {
                const meta = a.meta as any;
                if (a.name.endsWith('.plumeasset') && meta?.source) {
                  hiddenSources.add(meta.source);
                }
              });
              const visible = assets.filter(a => !hiddenSources.has(a.name) && a.name !== '.plume_meta' && !a.name.endsWith('.plume_meta'));
              const list = searchQuery ? visible.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) : visible;

              return list.map(a => {
                if (a.id === editingId) {
                  // INLINE RENAME RENDERING
                  const type = a.type ? a.type.toLowerCase() : '';
                  const name = a.name ? a.name.toLowerCase() : '';
                  let Icon = FileIcon;
                  let color = theme.colors.text.secondary;

                  if (type === 'folder') {
                    Icon = Folder;
                    color = a.meta?.color ? (a.meta.color.startsWith('#') ? a.meta.color : ('#' + a.meta.color)) : '#eab308';
                  }
                  else if (type === 'staticmesh' || type === 'mesh' || name.endsWith('.plume_mesh') || name.endsWith('.fbx') || name.endsWith('.obj')) {
                    Icon = Box;
                    color = "#5DE2E7";
                  }
                  else if (type === 'texture' || type === 'image' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.tga')) {
                    Icon = ImageIcon;
                    color = "#D05C5E";
                  }
                  else if (type === 'soundwave' || type === 'sound' || name.endsWith('.wav') || name.endsWith('.mp3')) {
                    Icon = Music;
                    color = "#CC6CE7";
                  }
                  else if (type === 'material' || name.endsWith('.plumematerial')) {
                    Icon = Layers;
                    color = "#7DDA58";
                  }
                  else if (type === 'level' || type === 'map' || name.endsWith('.plumemap') || name.endsWith('.map')) {
                    Icon = Globe;
                    color = "#FE9900";
                  }
                  else if (type === 'skeletalmesh' || name.endsWith('.plumeskel')) {
                    Icon = Bone;
                    color = "#FFECA1";
                  }
                  else if (type === 'animationsequence' || type === 'anim' || name.endsWith('.plumeanim')) {
                    Icon = Film;
                    color = "#BFD641";
                  }
                  else if (type === 'script' || name.endsWith('.ts') || name.endsWith('.js')) {
                    Icon = FileCode;
                    color = "#22c55e";
                  }

                  const baseSize = 96;
                  const size = Math.round(baseSize * zoomLevel);

                  return (
                    <div
                      key={a.id}
                      className="flex flex-col items-center p-2 rounded cursor-pointer group transition-colors"
                      style={{
                        backgroundColor: theme.colors.selection.background,
                        border: `1px solid ${theme.colors.selection.border}`,
                        width: `${size}px`
                      }}
                    >
                      <div
                        className="rounded mb-2 flex items-center justify-center border shadow-sm relative overflow-hidden transition-transform"
                        style={{
                          backgroundColor: theme.colors.bg.secondary,
                          borderColor: theme.colors.border.default,
                          width: `${Math.round(size * 0.66)}px`,
                          height: `${Math.round(size * 0.66)}px`
                        }}
                      >
                        <Icon size={Math.round(32 * zoomLevel)} color={color} strokeWidth={type === 'folder' ? 1.5 : 2} />
                      </div>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(a, editingValue);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            if (!a.path) setAssets(prev => prev.filter(it => it.id !== a.id));
                          }
                        }}
                        onBlur={() => commitRename(a, editingValue)}
                        autoFocus
                        className="text-xs text-center bg-black/50 text-white border border-blue-500 rounded px-1 w-full outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                } else {
                  return (
                    <AssetTile
                      key={a.id}
                      id={a.id}
                      name={a.name}
                      type={a.type || (a.name.includes('.') ? 'file' : 'folder')}
                      selected={selectedIds.has(a.id)}
                      meta={a.meta}
                      scale={zoomLevel}
                      onClick={(e) => handleAssetClick(a, e)}
                      onDoubleClick={(e) => handleAssetDoubleClick(a, e)}
                      onContextMenu={(e, info) => handleAssetContextMenu(e, a, info)}
                    />
                  );
                }
              });
            })()}
          </div>
          {
            ctxVisible && ctxType && (
              <ContextMenu
                x={ctxX}
                y={ctxY}
                direction="up"
                items={(ctxType === 'empty' ? [
                  { id: 'create_folder', label: 'Create Folder' },
                  { id: 'open_in_explorer', label: 'Open In Explorer' },
                  { id: 'paste', label: 'Paste', disabled: clipboard == null },
                  { id: 'import', label: 'Import' },
                  { id: 'sep1', type: 'separator' },
                  { id: 'create_material', label: 'Create Material' },
                  { id: 'create_level', label: 'Create Level' }
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
                  if (id === 'create_folder') createFolder();
                  else if (id === 'paste') pasteClipboard();
                  else if (id === 'open_in_explorer') openInExplorer(ctxTarget ?? undefined);
                  else if (id === 'import') handleImport();
                  else if (id === 'rename' && ctxTarget) renameItem(ctxTarget as any);
                  else if (id === 'delete' && ctxTarget) deleteItem(ctxTarget as any);
                  else if (id === 'duplicate' && ctxTarget) duplicateItem(ctxTarget as any);
                  else if (id === 'copy' && ctxTarget) copyItem(ctxTarget as any);
                  else if (id === 'change_color' && ctxTarget) {
                    setColorPicker({ open: true, x: ctxX, y: ctxY, target: ctxTarget });
                  }
                  else if (id === 'create_material') createAsset('M_NewMaterial', 'Material');
                  else if (id === 'create_level') createAsset('L_NewLevel', 'Level');

                  const payload = { action: id, target: ctxTarget };
                  document.dispatchEvent(new CustomEvent('contentBrowserAction', { detail: payload }));
                  const targetStr = ctxTarget ? ` on ${ctxTarget.name}` : '';
                  onLog(`Context action: ${id}${targetStr}`, 'INFO');
                  setCtxVisible(false);
                }}
                onClose={() => setCtxVisible(false)}
              />
            )
          }
        </div >
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        <SimpleModal
          title={modalTitle}
          defaultValue={modalDefault}
          open={modalOpen}
          placeholder={''}
          onCancel={() => { setModalOpen(false); setModalAction(null); }}
          onSubmit={handleModalSubmit}
        />
        {
          colorPicker && colorPicker.open && (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999
            }}>
              <ColorPicker
                initial={(colorPicker.target && colorPicker.target.meta && colorPicker.target.meta.color) ? (colorPicker.target.meta.color.startsWith('#') ? colorPicker.target.meta.color : ('#' + colorPicker.target.meta.color)) : '#ffffff'}
                onPick={(hex) => {

                  // Update local folderTree state immediately
                  const updateNodeColor = (nodes: any[], targetPath: string, color: string): any[] => {
                    return nodes.map(node => {
                      if (node.path === targetPath) {
                        return { ...node, meta: { ...node.meta, color } };
                      }
                      if (node.children && node.children.length > 0) {
                        return { ...node, children: updateNodeColor(node.children, targetPath, color) };
                      }
                      return node;
                    });
                  };

                  const targetPath = (colorPicker.target as any).path;
                  setFolderTree(prev => updateNodeColor(prev, targetPath, hex));

                  // Also update assets state for the content browser
                  setAssets(prev => prev.map(asset =>
                    asset.path === targetPath ? { ...asset, meta: { ...asset.meta, color: hex } } : asset
                  ));

                  const __webview = (window as any).chrome?.webview;
                  if (__webview) {
                    __webview.postMessage({ action: 'change-color', path: targetPath, color: hex });
                    // Refresh content listing
                    __webview.postMessage({ action: 'list-content', path: currentPath });
                  }
                  setColorPicker(null);
                }}
                onCancel={() => setColorPicker(null)}
              />
            </div>
          )
        }
        {
          deletePending && (
            <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 60 }}>
              <div className="flex items-center space-x-2 p-3 rounded shadow" style={{ backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}` }}>
                <div className="text-sm" style={{ color: theme.colors.text.primary }}>Delete "{deletePending.name}"?</div>
                <button className="px-3 py-1 rounded text-sm" style={{ backgroundColor: '#ef4444', color: '#fff' }} onClick={confirmDeleteNow}>Delete</button>
                <button className="px-3 py-1 rounded text-sm" style={{ backgroundColor: theme.colors.bg.elevated, color: theme.colors.text.primary }} onClick={cancelDelete}>Cancel</button>
              </div>
            </div>
          )
        }
      </div >
    </div>
  );
};
