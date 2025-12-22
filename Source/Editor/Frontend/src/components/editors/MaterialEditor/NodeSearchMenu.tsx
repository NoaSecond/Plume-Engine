import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../ThemeContext';
import { useLanguage } from '../../../LanguageContext';

export interface NodeTypeItem {
    label: string;
    type: string; // ReactFlow node type
    category?: string;
    data?: any;
}

const AVAILABLE_NODES: NodeTypeItem[] = [
    { type: 'color', label: 'Color', category: 'Constants', data: { label: 'Color', color: '#ffffff' } },
    { type: 'texture', label: 'Texture Sample', category: 'Textures', data: { label: 'Texture' } },

    // Maths
    { type: 'add', label: 'Add', category: 'Maths', data: { label: 'Add' } },
    { type: 'multiply', label: 'Multiply', category: 'Maths', data: { label: 'Multiply' } },
    { type: 'subtract', label: 'Subtract', category: 'Maths', data: { label: 'Subtract' } },
    { type: 'divide', label: 'Divide', category: 'Maths', data: { label: 'Divide' } },
    { type: 'clamp', label: 'Clamp', category: 'Maths', data: { label: 'Clamp' } },
    { type: 'lerp', label: 'Lerp', category: 'Maths', data: { label: 'Lerp' } },
    { type: 'step', label: 'Step', category: 'Maths', data: { label: 'Step' } },
    { type: 'smoothstep', label: 'Smooth Step', category: 'Maths', data: { label: 'Smooth Step' } },
    { type: 'vector', label: 'Vector3', category: 'Constants', data: { label: 'Vector3' } },
    { type: 'mask', label: 'Component Mask', category: 'Utility', data: { label: 'Mask', mask: 'r' } },
];

interface NodeSearchMenuProps {
    x: number;
    y: number;
    onSelect: (item: NodeTypeItem) => void;
    onClose: () => void;
}

export const NodeSearchMenu: React.FC<NodeSearchMenuProps> = ({ x, y, onSelect, onClose }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredNodes = AVAILABLE_NODES.filter(node =>
        node.label.toLowerCase().includes(search.toLowerCase())
    );

    // Group by category
    const groupedNodes = filteredNodes.reduce((acc, node) => {
        const category = node.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(node);
        return acc;
    }, {} as Record<string, NodeTypeItem[]>);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 10000,
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                boxShadow: theme.shadows.lg,
                width: '250px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div style={{ padding: '8px', borderBottom: `1px solid ${theme.colors.border.default}` }}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t('material.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        background: theme.colors.bg.tertiary,
                        color: theme.colors.text.primary,
                        border: 'none',
                        outline: 'none',
                        padding: '4px 8px',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '12px'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredNodes.length > 0) {
                            onSelect(filteredNodes[0]);
                        }
                    }}
                />
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {Object.keys(groupedNodes).length === 0 ? (
                    <div style={{ padding: '8px', color: theme.colors.text.muted, fontSize: '12px', textAlign: 'center' }}>
                        {t('material.no_nodes')}
                    </div>
                ) : (
                    Object.entries(groupedNodes).map(([category, nodes]) => (
                        <div key={category}>
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                color: theme.colors.text.muted,
                                background: theme.colors.bg.tertiary
                            }}>
                                {t(`material.category.${category.toLowerCase()}`)}
                            </div>
                            {nodes.map((node) => (
                                <div
                                    key={node.type}
                                    onClick={() => onSelect(node)}
                                    style={{
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: theme.colors.text.primary,
                                        borderBottom: `1px solid ${theme.colors.border.subtle}`,
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.accent.primary + '20'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {node.label}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
