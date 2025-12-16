import React, { useCallback, useMemo, useState, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Position,
    ReactFlowInstance,
    NodeMouseHandler,
    SelectionMode,
    getNodesBounds,
    NodeChange,
    applyNodeChanges,
    applyEdgeChanges,
    Panel,
    EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from '../../ThemeContext';
import ResultNode from './MaterialNodes/ResultNode';
import ColorNode from './MaterialNodes/ColorNode';
import CommentNode from './MaterialNodes/CommentNode';
import MathNode from './MaterialNodes/MathNode';
import TextureNode from './MaterialNodes/TextureNode';
import { NodeSearchMenu, NodeTypeItem } from './NodeSearchMenu';
import { NodeContextMenu } from './NodeContextMenu';
import { Maximize, Lock, Unlock, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Save } from 'lucide-react';

interface MaterialEditorProps {
    assetId: string;
    name: string;
    onDirtyChange?: (dirty: boolean) => void;
}

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
    { id: 'e2-1', source: '2', target: '1', targetHandle: 'base-color', animated: true },
];

const ToolbarButton = ({ theme, onClick, disabled, forceActive, icon: Icon, label, tooltip, shortcut, active: externalActive }: any) => {
    const [hover, setHover] = useState(false);
    const [localActive, setLocalActive] = useState(false);
    const active = localActive || forceActive || externalActive;
    const tooltipText = tooltip || label;

    return (
        <button
            title={shortcut ? `${tooltipText} (${shortcut})` : tooltipText}
            style={{
                background: active ? theme.colors.accent.primary : (disabled ? theme.colors.bg.secondary : (hover ? theme.colors.accent.primary + '40' : theme.colors.bg.secondary)),
                color: active || hover ? '#fff' : (disabled ? theme.colors.text.muted : theme.colors.text.secondary),
                border: `1px solid ${active || hover ? theme.colors.accent.primary : theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                padding: label ? '6px 12px' : '6px',
                minWidth: label ? 'auto' : '32px',
                height: '32px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: disabled ? 'none' : theme.shadows.md,
                transition: 'all 0.1s ease',
                transform: active ? 'translateY(1px)' : 'none',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                outline: 'none'
            }}
            onMouseEnter={() => !disabled && setHover(true)}
            onMouseLeave={() => { setHover(false); setLocalActive(false); }}
            onMouseDown={() => !disabled && setLocalActive(true)}
            onMouseUp={() => setLocalActive(false)}
            onClick={onClick}
            disabled={disabled}
        >
            <Icon size={16} />
            {label}
        </button>
    );
};

const EditorToolbar = ({ theme, onSave, onFitView, onLock, onZoomIn, onZoomOut, isDirty, isInteractive, isSaving, isFitting, isLocking, isZoomingIn, isZoomingOut }: any) => {
    return (
        <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
            <ToolbarButton theme={theme} onClick={onSave} icon={Save} label="Save" shortcut="Ctrl+S" disabled={!isDirty} forceActive={isSaving} />
            <div style={{ width: '1px', background: theme.colors.border.default, margin: '0 4px', height: '24px', alignSelf: 'center' }} />
            <ToolbarButton theme={theme} onClick={onFitView} icon={Maximize} tooltip="Fit View" shortcut="Ctrl+F" forceActive={isFitting} />
            <ToolbarButton theme={theme} onClick={onLock} icon={isInteractive ? Unlock : Lock} tooltip={isInteractive ? "Lock Interactivity" : "Unlock Interactivity"} shortcut="Ctrl+L" forceActive={isLocking} active={!isInteractive} />
            <div style={{ width: '1px', background: theme.colors.border.default, margin: '0 4px', height: '24px', alignSelf: 'center' }} />
            <ToolbarButton theme={theme} onClick={onZoomIn} icon={ZoomInIcon} tooltip="Zoom In" shortcut="Scroll Up" forceActive={isZoomingIn} />
            <ToolbarButton theme={theme} onClick={onZoomOut} icon={ZoomOutIcon} tooltip="Zoom Out" shortcut="Scroll Down" forceActive={isZoomingOut} />
        </div>
    );
};

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ assetId, name, onDirtyChange }) => {
    const { theme } = useTheme();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isInteractive, setIsInteractive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFitting, setIsFitting] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [isZoomingIn, setIsZoomingIn] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);

    const setDirty = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
        if (onDirtyChange) onDirtyChange(dirty);
    }, [onDirtyChange]);

    const handleSave = useCallback(() => {
        if (!isDirty) return;
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 200);

        // Construct payload
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
        } else {
            console.log("Mock Save:", payload);
        }

        setDirty(false); // Optimistic
    }, [isDirty, nodes, edges, name, assetId, setDirty]);

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

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        const isMeaningfulChange = changes.some(c => c.type !== 'select');
        if (isMeaningfulChange) setDirty(true);
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, [setDirty, setEdges]);

    // Protect Result Node from deletion
    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const isMeaningfulChange = changes.some(c => c.type !== 'select');
        if (isMeaningfulChange) setDirty(true);

        const filteredChanges = changes.filter(c => {
            if (c.type === 'remove') {
                const node = nodes.find(n => n.id === c.id);
                if (node?.type === 'result') return false;
            }
            return true;
        });
        setNodes((nds) => applyNodeChanges(filteredChanges, nds));
    }, [nodes, setNodes, setDirty]);

    const nodeTypes = useMemo(() => ({
        result: ResultNode,
        color: ColorNode,
        comment: CommentNode,
        add: MathNode,
        multiply: MathNode,
        texture: TextureNode
    }), []);

    // Menu States
    const [menu, setMenu] = useState<{ x: number, y: number, isOpen: boolean, connectStartNode?: string, connectStartHandle?: string } | null>(null);
    const [nodeMenu, setNodeMenu] = useState<{ x: number, y: number, node: Node } | null>(null);

    const onConnect = useCallback((params: Connection) => {
        setDirty(true);
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges, setDirty]);

    const onConnectStart = useCallback((_event: any, { nodeId, handleId }: any) => {
        setMenu(prev => (prev ? { ...prev, connectStartNode: nodeId, connectStartHandle: handleId } : { x: 0, y: 0, isOpen: false, connectStartNode: nodeId, connectStartHandle: handleId }));
    }, []);

    const onConnectEnd = useCallback((event: any) => {
        const targetIsPane = event.target.classList.contains('react-flow__pane');
        if (targetIsPane && reactFlowWrapper.current && reactFlowInstance) {
            const { clientX, clientY } = event instanceof TouchEvent ? event.touches[0] : event;
            setMenu(prev => ({
                x: clientX, y: clientY, isOpen: true,
                connectStartNode: prev?.connectStartNode, connectStartHandle: prev?.connectStartHandle
            }));
        } else {
            if (!menu?.isOpen) setMenu(null);
        }
    }, [reactFlowInstance, menu?.isOpen]);

    const onPaneClick = useCallback(() => {
        if (menu) setMenu(null);
        if (nodeMenu) setNodeMenu(null);
    }, [menu, nodeMenu]);

    const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY, isOpen: true, connectStartNode: undefined, connectStartHandle: undefined });
        setNodeMenu(null);
    }, []);

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        setNodeMenu({ x: event.clientX, y: event.clientY, node });
        setMenu(null);
    }, []);

    const onNodeSelect = useCallback((item: NodeTypeItem) => {
        if (!reactFlowInstance || !menu) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: menu.x, y: menu.y });
        const newNode: Node = {
            id: `${item.type}-${Date.now()}`,
            type: item.type,
            position,
            data: item.data,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        };
        setNodes((nds) => nds.concat(newNode));
        setDirty(true); // New node = dirty
        if (menu.connectStartNode) {
            const newEdge: Edge = {
                id: `e-${menu.connectStartNode}-${newNode.id}`,
                source: menu.connectStartNode,
                sourceHandle: menu.connectStartHandle,
                target: newNode.id,
                animated: true
            };
            setEdges((eds) => addEdge(newEdge, eds));
        }
        setMenu(null);
    }, [menu, reactFlowInstance, setNodes, setEdges, setDirty]);

    const closeMenu = useCallback(() => { setMenu(null); setNodeMenu(null); }, []);

    const mousePos = useRef({ x: 0, y: 0 });

    const onMouseMove = useCallback((event: React.MouseEvent) => {
        if (reactFlowWrapper.current && reactFlowInstance) {
            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            mousePos.current = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top
            };
        }
    }, [reactFlowInstance]);

    // Actions
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
        // Filter out result node id
        const resultNode = nodes.find(n => n.type === 'result');
        const safeIds = ids.filter(id => id !== resultNode?.id);
        if (safeIds.length > 0) setDirty(true);
        setNodes(nds => nds.filter(n => !safeIds.includes(n.id)));
    }, [nodes, setNodes, setDirty]);

    const copyNodes = useCallback((nodes: Node[]) => {
        // Copy logic to be implemented
    }, []);

    const createComment = useCallback((targetNodes: Node[], pos?: { x: number, y: number }) => {
        const padding = 30;
        let newNode: Node;

        if (targetNodes.length > 0) {
            const rect = getNodesBounds(targetNodes);
            newNode = {
                id: `comment-${Date.now()}`,
                type: 'comment',
                position: { x: rect.x - padding, y: rect.y - padding - 40 },
                data: { label: 'Comment', color: theme.colors.accent.primary },
                style: { width: rect.width + padding * 2, height: rect.height + padding * 2 + 40 },
                selected: true,
                zIndex: -1
            };
        } else if (pos && reactFlowInstance) {
            const position = reactFlowInstance.screenToFlowPosition(pos);
            newNode = {
                id: `comment-${Date.now()}`,
                type: 'comment',
                data: { label: 'Comment', color: theme.colors.accent.primary },
                position: position,
                dragHandle: '.comment-drag-handle',
                height: 100,
                width: 200,
                selected: true,
                zIndex: -1
            };
            // Fix legacy createComment structure which differed
            newNode.style = { width: 300, height: 200 };
        } else {
            return;
        }

        setNodes(nds => [newNode, ...nds.map(n => ({ ...n, selected: false }))]);
        setDirty(true);
    }, [setNodes, reactFlowInstance, theme, setDirty]);

    const startRename = useCallback((id: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, isEditing: true } };
            }
            return node;
        }));
    }, [setNodes]);


    // Shortcuts
    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        const selected = nodes.filter(n => n.selected);

        // Save Ctrl+S
        if ((event.key === 's' || event.key === 'S') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (isDirty) {
                handleSave();
            }
            return;
        }

        // Alignment 'Q'
        if (event.key === 'q' || event.key === 'Q') {
            if (selected.length > 1) {
                const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
                setNodes(nds => nds.map(n => n.selected ? { ...n, position: { ...n.position, y: avgY } } : n));
                setDirty(true);
            }
        }

        // Comment 'C'
        if ((event.key === 'c' || event.key === 'C') && !event.ctrlKey) {
            if (selected.length > 0) {
                createComment(selected);
            } else {
                createComment([], mousePos.current);
            }
        }

        // Rename 'F2'
        if (event.key === 'F2') {
            const commentNode = selected.find(n => n.type === 'comment');
            if (commentNode) {
                startRename(commentNode.id);
            }
        }

        // Fit View 'Ctrl+F'
        if ((event.key === 'f' || event.key === 'F') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleFitView();
            return;
        }

        // Toggle Interactivity 'Ctrl+L'
        if ((event.key === 'l' || event.key === 'L') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleLock();
            return;
        }

        // Zoom In = (plus)
        if ((event.key === '=' || event.key === '+') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleZoomIn();
            return;
        }
        // Zoom Out - (minus)
        if ((event.key === '-' || event.key === '_') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleZoomOut();
            return;
        }

        // Duplicate Ctrl+D
        if ((event.key === 'd' || event.key === 'D') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            duplicateNodes(selected);
        }

        // Copy Ctrl+C
        if ((event.key === 'c' || event.key === 'C') && (event.ctrlKey || event.metaKey)) {
            copyNodes(selected);
        }
    }, [nodes, setNodes, createComment, duplicateNodes, copyNodes, startRename, setDirty, handleSave]);

    const handleNodeDataChange = (id: string, key: string, value: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, [key]: value } };
            }
            return node;
        }));
        setDirty(true);
    };

    const selectedNodes = nodes.filter(n => n.selected);


    // Load Data Effect
    const hasLoaded = useRef(false);

    React.useEffect(() => {
        const handleMessage = (e: any) => {
            const data = (e.data) ? e.data : (e.detail) ? e.detail : e;
            if (data?.action === 'asset-data' && data.assetId === assetId) {
                try {
                    let loaded = false;
                    if (data.content && data.content.length > 0) {
                        const content = JSON.parse(data.content);
                        if (content.nodes && content.nodes.length > 0) {
                            const loadedNodes = content.nodes.map((n: any) => ({ ...n, selected: false }));
                            setNodes(loadedNodes);
                            loaded = true;
                        }
                        if (content.edges) {
                            const loadedEdges = content.edges.map((e: any) => ({ ...e, selected: false }));
                            setEdges(loadedEdges);
                        }
                    }

                    // Fallback to default if no nodes loaded (e.g. new file)
                    if (!loaded) {
                        const defaults = initialNodes.map(n => {
                            if (n.id === '1') return { ...n, data: { ...n.data, materialName: name } };
                            return n;
                        });
                        setNodes(defaults);
                        setEdges(initialEdges);
                    }

                    setDirty(false);

                    // Fit View
                    setTimeout(() => {
                        if (reactFlowInstance) {
                            reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
                        }
                    }, 100);

                } catch (err) {
                    console.error("Failed to parse material data", err);
                }
            }
        };

        if ((window as any).chrome?.webview) {
            (window as any).chrome.webview.addEventListener('message', handleMessage);
            if (!hasLoaded.current) {
                (window as any).chrome.webview.postMessage({ action: 'load-asset', assetId });
                hasLoaded.current = true;
            }
        } else {
            window.addEventListener('message', handleMessage);
        }

        return () => {
            if ((window as any).chrome?.webview) {
                (window as any).chrome.webview.removeEventListener('message', handleMessage);
            } else {
                window.removeEventListener('message', handleMessage);
            }
        };
    }, [assetId, setNodes, setEdges, setDirty, name, reactFlowInstance]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex' }} onKeyDown={onKeyDown} tabIndex={0} onMouseMove={onMouseMove}>
            {/* Sidebar */}
            <div style={{
                width: '300px',
                background: theme.colors.bg.secondary,
                borderRight: `1px solid ${theme.colors.border.default}`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Preview Panel */}
                <div style={{
                    height: '250px',
                    borderBottom: `1px solid ${theme.colors.border.default}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: theme.colors.bg.primary,
                    position: 'relative'
                }}>
                    <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #666, #111)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                    }}></div>
                    <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '10px', color: theme.colors.text.muted, textTransform: 'uppercase', fontWeight: 'bold' }}>
                        Preview
                    </div>
                </div>

                {/* Details Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                        <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.muted,
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            marginBottom: '16px'
                        }}>
                            Details
                        </div>

                        {selectedNodes.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100px',
                                color: theme.colors.text.muted,
                                opacity: 0.7,
                                textAlign: 'center'
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '8px' }}>
                                    <path d="M20 7h-9L10 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-1 9l-4-4l-4 4" />
                                </svg>
                                <span>Select a node to view details</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedNodes.map(node => (
                                    <div key={node.id} style={{
                                        paddingBottom: '16px',
                                        borderBottom: `1px solid ${theme.colors.border.subtle}`
                                    }}>
                                        <div style={{ color: theme.colors.accent.primary, fontWeight: 'bold', marginBottom: '8px' }}>
                                            {node.data.label || node.type}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                                            {/* Comment Details */}
                                            {node.type === 'comment' && (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                        <label style={{ color: theme.colors.text.secondary }}>Name</label>
                                                        <input
                                                            value={node.data.label || ''}
                                                            onChange={(e) => handleNodeDataChange(node.id, 'label', e.target.value)}
                                                            style={{
                                                                background: theme.colors.bg.tertiary,
                                                                border: `1px solid ${theme.colors.border.subtle}`,
                                                                color: theme.colors.text.primary,
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                outline: 'none',
                                                                fontSize: '12px',
                                                                textAlign: 'left',
                                                                flex: 1
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                                        <div style={{ color: theme.colors.text.secondary }}>Color:</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    background: node.data.color || theme.colors.accent.primary,
                                                                    border: `1px solid ${theme.colors.border.subtle}`,
                                                                    cursor: 'pointer',
                                                                    borderRadius: '4px'
                                                                }}
                                                                onClick={() => {
                                                                    const input = document.createElement('input');
                                                                    input.type = 'color';
                                                                    input.value = node.data.color || theme.colors.accent.primary;
                                                                    input.onchange = (e) => handleNodeDataChange(node.id, 'color', (e.target as HTMLInputElement).value);
                                                                    input.click();
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Specific Node Data */}
                                            {node.type === 'color' && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ color: theme.colors.text.secondary }}>Color:</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                background: node.data.color,
                                                                border: `1px solid ${theme.colors.border.subtle}`,
                                                                cursor: 'pointer',
                                                                borderRadius: '4px'
                                                            }}
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'color';
                                                                input.value = node.data.color;
                                                                input.onchange = (e) => handleNodeDataChange(node.id, 'color', (e.target as HTMLInputElement).value);
                                                                input.click();
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fixed Coordinates Footer */}
                    {selectedNodes.length > 0 && (
                        <div style={{
                            padding: '4px 16px',
                            borderTop: `1px solid ${theme.colors.border.default}`,
                            background: theme.colors.bg.secondary,
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>Selected: {selectedNodes.length}</span>
                            <span>
                                {selectedNodes.length === 1 ? (
                                    `X: ${Math.round(selectedNodes[0].position.x)}, Y: ${Math.round(selectedNodes[0].position.y)}`
                                ) : (
                                    'Multiple Locations'
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Canvas */}
            <div
                ref={reactFlowWrapper}
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
                <div className="flex-1" style={{ height: '100%' }}>
                    <ReactFlow
                        id={assetId}
                        className={!isInteractive ? "locked-interaction" : ""}
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        onPaneClick={onPaneClick}
                        onNodeClick={onPaneClick}
                        onPaneContextMenu={onPaneContextMenu}
                        onNodeContextMenu={onNodeContextMenu}
                        onInit={setReactFlowInstance}
                        fitView
                        proOptions={{ hideAttribution: true }}
                        style={{ backgroundColor: theme.colors.bg.primary }}
                        panOnDrag={[2]}
                        selectionOnDrag={true}
                        panOnScroll={false}
                        zoomOnScroll={true}
                        selectionMode={SelectionMode.Partial}
                        multiSelectionKeyCode={['Control', 'Shift', 'Meta']}
                        selectionKeyCode={null}
                        deleteKeyCode="Delete"
                    >
                        <style>
                            {`
                                .locked-interaction .react-flow__node,
                                .locked-interaction .react-flow__edge {
                                    pointer-events: none !important;
                                }
                                .react-flow__selection {
                                    background-color: ${theme.colors.selection.background} !important;
                                    border: 1px solid ${theme.colors.selection.border} !important;
                                }
                                .react-flow__nodesselection {
                                    display: none !important;
                                }
                            `}
                        </style>
                        <Background color="#555" gap={16} />
                        <Panel position="top-right">
                            <EditorToolbar
                                theme={theme}
                                onSave={handleSave}
                                onFitView={handleFitView}
                                onLock={handleLock}
                                onZoomIn={handleZoomIn}
                                onZoomOut={handleZoomOut}
                                isDirty={isDirty}
                                isInteractive={isInteractive}
                                isSaving={isSaving}
                                isFitting={isFitting}
                                isLocking={isLocking}
                                isZoomingIn={isZoomingIn}
                                isZoomingOut={isZoomingOut}
                            />
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Context Menus */}
                {menu && menu.isOpen && (
                    <NodeSearchMenu
                        x={menu.x}
                        y={menu.y}
                        onSelect={onNodeSelect}
                        onClose={closeMenu}
                    />
                )}

                {nodeMenu && (
                    <NodeContextMenu
                        x={nodeMenu.x}
                        y={nodeMenu.y}
                        node={nodeMenu.node}
                        selectedNodes={selectedNodes}
                        onClose={closeMenu}
                        onDelete={(id) => deleteNodes([id])}
                        onDuplicate={duplicateNode => duplicateNodes(selectedNodes.length > 0 ? selectedNodes : [duplicateNode])}
                        onComment={createComment}
                        onRename={(id) => startRename(id)}
                    />
                )}

                {/* Footer */}
                <div
                    className="h-8 border-t flex items-center px-4 text-xs"
                    style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.secondary
                    }}
                >
                    <span>Path: {assetId}</span>
                </div>
            </div>
        </div>
    );
};
