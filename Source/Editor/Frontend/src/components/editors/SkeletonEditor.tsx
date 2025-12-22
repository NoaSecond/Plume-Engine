import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { ChevronRight, ChevronDown, Bone, Circle } from 'lucide-react';

interface SkeletonEditorProps {
    assetId: string;
    name: string;
    isActive: boolean;
}

// Mock Tree Data
const mockSkeleton = {
    id: 'root',
    name: 'Root',
    type: 'bone',
    children: [
        {
            id: 'pelvis',
            name: 'Pelvis',
            type: 'bone',
            children: [
                {
                    id: 'spine_01',
                    name: 'Spine_01',
                    type: 'bone',
                    children: [
                        { id: 'spine_02', name: 'Spine_02', type: 'bone', children: [] },
                        { id: 'clavicle_l', name: 'Clavicle_L', type: 'bone', children: [] },
                        { id: 'clavicle_r', name: 'Clavicle_R', type: 'bone', children: [] }
                    ]
                },
                { id: 'thigh_l', name: 'Thigh_L', type: 'bone', children: [] },
                { id: 'thigh_r', name: 'Thigh_R', type: 'bone', children: [] }
            ]
        }
    ]
};

const TreeNode = ({ node, level, selectedId, onSelect, theme }: any) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div className="select-none">
            <div
                className="flex items-center py-1 px-2 cursor-pointer hover:bg-white/5 transition-colors"
                style={{
                    paddingLeft: `${level * 16 + 8}px`,
                    backgroundColor: isSelected ? theme.colors.selection.background : 'transparent',
                    color: isSelected ? '#fff' : theme.colors.text.primary
                }}
                onClick={() => onSelect(node.id)}
            >
                <div
                    className="mr-1 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {hasChildren ? (
                        expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : <span className="w-3 h-3 block" />}
                </div>
                {node.type === 'bone' ? <Bone size={12} className="mr-2 opacity-70" /> : <Circle size={10} className="mr-2 opacity-70" />}
                <span className="text-xs">{node.name}</span>
            </div>
            {expanded && hasChildren && (
                <div>
                    {node.children.map((child: any) => (
                        <TreeNode key={child.id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const SkeletonEditor: React.FC<SkeletonEditorProps> = ({ assetId, name, isActive }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);

    return (
        <div className="flex flex-col w-full h-full" style={{ backgroundColor: theme.colors.bg.primary, color: theme.colors.text.primary }}>
            {/* Main Area: 3 Columns */}
            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar: Skeleton Tree */}
                <div className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                    <div className="p-3 border-b font-medium text-xs uppercase tracking-wider" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.muted }}>
                        Skeleton Tree
                    </div>
                    <div className="flex-1 overflow-y-auto py-2">
                        <TreeNode node={mockSkeleton} level={0} selectedId={selectedBoneId} onSelect={setSelectedBoneId} theme={theme} />
                    </div>
                </div>

                {/* Center: Viewport */}
                <div className="flex-1 relative bg-black/20 flex items-center justify-center min-w-0">
                    <p className="text-sm opacity-50">3D Viewport Placeholder</p>
                    <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-xs backdrop-blur-sm">
                        {name}
                    </div>
                </div>

                {/* Right Sidebar: Details */}
                <div className="w-80 flex flex-col border-l shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                    <div className="p-3 border-b font-medium text-xs uppercase tracking-wider" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.muted }}>
                        Details
                    </div>
                    <div className="p-4 space-y-4">
                        {selectedBoneId ? (
                            <>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Bone Name</label>
                                    <div className="text-sm p-2 rounded border" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                        {selectedBoneId}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Transform properties would go here.
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-center opacity-50 italic mt-10">
                                Select a bone to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: Asset Path */}
            <div
                className="h-8 border-t flex items-center px-4 text-xs shrink-0"
                style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.secondary
                }}
            >
                <span>{t('asset.path').replace('{path}', assetId)}</span>
            </div>
        </div>
    );
};
