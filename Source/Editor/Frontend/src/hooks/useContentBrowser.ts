import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';

export interface Asset {
    id: string;
    name: string;
    type: string;
    path?: string;
    meta?: any;
}

export interface FolderNode extends Asset {
    children?: FolderNode[];
}

export function useContentBrowser(show: boolean, onLog: (msg: string, type: 'WARN' | 'INFO' | 'ERROR') => void) {
    const { t } = useLanguage();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('Content');
    const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [clipboard, setClipboard] = useState<Asset | Asset[] | null>(null);

    // Inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    // Delete confirmation
    const [deletePending, setDeletePending] = useState<{ id: string, name: string, path?: string, items?: any[] } | null>(null);

    // Helper: Normalize Path
    const normalizePath = (p: string) => {
        if (!p) return 'Content';
        const s = p.replace(/\\\\/g, '/');
        const idx = s.indexOf('Content');
        if (idx >= 0) return s.slice(idx);
        return s.startsWith('Content') ? s : `Content/${s}`;
    };

    // Helper: Find Ancestors
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

    // 1. Native Bridge Listener
    useEffect(() => {
        if (!show) return;

        const messageReceivedRef = { current: false } as { current: boolean };
        let retryTimer: any = null;
        let attempts = 0;

        const handleMessage = (ev: any) => {
            try {
                const data = ev.data;
                if (!data) return;
                if (data.type === 'content-list') messageReceivedRef.current = true;

                if (data.type === 'content-list' && Array.isArray(data.items)) {
                    const respPath = data.path ? normalizePath(data.path) : 'Content';

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
                    const isRecursiveResponse = !!data.recursive;

                    if (respPath === 'Content' && isRecursiveResponse) {
                        setFolderTree(nodes);
                    }

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
                    if (ok) {
                        onLog(msg, 'INFO');
                        const __webview = (window as any).chrome?.webview;
                        if (__webview) {
                            __webview.postMessage({ action: 'list-content', path: currentPath || 'Content' });
                            __webview.postMessage({ action: 'list-content', path: 'Content', recursive: true });
                        }
                    } else {
                        onLog(msg, 'ERROR');
                    }
                }
            } catch (e) {
                console.warn('Failed to parse native message:', e);
            }
        };

        const webview = (window as any).chrome?.webview;
        if (webview && webview.addEventListener) {
            webview.addEventListener('message', handleMessage);
        } else {
            window.addEventListener('message', handleMessage as EventListener);
        }

        const trySend = () => {
            if ((messageReceivedRef as any).current) return;
            if (attempts >= 8) return;
            attempts++;
            const __webview2 = (window as any).chrome?.webview;
            if (__webview2) __webview2.postMessage({ action: 'list-content', path: 'Content', recursive: true });
            retryTimer = setTimeout(trySend, 300);
        };
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
    }, [show, currentPath, onLog]);

    // 2. Load Content on Open/Path Change
    useEffect(() => {
        if (!show) return;

        setExpandedIds(prev => {
            const next = new Set<string>();
            next.add('root_content');

            if (currentPath && currentPath !== 'Content' && folderTree.length > 0) {
                try {
                    const anc = findAncestorIds(folderTree, normalizePath(currentPath));
                    if (anc) anc.forEach(id => next.add(id));
                    folderTree.forEach(node => {
                        if (currentPath!.startsWith(node.path + '/')) {
                            next.add(node.id);
                        }
                    });
                } catch (e) {
                    console.warn('Error expanding folder tree:', e);
                }
            }
            return next;
        });

        const __webview = (window as any).chrome?.webview;
        if (__webview) {
            __webview.postMessage({ action: 'list-content', path: currentPath || 'Content' });
        }
    }, [show, currentPath, folderTree]);

    // 3. Operations
    const createAsset = (defaultName: string, type: string) => {
        const __webview = (window as any).chrome?.webview;
        if (__webview) {
            const uniqueName = `${defaultName}_${Date.now()}.plumeasset`;
            const jsonContent = JSON.stringify({
                type: type,
                properties: type === 'Material' ? { color: [1, 1, 1], roughness: 0.5, metallic: 0.0 } : {}
            }, null, 2);
            const base64Content = btoa(jsonContent);

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
            // ... logic for folder creation with name provided ...
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.postMessage({ action: 'create-folder', name: folderName, path: currentPath });
                (window as any).chrome.webview.postMessage({ action: 'list-content', path: currentPath });
            }
            onLog(`Created folder ${folderName}`, 'INFO');
            return;
        }
        const defaultName = 'New Folder';
        const id = `${defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
        const folderPath = `${currentPath}/${defaultName}`.replace(/\/{2,}/g, '/');
        const placeholder = { id, name: defaultName, type: 'folder', path: folderPath, meta: { isNew: true } };
        setAssets(prev => [placeholder, ...prev]);
        setEditingId(id);
        setEditingValue(defaultName);
    };

    const renameItem = (item: Asset) => {
        setEditingId(item.id);
        let startValue = item.name;
        if (item.type !== 'folder') {
            const lastDot = item.name.lastIndexOf('.');
            if (lastDot > 0) startValue = item.name.substring(0, lastDot);
        }
        setEditingValue(startValue);
        setAssets(prev => prev.map(a => a.id === item.id ? { ...a, meta: { ...a.meta } } : a));
    };

    const commitRename = (asset: Asset, newValue: string) => {
        let newName = newValue.trim();
        if (!newName) newName = asset.type === 'folder' ? 'New Folder' : 'New Asset';

        if (asset.type !== 'folder' && asset.name.includes('.')) {
            const lastDot = asset.name.lastIndexOf('.');
            if (lastDot !== -1) {
                const ext = asset.name.substring(lastDot);
                if (!newName.toLowerCase().endsWith(ext.toLowerCase())) newName += ext;
            }
        }

        setAssets(prev => prev.map(it => it.id === asset.id ? { ...it, name: newName, meta: { ...it.meta } } : it));

        if (asset.type === 'folder' && asset.path) {
            const updateFolderName = (nodes: any[], targetPath: string, nName: string): any[] => {
                return nodes.map(node => {
                    if (node.path === targetPath) return { ...node, name: nName, meta: { ...node.meta } };
                    if (node.children && node.children.length > 0) return { ...node, children: updateFolderName(node.children, targetPath, nName) };
                    return node;
                });
            };
            setFolderTree(prev => updateFolderName(prev, asset.path!, newName));
        }

        setEditingId(null);
        const __webview = (window as any).chrome?.webview;
        if (!asset.path || asset.meta?.isNew) {
            if (__webview) __webview.postMessage({ action: 'create-folder', name: newName, path: currentPath });
        } else {
            if (__webview) __webview.postMessage({ action: 'rename', path: asset.path, newName: newName });
        }
        if (__webview) __webview.postMessage({ action: 'list-content', path: currentPath });
    };

    const deleteItem = useCallback((item: Asset) => {
        if (selectedIds.has(item.id) && selectedIds.size > 1) {
            const selectedItems = assets.filter(a => selectedIds.has(a.id));
            const names = selectedItems.map(a => a.name).join(', ');
            setDeletePending({ id: 'multi', name: `${selectedIds.size} items (${names})`, path: 'multi', items: selectedItems });
        } else {
            setDeletePending({ id: item.id, name: item.name, path: item.path, items: [item] });
        }
    }, [selectedIds, assets]);

    const confirmDeleteNow = () => {
        if (!deletePending) return;
        const itemsToDelete = deletePending.items || [];
        if (itemsToDelete.length > 0) {
            const idsToDelete = itemsToDelete.map(item => item.id);
            setAssets(prev => prev.filter(a => !idsToDelete.includes(a.id)));
            onLog(`Deleted ${itemsToDelete.length} item(s)`, 'INFO');

            const __webview = (window as any).chrome?.webview;
            if (__webview) {
                itemsToDelete.forEach(item => __webview.postMessage({ action: 'delete', path: item.path }));
                __webview.postMessage({ action: 'list-content', path: currentPath });
            }
            setSelectedIds(new Set());
            setLastSelectedId(null);
        }
        setDeletePending(null);
    };

    const duplicateItem = (item: Asset) => {
        const itemsToDuplicate = selectedIds.has(item.id) && selectedIds.size > 1
            ? assets.filter(a => selectedIds.has(a.id))
            : [item];
        onLog(`Duplicating ${itemsToDuplicate.length} item(s)`, 'INFO');
        const __webview = (window as any).chrome?.webview;
        if (__webview) itemsToDuplicate.forEach(it => __webview.postMessage({ action: 'duplicate', path: it.path }));
    };

    const copyItem = (item: Asset) => {
        const itemsToCopy = selectedIds.has(item.id) && selectedIds.size > 1
            ? assets.filter(a => selectedIds.has(a.id))
            : [item];
        setClipboard(itemsToCopy.length === 1 ? itemsToCopy[0] : itemsToCopy);
        onLog(`Copied ${itemsToCopy.length} item(s) to clipboard`, 'INFO');
        const __webview = (window as any).chrome?.webview;
        if (__webview) itemsToCopy.forEach(it => __webview.postMessage({ action: 'copy', id: it.id, path: it.path }));
    };

    const pasteClipboard = () => {
        if (!clipboard) return;
        const itemsToPaste = Array.isArray(clipboard) ? clipboard : [clipboard];
        onLog(`Pasting ${itemsToPaste.length} item(s)`, 'INFO');
        const __webview = (window as any).chrome?.webview;
        if (__webview) itemsToPaste.forEach(item => __webview.postMessage({ action: 'paste', sourcePath: item.path, path: currentPath }));
    };

    const openInExplorer = (item?: Asset) => {
        onLog(`Open in Explorer${item ? ' : ' + item.name : ''}`, 'INFO');
        if ((window as any).chrome?.webview) (window as any).chrome.webview.postMessage({ action: 'open-in-explorer', path: item ? item.path : currentPath });
    };

    const handleImport = () => {
        const __webview = (window as any).chrome?.webview;
        if (__webview) {
            const textureExts = ['*.png', '*.jpg', '*.jpeg', '*.tga', '*.bmp', '*.psd', '*.svg'];
            const modelExts = ['*.fbx', '*.obj', '*.gltf', '*.glb'];
            const audioExts = ['*.wav', '*.mp3', '*.ogg'];
            const allSupported = [...textureExts, ...modelExts, ...audioExts];

            __webview.postMessage({
                action: 'import-file',
                path: currentPath,
                filters: [
                    { name: 'Supported Files', extensions: allSupported },
                    { name: 'Textures', extensions: textureExts },
                    { name: 'Models', extensions: modelExts },
                    { name: 'Audio', extensions: audioExts },
                    { name: 'All Files', extensions: ['*.*'] }
                ]
            });
        } else {
            onLog('Import dialog not available', 'ERROR');
        }
    };

    const openFolder = (item?: Asset) => {
        if (!item || item.type !== 'folder') return;
        const raw = item.path || item.name;
        const p = (() => {
            const idx = raw.indexOf('Content');
            if (idx >= 0) return raw.slice(idx).replace(/\\\\/g, '/');
            return raw.startsWith('Content') ? raw.replace(/\\\\/g, '/') : `Content/${raw}`;
        })();
        setCurrentPath(p);
        setSelectedIds(new Set([item.id]));
        setLastSelectedId(item.id);
        const __webview = (window as any).chrome?.webview;
        if (__webview) __webview.postMessage({ action: 'list-content', path: p });
        if (__webview) __webview.postMessage({ action: 'list-content', path: 'Content', recursive: true });
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const copy = new Set(prev);
            if (copy.has(id)) copy.delete(id); else copy.add(id);
            return copy;
        });
    };

    // Keyboard Shortcuts handled in ContentBrowserPanel
    // to avoid hook dependencies and ensure panel visibility/focus is respected.
    useEffect(() => {
        // No-op or removed
    }, []);

    return {
        searchQuery, setSearchQuery,
        assets, setAssets,
        selectedIds, setSelectedIds,
        lastSelectedId, setLastSelectedId,
        currentPath, setCurrentPath,
        folderTree, setFolderTree,
        expandedIds, setExpandedIds,
        clipboard, setClipboard,
        editingId, setEditingId,
        editingValue, setEditingValue,
        deletePending, setDeletePending,
        createAsset, createFolder,
        renameItem, commitRename,
        deleteItem, confirmDeleteNow,
        duplicateItem, copyItem, pasteClipboard,
        openInExplorer, handleImport, openFolder, toggleExpand
    };
}
