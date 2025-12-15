import React, { useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from '../../ThemeContext';

interface MaterialEditorProps {
    assetId: string;
    name: string;
}

const initialNodes: Node[] = [
    {
        id: '1',
        data: { label: 'Result Node' },
        position: { x: 400, y: 100 },
        type: 'output',
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #777' },
    },
    {
        id: '2',
        data: { label: 'Base Color' },
        position: { x: 100, y: 100 },
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #777' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '2', target: '1', animated: true },
];

export const MaterialEditor: React.FC<MaterialEditorProps> = ({ assetId, name }) => {
    const { theme } = useTheme();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-1" style={{ height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    style={{ backgroundColor: theme.colors.bg.primary }}
                >
                    <style>
                        {`
                          .react-flow__controls {
                            background-color: ${theme.colors.bg.secondary} !important;
                            border: 1px solid ${theme.colors.border.default} !important;
                            border-radius: ${theme.borderRadius.sm} !important;
                            box-shadow: ${theme.shadows.sm} !important;
                          }
                          .react-flow__controls-button {
                            background-color: ${theme.colors.bg.secondary} !important;
                            border-bottom: 1px solid ${theme.colors.border.default} !important;
                            color: ${theme.colors.text.primary} !important;
                            width: 25px;
                            height: 25px;
                          }
                          .react-flow__controls-button:last-child {
                             border-bottom: none !important;
                          }
                          .react-flow__controls-button:hover {
                            background-color: ${theme.colors.bg.tertiary} !important;
                            color: ${theme.colors.accent.primary} !important;
                          }
                          .react-flow__controls-button svg {
                            fill: currentColor !important;
                          }
                        `}
                    </style>
                    <Background color="#555" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};
