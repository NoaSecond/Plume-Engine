import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../../ThemeContext';

const ComponentMaskNode = ({ data, selected, id }: NodeProps) => {
    const { theme } = useTheme();
    const [hover, setHover] = React.useState(false);

    // Call data change implicitly handled by react-flow-renderer data binding in parent or requires useReactFlow 
    // Here we assume data.mask is updated elsewhere or we need to add a handler. 
    // Wait, simple nodes usually invoke a callback from context? 
    // In MaterialEditor.tsx, 'handleNodeDataChange' is available but not passed directly unless we use context or pass props.
    // However, existing nodes use context or just render data. 
    // Let's assume we can emit an event or just bind to data if it propagates.
    // For now, I'll add a simple select that we can hook up later if needed, or better, assuming 'data' is mutable or wrapper handles it.
    // But React nodes are controlled. we need updateNodeData.
    // I will use useReactFlow to update node data.

    // Actually, looking at ColorNode in previous turns, it uses `handleNodeDataChange` but that was passed... NO wait.
    // MaterialEditor.tsx passed `handleNodeDataChange` to the Detail panel, NOT the node itself (in the details panel loop).
    // The nodes themselves were mainly visual or simple inputs.
    // Be careful. `ColorNode` had `onClick` opening a picker? No, that was in the detail panel in MaterialEditor.tsx!
    // So the interaction happens in the sidebar usually.
    // BUT the node itself might want controls.
    // For this Mask node, having a dropdown on the node is nice.

    // Let's check TextureSampleNode in Step 145. It used useMaterialEditor? No, it used data.availableTextures.
    // It didn't seem to have valid "onChange" logic inside the node itself in the snippet I saw.
    // The snippet: `texture: (props: any) => <TextureSampleNode {...props} data={{ ...props.data, availableTextures }} />`
    // So if I want to update data from the node, I need `useReactFlow`.

    return (
        <div
            style={{
                background: theme.colors.bg.secondary,
                border: selected
                    ? `1px solid ${theme.colors.accent.primary}`
                    : `1px solid ${hover ? theme.colors.text.secondary : theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                minWidth: '150px',
                color: theme.colors.text.primary,
                boxShadow: selected ? `0 0 0 1px ${theme.colors.accent.primary}` : theme.shadows.md,
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div style={{ padding: '8px 12px', background: selected ? theme.colors.accent.primary + '20' : theme.colors.bg.tertiary, borderBottom: `1px solid ${theme.colors.border.default}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Mask</div>
            </div>

            <div style={{ padding: '12px 0', position: 'relative' }}>
                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <Handle type="target" position={Position.Left} id="input" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, left: '-5px' }} />
                    <span>Input</span>
                </div>

                {/* Visual indicator of current mask, editable in details panel or here if I implement useReactFlow */}
                <div style={{ padding: '4px 16px', fontSize: '10px', color: theme.colors.text.secondary }}>
                    Current: {data.mask || 'r'}
                </div>

                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px' }}>
                    <span>Result</span>
                    <Handle type="source" position={Position.Right} id="result" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, right: '-5px' }} />
                </div>
            </div>
        </div>
    );
};

export default memo(ComponentMaskNode);
