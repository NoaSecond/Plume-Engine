import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';
import { useTheme } from '../../../ThemeContext';

const CommentNode = ({ id, data, selected }: NodeProps) => {
    const { theme } = useTheme();
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(data.isEditing || false);
    const [label, setLabel] = useState(data.label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLabel(data.label);
    }, [data.label]);

    useEffect(() => {
        setIsEditing(!!data.isEditing);
    }, [data.isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleEdit = (editing: boolean) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, isEditing: editing, label: editing ? label : node.data.label } };
            }
            return node;
        }));
    };

    const handleSubmit = () => {
        setIsEditing(false);
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, label, isEditing: false } };
            }
            return node;
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent ReactFlow from intercepting keys like Ctrl+A, Backspace, Delete, etc.
        e.stopPropagation();

        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <>
            <NodeResizer
                minWidth={100}
                minHeight={50}
                isVisible={selected}
                lineStyle={{ border: `1px solid ${data.color || theme.colors.accent.primary}` }}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%', background: data.color || theme.colors.accent.primary }}
            />
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    background: data.color ? `${data.color}20` : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selected ? (data.color || theme.colors.accent.primary) : (data.color ? `${data.color}40` : 'rgba(255, 255, 255, 0.1)')}`,
                    borderRadius: theme.borderRadius.md,
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'all',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '4px 8px',
                        background: data.color ? `${data.color}40` : 'rgba(255, 255, 255, 0.1)',
                        borderBottom: `1px solid ${data.color ? `${data.color}40` : 'rgba(255, 255, 255, 0.05)'}`,
                        color: theme.colors.text.primary,
                        fontWeight: 600,
                        fontSize: '14px',
                        borderTopLeftRadius: theme.borderRadius.md,
                        borderTopRightRadius: theme.borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '28px'
                    }}
                    onDoubleClick={() => handleEdit(true)}
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onBlur={handleSubmit}
                            onKeyDown={handleKeyDown}
                            style={{
                                background: theme.colors.bg.tertiary,
                                border: 'none',
                                color: theme.colors.text.primary,
                                width: '100%',
                                fontSize: '14px',
                                outline: 'none',
                                borderRadius: '2px',
                                padding: '0 4px'
                            }}
                        />
                    ) : (
                        <>
                            <span>{data.label || 'Comment'}</span>
                            {selected && (
                                <div
                                    onClick={() => handleEdit(true)}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7,
                                        padding: '2px'
                                    }}
                                    className="hover:opacity-100"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {/* Body */}
                <div style={{ flex: 1 }}></div>
            </div>
        </>
    );
};

export default memo(CommentNode);
