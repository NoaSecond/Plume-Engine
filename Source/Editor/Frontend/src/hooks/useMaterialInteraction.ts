import { useState, useCallback, useRef } from 'react';
import { Node, Edge, Connection, ReactFlowInstance, addEdge, updateEdge, Position } from 'reactflow';
import { NodeTypeItem } from '../components/editors/MaterialEditor/NodeSearchMenu';

export function useMaterialInteraction(
    nodes: Node[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    edges: Edge[],
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    setDirty: (dirty: boolean) => void,
    reactFlowInstance: ReactFlowInstance | null,
    reactFlowWrapper: React.RefObject<HTMLDivElement>
) {
    // Menu State
    const [menu, setMenu] = useState<{ x: number, y: number, isOpen: boolean, connectStartNode?: string, connectStartHandle?: string, connectStartType?: string, pendingEdges?: Edge[], isReconnecting?: boolean, tempNodeId?: string } | null>(null);
    const [nodeMenu, setNodeMenu] = useState<{ x: number, y: number, node: Node } | null>(null);

    // Connection Refs
    const edgeUpdateSuccessful = useRef(true);
    const connectStartParams = useRef<{ nodeId: string, handleId: string | null, handleType?: string } | null>(null);

    // Connection Handlers
    const onEdgeUpdateStart = useCallback(() => {
        edgeUpdateSuccessful.current = false;
    }, []);

    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeUpdateSuccessful.current = true;
        setDirty(true);
        setEdges((els) => updateEdge(oldEdge, newConnection, els));
    }, [setEdges, setDirty]);

    const onEdgeUpdateEnd = useCallback((event: MouseEvent | TouchEvent, edge: Edge) => {
        if (!edgeUpdateSuccessful.current) {
            const { clientX, clientY } = (event as any).touches ? (event as any).touches[0] : event;

            if (reactFlowInstance) {
                const position = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
                const tempNodeId = `temp-${Date.now()}`;
                const tempNode: Node = {
                    id: tempNodeId,
                    type: 'default',
                    position,
                    data: { label: '' },
                    style: { width: 1, height: 1, opacity: 0, visibility: 'hidden' },
                    draggable: false, // Updated to boolean
                    connectable: false // Updated to boolean
                };
                setNodes(nds => nds.concat(tempNode));

                setEdges(eds => eds.map(e => {
                    if (e.id === edge.id) return { ...e, target: tempNodeId, targetHandle: null };
                    return e;
                }));

                setMenu({ x: clientX, y: clientY, isOpen: true, pendingEdges: [edge], isReconnecting: true, tempNodeId });
            } else {
                setMenu({ x: clientX, y: clientY, isOpen: true, pendingEdges: [edge], isReconnecting: true });
            }
        }
    }, [reactFlowInstance, setNodes, setEdges]);

    const onConnectStart = useCallback((_event: any, { nodeId, handleId, handleType }: any) => {
        connectStartParams.current = { nodeId, handleId, handleType };
        setMenu(prev => (prev ? { ...prev, connectStartNode: nodeId, connectStartHandle: handleId, connectStartType: handleType } : { x: 0, y: 0, isOpen: false, connectStartNode: nodeId, connectStartHandle: handleId, connectStartType: handleType }));
    }, []);

    const onConnectEnd = useCallback((event: any) => {
        const targetIsPane = event.target.classList.contains('react-flow__pane');
        if (targetIsPane && reactFlowWrapper.current && reactFlowInstance && connectStartParams.current) {
            const { clientX, clientY } = event instanceof TouchEvent ? event.touches[0] : event;
            const { nodeId, handleId, handleType } = connectStartParams.current;

            const position = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
            const tempNodeId = `temp-${Date.now()}`;
            const tempNode: Node = {
                id: tempNodeId,
                type: 'default',
                position,
                data: { label: '' },
                style: { width: 1, height: 1, opacity: 0, visibility: 'hidden' },
                draggable: false,
                connectable: false
            };
            let newPendingEdges: Edge[] = [];

            if (handleType === 'target') {
                newPendingEdges.push({
                    id: `temp-edge-1-${Date.now()}`,
                    source: tempNodeId,
                    target: nodeId,
                    targetHandle: handleId,
                    animated: true
                });
            } else if (handleType === 'source') {
                newPendingEdges.push({
                    id: `temp-edge-2-${Date.now()}`,
                    source: nodeId,
                    sourceHandle: handleId,
                    target: tempNodeId,
                    animated: true
                });
            } else {
                newPendingEdges.push({
                    id: `temp-edge-1-${Date.now()}`,
                    source: tempNodeId,
                    target: nodeId,
                    targetHandle: handleId,
                    animated: true
                });
                newPendingEdges.push({
                    id: `temp-edge-2-${Date.now()}`,
                    source: nodeId,
                    sourceHandle: handleId,
                    target: tempNodeId,
                    animated: true
                });
            }

            setNodes(nds => nds.concat(tempNode));
            setEdges(eds => [...eds, ...newPendingEdges]);

            setMenu({
                x: clientX,
                y: clientY,
                isOpen: true,
                connectStartNode: nodeId,
                connectStartHandle: handleId || undefined,
                connectStartType: handleType,
                pendingEdges: newPendingEdges,
                isReconnecting: false,
                tempNodeId
            });
        } else {
            if (!menu?.isOpen) setMenu(null);
        }
    }, [reactFlowInstance, setNodes, setEdges, menu?.isOpen, reactFlowWrapper]);

    const onPaneClick = useCallback(() => {
        if (menu?.pendingEdges) {
            const pendingIds = new Set(menu.pendingEdges.map(e => e.id));
            setEdges((eds) => eds.filter(e => !pendingIds.has(e.id)));
        }
        if (menu?.tempNodeId) {
            setNodes(nds => nds.filter(n => n.id !== menu.tempNodeId));
        }
        if (menu) setMenu(null);
        if (nodeMenu) setNodeMenu(null);
    }, [menu, nodeMenu, setEdges, setNodes]);

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

        setNodes((nds) => {
            const nextNodes = menu.tempNodeId ? nds.filter(n => n.id !== menu.tempNodeId) : nds;
            return nextNodes.concat(newNode);
        });
        setDirty(true);

        const startNode = nodes.find(n => n.id === menu.connectStartNode);

        let isTarget = false;
        if (menu.connectStartType) {
            isTarget = menu.connectStartType === 'target';
        } else if (startNode) {
            if (startNode.type === 'result') isTarget = true;
            else if (startNode.type === 'math') isTarget = ['a', 'b'].includes(menu.connectStartHandle || '');
            else if (startNode.type === 'texture') isTarget = (menu.connectStartHandle === 'uvs');
        }

        let newEdge: Edge | null = null;
        if (!menu.isReconnecting && menu.connectStartNode) {
            if (isTarget) {
                newEdge = {
                    id: `e-${newNode.id}-${menu.connectStartNode}`,
                    source: newNode.id,
                    target: menu.connectStartNode,
                    targetHandle: menu.connectStartHandle,
                    animated: true
                };
            } else {
                newEdge = {
                    id: `e-${menu.connectStartNode}-${newNode.id}`,
                    source: menu.connectStartNode,
                    sourceHandle: menu.connectStartHandle,
                    target: newNode.id,
                    animated: true
                };
            }
        }

        setEdges((eds) => {
            let nextEdges = eds;
            // Remove pending temp edges (unless reconnecting active edge)
            if (menu.pendingEdges && !menu.isReconnecting) {
                const pendingIds = new Set(menu.pendingEdges.map(e => e.id));
                nextEdges = nextEdges.filter(e => !pendingIds.has(e.id));
            }

            if (menu.isReconnecting && menu.pendingEdges && menu.pendingEdges[0]) {
                return nextEdges.map(e => {
                    if (e.id === menu.pendingEdges![0].id) {
                        if (e.target === menu.tempNodeId) return { ...e, target: newNode.id, targetHandle: null };
                        if (e.source === menu.tempNodeId) return { ...e, source: newNode.id, sourceHandle: null };
                    }
                    return e;
                });
            } else if (newEdge) {
                return addEdge(newEdge, nextEdges);
            }
            return nextEdges;
        });

        setMenu(null);
    }, [menu, reactFlowInstance, setNodes, setEdges, setDirty, nodes]);

    const closeMenu = useCallback(() => {
        if (menu?.pendingEdges) {
            const pendingIds = new Set(menu.pendingEdges.map(e => e.id));
            setEdges((eds) => eds.filter(e => !pendingIds.has(e.id)));
        }
        if (menu?.tempNodeId) {
            setNodes(nds => nds.filter(n => n.id !== menu.tempNodeId));
        }
        setMenu(null);
        setNodeMenu(null);
    }, [menu, setEdges, setNodes]);

    const handleNodeDataChange = useCallback((id: string, key: string, value: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, [key]: value } };
            }
            return node;
        }));
        setDirty(true);
    }, [setNodes, setDirty]);

    const mousePos = useRef({ x: 0, y: 0 });
    const onMouseMove = useCallback((event: React.MouseEvent) => {
        if (reactFlowWrapper.current && reactFlowInstance) {
            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            mousePos.current = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top
            };
        }
    }, [reactFlowInstance, reactFlowWrapper]);

    const createComment = useCallback((targetNodes: Node[], pos?: { x: number, y: number }) => {
        const padding = 30;
        let newNode: Node;

        // Default color for comments
        const defaultColor = '#3b82f6'; // Replace with theme color if needed or pass as arg

        if (targetNodes.length > 0) {
            const rect = getNodesBounds(targetNodes);
            newNode = {
                id: `comment-${Date.now()}`,
                type: 'comment',
                position: { x: rect.x - padding, y: rect.y - padding - 40 },
                data: { label: 'Comment', color: defaultColor },
                style: { width: rect.width + padding * 2, height: rect.height + padding * 2 + 40 },
                selected: true,
                zIndex: -1
            };
        } else if (pos && reactFlowInstance) {
            const position = reactFlowInstance.screenToFlowPosition(pos);
            newNode = {
                id: `comment-${Date.now()}`,
                type: 'comment',
                data: { label: 'Comment', color: defaultColor },
                position: position,
                dragHandle: '.comment-drag-handle',
                style: { width: 300, height: 200 },
                selected: true,
                zIndex: -1
            };
        } else {
            return;
        }

        setNodes(nds => [newNode, ...nds.map(n => ({ ...n, selected: false }))]);
        setDirty(true);
    }, [setNodes, reactFlowInstance, setDirty]);

    const startRename = useCallback((id: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, isEditing: true } };
            }
            return node;
        }));
    }, [setNodes]);

    return {
        menu, setMenu,
        nodeMenu, setNodeMenu,
        onEdgeUpdateStart, onEdgeUpdate, onEdgeUpdateEnd,
        onConnectStart, onConnectEnd,
        onPaneClick, onPaneContextMenu, onNodeContextMenu,
        onNodeSelect, closeMenu,
        handleNodeDataChange,
        mousePos, onMouseMove,
        createComment, startRename
    };
}

// Helper needed because getNodesBounds is not exported from 'reactflow' directly in newer versions or sometimes tricky
import { getNodesBounds } from 'reactflow';
