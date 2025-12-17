import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ReactFlowInstance, Node, Edge, useNodesState, useEdgesState, addEdge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, updateEdge, Position } from 'reactflow';
import { useTheme } from '../ThemeContext';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'result',
        data: { label: 'Result Node' },
        position: { x: 600, y: 100 },
    },
    {
        id: '2',
        type: 'color',
        data: { label: 'Color', color: '#ff0000' },
        position: { x: 100, y: 150 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
];

const initialEdges: Edge[] = [
    { id: 'e2-1', source: '2', target: '1', targetHandle: 'base-color', animated: false },
];

export function useMaterialEditor(assetId: string, name: string, onDirtyChange?: (dirty: boolean) => void) {
    const { theme } = useTheme();

    // ReactFlow States
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    // UI States
    const [isDirty, setIsDirty] = useState(false);
    const [isInteractive, setIsInteractive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFitting, setIsFitting] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [isZoomingIn, setIsZoomingIn] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);
    const [availableTextures, setAvailableTextures] = useState<{ id: string, name: string, path: string }[]>([]);

    const [clipboard, setClipboard] = useState<Node[]>([]);
    const hasLoaded = useRef(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const setDirty = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
        if (onDirtyChange) onDirtyChange(dirty);
    }, [onDirtyChange]);

    // Handle Nodes Change wrapper to protect logic
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        const isMeaningfulChange = changes.some(c => c.type !== 'select');
        if (isMeaningfulChange) setDirty(true);

        const filteredChanges = changes.filter(c => {
            if (c.type === 'remove') {
                const node = nodes.find(n => n.id === c.id);
                if (node?.type === 'result') return false;
            }
            return true;
        });
        onNodesChange(filteredChanges);
    }, [nodes, onNodesChange, setDirty]);

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        const isMeaningfulChange = changes.some(c => c.type !== 'select');
        if (isMeaningfulChange) setDirty(true);
        onEdgesChange(changes);
    }, [onEdgesChange, setDirty]);

    // Save Logic
    const handleSave = useCallback(() => {
        if (!isDirty) return;
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 200);

        const materialData = {
            nodes: nodes.map(n => ({ ...n, selected: false })),
            edges: edges.map(e => ({ ...e, selected: false })),
            name: name
        };

        const payload = {
            action: 'save-asset',
            assetId,
            type: 'Material',
            content: JSON.stringify(materialData)
        };

        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.postMessage(payload);
        }
        setDirty(false);
    }, [isDirty, nodes, edges, name, assetId, setDirty]);

    // Viewport Controls
    const handleFitView = useCallback(() => {
        setIsFitting(true);
        setTimeout(() => setIsFitting(false), 200);
        reactFlowInstance?.fitView({ padding: 0.2, duration: 200 });
    }, [reactFlowInstance]);

    const handleLock = useCallback(() => {
        setIsLocking(true);
        setTimeout(() => setIsLocking(false), 200);
        setIsInteractive(prev => !prev);
    }, []);

    const handleZoomIn = useCallback(() => {
        setIsZoomingIn(true);
        setTimeout(() => setIsZoomingIn(false), 200);
        reactFlowInstance?.zoomIn();
    }, [reactFlowInstance]);

    const handleZoomOut = useCallback(() => {
        setIsZoomingOut(true);
        setTimeout(() => setIsZoomingOut(false), 200);
        reactFlowInstance?.zoomOut();
    }, [reactFlowInstance]);

    const onConnect = useCallback((params: Connection) => {
        if (params.source === params.target) return;
        setDirty(true);
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges, setDirty]);

    // Dynamic Edge Styling
    useEffect(() => {
        const resultNode = nodes.find(n => n.type === 'result');
        if (!resultNode) return;

        const targetToEdges = new Map<string, string[]>();
        edges.forEach(edge => {
            const existing = targetToEdges.get(edge.target) || [];
            existing.push(edge.id);
            targetToEdges.set(edge.target, existing);
        });

        const reachableEdgeIds = new Set<string>();
        const stack = [resultNode.id];
        const visitedNodes = new Set<string>([resultNode.id]);

        while (stack.length > 0) {
            const nodeId = stack.pop()!;
            const incomingEdgeIds = targetToEdges.get(nodeId) || [];
            incomingEdgeIds.forEach(edgeId => {
                if (!reachableEdgeIds.has(edgeId)) {
                    reachableEdgeIds.add(edgeId);
                    const edge = edges.find(e => e.id === edgeId);
                    if (edge && !visitedNodes.has(edge.source)) {
                        visitedNodes.add(edge.source);
                        stack.push(edge.source);
                    }
                }
            });
        }

        let hasChanges = false;
        const newEdges = edges.map(edge => {
            const isReachable = reachableEdgeIds.has(edge.id);
            const shouldBeAnimated = !isReachable;
            const strokeStyle = { stroke: 'url(#edge-gradient)', strokeWidth: 2 };
            if (edge.animated !== shouldBeAnimated || edge.style?.stroke !== 'url(#edge-gradient)') {
                hasChanges = true;
                return { ...edge, animated: shouldBeAnimated, style: strokeStyle };
            }
            return edge;
        });
        if (hasChanges) setEdges(newEdges);
    }, [edges, nodes, setEdges]);

    // Data Loading
    useEffect(() => {
        const handleMessage = (e: any) => {
            const data = (e.data) ? e.data : (e.detail) ? e.detail : e;
            if (data?.type === 'content-list' && Array.isArray(data.items)) {
                const textureAssets: { id: string, name: string, path: string }[] = [];
                const processNode = (node: any) => {
                    const type = node.type || '';
                    if (type.toLowerCase() === 'texture') {
                        textureAssets.push({ id: node.id, name: node.name, path: node.path || node.name });
                    }
                    if (node.children) node.children.forEach(processNode);
                };
                data.items.forEach(processNode);
                setAvailableTextures(textureAssets);
            }
            if (data?.action === 'asset-data' && data.assetId === assetId) {
                try {
                    let loaded = false;
                    if (data.content && data.content.length > 0) {
                        const content = JSON.parse(data.content);
                        if (content.nodes && content.nodes.length > 0) {
                            setNodes(content.nodes.map((n: any) => ({ ...n, selected: false })));
                            loaded = true;
                        }
                        if (content.edges) {
                            setEdges(content.edges.map((e: any) => ({ ...e, selected: false })));
                        }
                    }
                    if (!loaded) {
                        const defaults = initialNodes.map(n => {
                            if (n.id === '1') return { ...n, data: { ...n.data, materialName: name } };
                            return n;
                        });
                        setNodes(defaults);
                        setEdges(initialEdges);
                    }
                    setDirty(false);
                    setTimeout(() => {
                        if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
                    }, 100);
                } catch (err) { console.error("Failed to parse material data", err); }
            }
        };

        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.addEventListener('message', handleMessage);
            if (!hasLoaded.current) {
                (window as any).chrome.webview.postMessage({ action: 'load-asset', assetId });
                (window as any).chrome.webview.postMessage({ action: 'list-content', path: 'Content', recursive: true });
                hasLoaded.current = true;
            }
        } else {
            window.addEventListener('message', handleMessage);
        }
        return () => {
            if ((window as any).chrome?.webview) (window as any).chrome.webview.removeEventListener('message', handleMessage);
            else window.removeEventListener('message', handleMessage);
        };
    }, [assetId, setNodes, setEdges, setDirty, name, reactFlowInstance]);

    // Node Operations that need access to setNodes
    const duplicateNodes = useCallback((targetNodes: Node[]) => {
        const newNodes = targetNodes
            .filter(n => n.type !== 'result')
            .map(node => ({
                ...node,
                id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                position: { x: node.position.x + 50, y: node.position.y + 50 },
                selected: true
            }));
        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNodes));
        if (newNodes.length > 0) setDirty(true);
    }, [setNodes, setDirty]);

    const deleteNodes = useCallback((ids: string[]) => {
        const resultNode = nodes.find(n => n.type === 'result');
        const safeIds = ids.filter(id => id !== resultNode?.id);
        if (safeIds.length > 0) setDirty(true);
        setNodes(nds => nds.filter(n => !safeIds.includes(n.id)));
    }, [nodes, setNodes, setDirty]);

    const copyNodes = useCallback((nodes: Node[]) => {
        const nodesToCopy = nodes.filter(n => n.type !== 'result');
        if (nodesToCopy.length > 0) setClipboard(nodesToCopy);
    }, []);

    const pasteNodes = useCallback(() => {
        if (clipboard.length === 0) return;
        const newNodes = clipboard.map(node => ({
            ...node,
            id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            position: { x: node.position.x + 50, y: node.position.y + 50 },
            selected: true
        }));
        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNodes));
        setDirty(true);
    }, [clipboard, setNodes, setDirty]);

    return {
        nodes, setNodes, handleNodesChange,
        edges, setEdges, handleEdgesChange,
        reactFlowInstance, setReactFlowInstance,
        isDirty, setDirty,
        isInteractive, setIsInteractive,
        isSaving, handleSave,
        isFitting, handleFitView,
        isLocking, handleLock,
        isZoomingIn, handleZoomIn,
        isZoomingOut, handleZoomOut,
        availableTextures,
        reactFlowWrapper,
        onConnect,
        duplicateNodes, deleteNodes, copyNodes, pasteNodes,
        initialNodes, initialEdges // Export constants if needed
    };
}
