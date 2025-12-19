import React, { useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getAssetDefinition } from '../../../utils/AssetUtils';
import { useTheme } from '../../../ThemeContext';

interface FolderTreeProps {
    nodes: any[]; // The list of nodes to render (children of the parent)
    currentPath: string; // Used to highlight current selection
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    setCurrentPath: (path: string) => void;
    setSelectedIds: (ids: Set<string>) => void;
    setLastSelectedId: (id: string) => void;
    openFolder: (node: any) => void;
    onOpenAsset?: (node: any) => void;
    setCtxX: (x: number) => void;
    setCtxY: (y: number) => void;
    setCtxType: (type: 'folder' | 'asset' | 'empty') => void;
    setCtxTarget: (target: any) => void;
    setCtxVisible: (visible: boolean) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = (props) => {
    // We can render a list of root nodes if provided, or just recursive
    // But standard usage is recursive TreeNode
    return (
        <div className="pl-4 space-y-1">
            {props.nodes.map(node => (
                <TreeNode key={node.id} node={node} depth={0} {...props} />
            ))}
        </div>
    );
};

const TreeNode: React.FC<{ node: any; depth: number } & Omit<FolderTreeProps, 'nodes'>> = ({ node, depth, ...props }) => {
    const { theme } = useTheme();
    const isExpanded = props.expandedIds.has(node.id);

    // Filter children for display in tree
    const visibleChildren = useMemo(() => {
        if (!node.children) return [];
        const hidden = new Set<string>();
        node.children.forEach((c: any) => {
            const meta = c.meta as any;
            if (c.name.endsWith('.plumeasset') && meta?.source) hidden.add(meta.source);
        });
        return node.children.filter((c: any) =>
            !hidden.has(c.name) &&
            c.name !== '.plume_meta' &&
            !c.name.endsWith('.plume_meta')
        );
    }, [node.children]);

    const childrenRef = useRef<HTMLDivElement | null>(null);

    // Animation effect for expansion
    useEffect(() => {
        const el = childrenRef.current;
        if (!el) return;
        try {
            if (isExpanded) {
                const h = el.scrollHeight;
                el.style.maxHeight = h + 'px';
                el.style.opacity = '1';
            } else {
                el.style.maxHeight = '0px';
                el.style.opacity = '0';
            }
        } catch (e) {
            // Element might operate in a detached state or during rapid updates
        }
    }, [isExpanded, visibleChildren]);

    const getIcon = () => {
        const type = node.type ? node.type.toLowerCase() : '';
        const name = node.name ? node.name.toLowerCase() : '';
        const { Icon, color } = getAssetDefinition(type, name, node.meta?.color, theme);
        return <Icon size={14} color={color} stroke={color} fill="none" strokeWidth={type === 'folder' ? 1.5 : 2} />;
    };

    return (
        <div>
            <div
                className="flex items-center text-xs rounded px-1 py-0.5 cursor-pointer"
                style={{
                    color: props.currentPath === node.path ? theme.colors.text.primary : theme.colors.text.secondary,
                    backgroundColor: props.currentPath === node.path ? theme.colors.bg.elevated : 'transparent',
                    border: props.currentPath === node.path ? `1px solid ${theme.colors.accent.primary}` : undefined,
                    paddingLeft: 8 + depth * 12
                }}
                onClick={() => {
                    props.setSelectedIds(new Set([node.id]));
                    props.setLastSelectedId(node.id);
                    // Only change path and load content for folders
                    if (node.type === 'folder') {
                        props.setCurrentPath(node.path || node.name);
                        const __webview = (window as any).chrome?.webview;
                        if (__webview) __webview.postMessage({ action: 'list-content', path: node.path || node.name });
                    }
                }}
                onDoubleClick={() => {
                    // Only open folders, not files
                    if (node.type === 'folder') {
                        props.openFolder(node);
                    } else {
                        if (props.onOpenAsset) props.onOpenAsset(node);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    props.setCtxX(e.clientX);
                    props.setCtxY(e.clientY);
                    props.setCtxType(node.type === 'folder' ? 'folder' : 'asset');
                    props.setCtxTarget(node);
                    props.setCtxVisible(true);
                }}
            >
                <div onClick={(e) => { e.stopPropagation(); props.toggleExpand(node.id); }} style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {visibleChildren && visibleChildren.length > 0 ? (
                        isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : (
                        <span style={{ display: 'inline-block', width: 12 }} />
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, minWidth: 14, flexShrink: 0, marginRight: 8 }}>
                    {getIcon()}
                </div>

                <span style={{
                    fontWeight: props.currentPath === (node.path || node.name) ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0
                }}
                    title={node.name}
                >
                    {node.name.includes('.') ? node.name.substring(0, node.name.lastIndexOf('.')) : node.name}
                </span>
            </div>
            <div ref={childrenRef} style={{
                maxHeight: isExpanded ? undefined : 0,
                overflow: 'hidden',
                transition: 'max-height 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms ease',
                opacity: isExpanded ? 1 : 0
            }}>
                {visibleChildren.map((c: any) => (
                    <TreeNode key={c.id} node={c} depth={depth + 1} {...props} />
                ))}
            </div>
        </div>
    );
};
