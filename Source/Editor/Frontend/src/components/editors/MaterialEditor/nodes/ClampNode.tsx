import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../../ThemeContext';

const ClampNode = ({ data, selected }: NodeProps) => {
    const { theme } = useTheme();
    const [hover, setHover] = React.useState(false);

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
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Clamp</div>
            </div>

            <div style={{ padding: '12px 0', position: 'relative' }}>
                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <Handle type="target" position={Position.Left} id="input" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, left: '-5px' }} />
                    <span>Input</span>
                </div>
                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <Handle type="target" position={Position.Left} id="min" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, left: '-5px' }} />
                    <span>Min</span>
                </div>
                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <Handle type="target" position={Position.Left} id="max" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, left: '-5px' }} />
                    <span>Max</span>
                </div>
                <div style={{ position: 'relative', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px' }}>
                    <span>Result</span>
                    <Handle type="source" position={Position.Right} id="result" style={{ width: '10px', height: '10px', background: theme.colors.text.secondary, right: '-5px' }} />
                </div>
            </div>
        </div>
    );
};

export default memo(ClampNode);
