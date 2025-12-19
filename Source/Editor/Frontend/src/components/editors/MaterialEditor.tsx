import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Panel,
    SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from '../../ThemeContext';
// import { useLanguage } from '../../LanguageContext'; // Used in sub-components
import ResultNode from './MaterialNodes/ResultNode';
import ColorNode from './MaterialNodes/ColorNode';
import CommentNode from './MaterialNodes/CommentNode';
import MathNode from './MaterialNodes/MathNode';
import TextureSampleNode from './MaterialNodes/TextureSampleNode';
import { NodeSearchMenu } from './NodeSearchMenu';
import { NodeContextMenu } from './NodeContextMenu';
import { EditorToolbar } from './material/EditorToolbar';
import { useMaterialEditor } from '../../hooks/useMaterialEditor';
import { useMaterialInteraction } from '../../hooks/useMaterialInteraction';

interface MaterialEditorProps {
    assetId: string;
    name: string;
    onDirtyChange?: (dirty: boolean) => void;
}

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ assetId, name, onDirtyChange }) => {
    const { theme } = useTheme();

    const {
        nodes, setNodes, handleNodesChange,
        edges, setEdges, handleEdgesChange,
        reactFlowInstance, setReactFlowInstance,
        isDirty, setDirty,
        isInteractive,
        isSaving, handleSave,
        isFitting, handleFitView,
        isLocking, handleLock,
        isZoomingIn, handleZoomIn,
        isZoomingOut, handleZoomOut,
        availableTextures,
        reactFlowWrapper,
        onConnect,
        duplicateNodes, deleteNodes, copyNodes, pasteNodes,
        initialNodes, initialEdges
    } = useMaterialEditor(assetId, name, onDirtyChange);

    const {
        menu, setMenu,
        nodeMenu, setNodeMenu,
        onEdgeUpdateStart, onEdgeUpdate, onEdgeUpdateEnd,
        onConnectStart, onConnectEnd,
        onPaneClick, onPaneContextMenu, onNodeContextMenu,
        onNodeSelect, closeMenu,
        handleNodeDataChange,
        mousePos, onMouseMove,
        createComment, startRename
    } = useMaterialInteraction(nodes, setNodes, edges, setEdges, setDirty, reactFlowInstance, reactFlowWrapper);

    const nodeTypes = useMemo(() => ({
        result: ResultNode,
        color: ColorNode,
        comment: CommentNode,
        add: MathNode,
        multiply: MathNode,
        texture: (props: any) => <TextureSampleNode {...props} data={{ ...props.data, availableTextures }} />
    }), [availableTextures]);

    const selectedNodes = nodes.filter(n => n.selected);

    // Shortcuts
    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        const selected = nodes.filter(n => n.selected);
        const target = event.target as HTMLElement;
        const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

        // Save Ctrl+S
        if ((event.key === 's' || event.key === 'S') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (isDirty) handleSave();
            return;
        }

        if (isInput || (menu && menu.isOpen) || nodeMenu) return;

        // Alignment 'Q'
        if (event.key === 'q' || event.key === 'Q') {
            if (selected.length > 1) {
                const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
                setNodes(nds => nds.map(n => n.selected ? { ...n, position: { ...n.position, y: avgY } } : n));
                setDirty(true);
            }
        }

        // Comment 'Ctrl + /'
        if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (selected.length > 0) createComment(selected);
            else createComment([], mousePos.current);
        }

        // Rename 'F2'
        if (event.key === 'F2') {
            const commentNode = selected.find(n => n.type === 'comment');
            if (commentNode) startRename(commentNode.id);
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

        // Zoom
        if ((event.key === '=' || event.key === '+') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleZoomIn();
            return;
        }
        if ((event.key === '-' || event.key === '_') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleZoomOut();
            return;
        }

        // Duplicate Ctrl+D
        if ((event.key === 'd' || event.key === 'D') && (event.ctrlKey || event.metaKey) && !event.repeat) {
            event.preventDefault();
            duplicateNodes(selected);
        }

        // Copy Ctrl+C
        if ((event.key === 'c' || event.key === 'C') && (event.ctrlKey || event.metaKey)) {
            copyNodes(selected);
        }

        // Paste Ctrl+V
        if ((event.key === 'v' || event.key === 'V') && (event.ctrlKey || event.metaKey) && !event.repeat) {
            event.preventDefault();
            pasteNodes();
        }
    }, [nodes, setNodes, createComment, duplicateNodes, copyNodes, pasteNodes, startRename, setDirty, handleSave, menu, nodeMenu, isDirty, handleFitView, handleLock, handleZoomIn, handleZoomOut, mousePos]);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        let data = event.dataTransfer.getData('application/plume-asset');
        if (!data) data = event.dataTransfer.getData('text/plain');

        if (data) {
            try {
                const asset = JSON.parse(data);
                const isTextureType = asset.type?.toLowerCase().includes('texture');
                const isImageType = asset.type?.toLowerCase() === 'image';
                const hasImageExt = asset.name && /\.(png|jpg|jpeg|tga|bmp|psd|svg)(\.plumeasset)?$/i.test(asset.name);

                if (isTextureType || isImageType || hasImageExt) {
                    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
                    if (reactFlowBounds && reactFlowInstance) {
                        const position = reactFlowInstance.project({
                            x: event.clientX - reactFlowBounds.left,
                            y: event.clientY - reactFlowBounds.top,
                        });

                        const uniqueId = `texture-${Date.now()}`;
                        setNodes((nds) => nds.concat({
                            id: uniqueId,
                            type: 'texture',
                            position,
                            data: {
                                label: asset.name.replace(/\.plumeasset$/, ''),
                                textureAssetId: asset.id
                            },
                        }));
                    }
                }
            } catch (e) {
                console.error('Failed to parse drop data', e);
            }
        }
    }, [reactFlowInstance, reactFlowWrapper, setNodes]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex' }} onKeyDown={onKeyDown} tabIndex={0} onMouseMove={onMouseMove}>
            {/* Sidebar */}
            <div style={{ width: '300px', background: theme.colors.bg.secondary, borderRight: `1px solid ${theme.colors.border.default}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '250px', borderBottom: `1px solid ${theme.colors.border.default}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.colors.bg.primary, position: 'relative' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #666, #111)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}></div>
                    <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '10px', color: theme.colors.text.muted, textTransform: 'uppercase', fontWeight: 'bold' }}>Preview</div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ fontSize: '12px', color: theme.colors.text.muted, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '16px' }}>Details</div>
                        {selectedNodes.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', color: theme.colors.text.muted, opacity: 0.7, textAlign: 'center' }}>
                                <span>Select a node to view details</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedNodes.map(node => (
                                    <div key={node.id} style={{ paddingBottom: '16px', borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
                                        <div style={{ color: theme.colors.accent.primary, fontWeight: 'bold', marginBottom: '8px' }}>{node.data.label || node.type}</div>
                                        {/* Node Specific Editors - keeping inline for now as they are simple */}
                                        {node.type === 'comment' && (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                    <label style={{ color: theme.colors.text.secondary }}>Name</label>
                                                    <input value={node.data.label || ''} onChange={(e) => handleNodeDataChange(node.id, 'label', e.target.value)} style={{ background: theme.colors.bg.tertiary, border: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.primary, padding: '4px 8px', borderRadius: '4px', outline: 'none', fontSize: '12px', textAlign: 'left', flex: 1 }} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                                    <div style={{ color: theme.colors.text.secondary }}>Color:</div>
                                                    <div style={{ width: '20px', height: '20px', background: node.data.color || theme.colors.accent.primary, border: `1px solid ${theme.colors.border.subtle}`, cursor: 'pointer', borderRadius: '4px' }} onClick={() => {
                                                        const input = document.createElement('input'); input.type = 'color'; input.value = node.data.color || theme.colors.accent.primary;
                                                        input.onchange = (e) => handleNodeDataChange(node.id, 'color', (e.target as HTMLInputElement).value); input.click();
                                                    }}></div>
                                                </div>
                                            </>
                                        )}
                                        {node.type === 'color' && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ color: theme.colors.text.secondary }}>Color:</div>
                                                <div style={{ width: '20px', height: '20px', background: node.data.color, border: `1px solid ${theme.colors.border.subtle}`, cursor: 'pointer', borderRadius: '4px' }} onClick={() => {
                                                    const input = document.createElement('input'); input.type = 'color'; input.value = node.data.color;
                                                    input.onchange = (e) => handleNodeDataChange(node.id, 'color', (e.target as HTMLInputElement).value); input.click();
                                                }}></div>
                                            </div>
                                        )}
                                        {node.type === 'texture' && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <label style={{ color: theme.colors.text.secondary }}>Texture</label>
                                                <select value={node.data.textureAssetId || ''} onChange={(e) => handleNodeDataChange(node.id, 'textureAssetId', e.target.value)} style={{ width: '100%', background: theme.colors.bg.tertiary, border: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.primary, padding: '4px 8px', borderRadius: '4px', outline: 'none', fontSize: '12px', appearance: 'none', cursor: 'pointer' }}>
                                                    <option value="">Select a texture...</option>
                                                    {availableTextures.map(tex => (
                                                        <option key={tex.id} value={tex.id}>{tex.name.replace('.plumeasset', '')}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Canvas */}
            <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={handleDrop}
            >
                <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                    <defs>
                        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={theme.colors.accent.secondary} />
                            <stop offset="20%" stopColor={theme.colors.text.secondary} />
                            <stop offset="80%" stopColor={theme.colors.text.secondary} />
                            <stop offset="100%" stopColor={theme.colors.accent.secondary} />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="flex-1" style={{ height: '100%' }}>
                    <ReactFlow
                        id={assetId}
                        className={!isInteractive ? "locked-interaction" : ""}
                        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                        onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
                        onConnect={onConnect}
                        onEdgeUpdate={onEdgeUpdate} onEdgeUpdateStart={onEdgeUpdateStart} onEdgeUpdateEnd={onEdgeUpdateEnd}
                        onConnectStart={onConnectStart} onConnectEnd={onConnectEnd}
                        onPaneClick={onPaneClick} onNodeClick={onPaneClick}
                        onPaneContextMenu={onPaneContextMenu} onNodeContextMenu={onNodeContextMenu}
                        onInit={setReactFlowInstance}
                        fitView proOptions={{ hideAttribution: true }}
                        style={{ backgroundColor: theme.colors.bg.primary }}
                        panOnDrag={[2]} selectionOnDrag={true} panOnScroll={false} zoomOnScroll={true}
                        selectionMode={SelectionMode.Partial}
                        multiSelectionKeyCode={['Control', 'Shift', 'Meta']}
                        selectionKeyCode={null} deleteKeyCode="Delete"
                        connectionLineStyle={{ strokeDasharray: '5 5' }}
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
                                theme={theme} onSave={handleSave} onFitView={handleFitView} onLock={handleLock}
                                onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
                                isDirty={isDirty} isInteractive={isInteractive} isSaving={isSaving}
                                isFitting={isFitting} isLocking={isLocking} isZoomingIn={isZoomingIn} isZoomingOut={isZoomingOut}
                            />
                        </Panel>
                    </ReactFlow>
                </div>

                {menu && menu.isOpen && <NodeSearchMenu x={menu.x} y={menu.y} onSelect={onNodeSelect} onClose={closeMenu} />}
                {nodeMenu && <NodeContextMenu x={nodeMenu.x} y={nodeMenu.y} node={nodeMenu.node} selectedNodes={selectedNodes} onClose={closeMenu} onDelete={(id) => deleteNodes([id])} onDuplicate={duplicateNode => duplicateNodes(selectedNodes.length > 0 ? selectedNodes : [duplicateNode])} onComment={createComment} onRename={(id) => startRename(id)} />}

                <div className="h-8 border-t flex items-center px-4 text-xs" style={{ backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.border.default, color: theme.colors.text.secondary }}>
                    <span>Path: {assetId}</span>
                </div>
            </div>
        </div>
    );
};
