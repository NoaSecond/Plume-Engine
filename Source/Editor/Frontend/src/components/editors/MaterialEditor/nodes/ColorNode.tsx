import React, { memo, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../../ThemeContext';

const ColorNode = ({ data, id, selected }: NodeProps) => {
    const { theme } = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);
    const [hover, setHover] = React.useState(false);

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        // In a real app, we would update the node data here to persist the color
        data.color = hex;
        // Also trigger any update callbacks if provided in data
        if (data.onChange) data.onChange(id, { ...data, color: hex });
    }, [data, id]);

    const handleSquareClick = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    }, []);

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
            {/* Header */}
            <div
                style={{
                    padding: '4px 8px',
                    background: selected ? theme.colors.accent.primary + '20' : theme.colors.bg.tertiary,
                    borderBottom: `1px solid ${theme.colors.border.default}`,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.colors.text.secondary,
                    textTransform: 'uppercase',
                }}
            >
                {data.label || 'Color'}
            </div>

            {/* Body */}
            <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
                <div
                    onClick={handleSquareClick}
                    style={{
                        width: '100%',
                        height: '40px',
                        backgroundColor: data.color || '#ffffff',
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
                    }}
                    title="Click to change color"
                />
                <input
                    ref={inputRef}
                    type="color"
                    value={data.color || '#ffffff'}
                    onChange={handleColorChange}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: '10px',
                    height: '10px',
                    background: theme.colors.text.secondary,
                    right: '-5px',
                }}
            />
        </div>
    );
};

export default memo(ColorNode);
