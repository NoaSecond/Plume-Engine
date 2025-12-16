import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../ThemeContext';

const TextureNode = ({ data, selected }: NodeProps) => {
    const { theme } = useTheme();
    const [hover, setHover] = React.useState(false);

    const outputs = [
        { id: 'rgb', label: 'RGB' },
        { id: 'r', label: 'R' },
        { id: 'g', label: 'G' },
        { id: 'b', label: 'B' },
        { id: 'a', label: 'A' },
    ];

    return (
        <div
            style={{
                background: theme.colors.bg.secondary,
                border: selected
                    ? `1px solid ${theme.colors.accent.primary}`
                    : `1px solid ${hover ? theme.colors.text.secondary : theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                minWidth: '200px',
                color: theme.colors.text.primary,
                boxShadow: selected ? `0 0 0 1px ${theme.colors.accent.primary}` : theme.shadows.md,
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Header */}
            <div
                style={{
                    padding: '8px 12px',
                    background: selected ? theme.colors.accent.primary + '20' : theme.colors.bg.tertiary,
                    borderBottom: `1px solid ${theme.colors.border.default}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {data.label}
                </div>
            </div>

            {/* Inputs Body */}
            <div style={{ padding: '12px 0', display: 'flex' }}>
                {/* Inputs Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        position: 'relative',
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px',
                    }}>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="uvs"
                            style={{
                                width: '10px',
                                height: '10px',
                                background: theme.colors.text.secondary,
                                left: '-5px',
                            }}
                        />
                        <span>UVs</span>
                    </div>
                </div>

                {/* Outputs Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {outputs.map(output => (
                        <div key={output.id} style={{
                            position: 'relative',
                            padding: '6px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px',
                        }}>
                            <span>{output.label}</span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={output.id}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    background: theme.colors.text.secondary,
                                    right: '-5px',
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(TextureNode);
