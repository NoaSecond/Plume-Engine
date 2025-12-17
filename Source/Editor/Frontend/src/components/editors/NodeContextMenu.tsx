import React from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { Node } from 'reactflow';

interface NodeContextMenuProps {
    x: number;
    y: number;
    node: Node;
    onClose: () => void;
    onDelete: (id: string) => void;
    onDuplicate: (node: Node) => void;
    onComment: (nodes: Node[]) => void;
    onRename: (id: string) => void;
    selectedNodes: Node[];
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    x, y, node, onClose, onDelete, onDuplicate, onComment, onRename, selectedNodes
}) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const isResultNode = node.type === 'result';
    const isCommentNode = node.type === 'comment';

    return (
        <div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 10001,
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                boxShadow: theme.shadows.lg,
                minWidth: '150px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '4px 0'
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div style={{ padding: '4px 12px', fontSize: '10px', color: theme.colors.text.muted, textTransform: 'uppercase' }}>
                {node.data.label || t('material.node_actions')}
            </div>

            <div style={{ height: '1px', background: theme.colors.border.subtle, margin: '4px 0' }}></div>

            {isCommentNode && (
                <MenuItem label={t('material.rename')} onClick={() => { onRename(node.id); onClose(); }} theme={theme} />
            )}

            {!isCommentNode && (
                <MenuItem label={t('material.comment')} onClick={() => onComment(selectedNodes.length > 0 ? selectedNodes : [node])} theme={theme} />
            )}

            {!isResultNode && (
                <>
                    <div style={{ height: '1px', background: theme.colors.border.subtle, margin: '4px 0' }}></div>
                    <MenuItem label={t('material.copy')} onClick={() => { /* Clipboard logic */ onClose(); }} theme={theme} />
                    <MenuItem label={t('material.duplicate')} onClick={() => onDuplicate(node)} theme={theme} />
                    <MenuItem label={t('material.delete')} onClick={() => onDelete(node.id)} theme={theme} danger />
                </>
            )}
        </div>
    );
};

const MenuItem = ({ label, onClick, theme, danger = false }: any) => (
    <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
            padding: '8px 12px',
            fontSize: '12px',
            color: danger ? theme.colors.status.error : theme.colors.text.primary,
            cursor: 'pointer',
            transition: 'background 0.1s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = danger ? theme.colors.status.error + '20' : theme.colors.bg.tertiary}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        {label}
    </div>
);
