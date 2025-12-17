import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../ThemeContext';

const INPUTS = [
    { id: 'base-color', label: 'Base Color' },
    { id: 'metallic', label: 'Metallic' },
    { id: 'specular', label: 'Specular' },
    { id: 'roughness', label: 'Roughness' },
    { id: 'anisotropy', label: 'Anisotropy' },
    { id: 'emissive', label: 'Emissive Color' },
    { id: 'opacity', label: 'Opacity' },
    { id: 'normal', label: 'Normal' },
    { id: 'ambient-occlusion', label: 'Ambient Occlusion' },
];

const ResultNode = ({ data, selected }: NodeProps) => {
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
                    background: selected ? theme.colors.accent.primary + '20' : theme.colors.bg.tertiary, // transparent accent
                    borderBottom: `1px solid ${theme.colors.border.default}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.text.secondary, textTransform: 'uppercase' }}>
                    Result Node
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {data.materialName || 'Material'}
                </div>
            </div>

            {/* Inputs Body */}
            <div style={{ padding: '12px 0' }}>
                {INPUTS.map((input) => (
                    <div
                        key={input.id}
                        style={{
                            position: 'relative',
                            padding: '6px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px',
                        }}
                    >
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.id}
                            style={{
                                width: '10px',
                                height: '10px',
                                background: theme.colors.text.secondary,
                                left: '-5px',
                            }}
                        />
                        <span>{input.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(ResultNode);
