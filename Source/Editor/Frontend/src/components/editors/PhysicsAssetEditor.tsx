import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { ChevronRight, ChevronDown, Box, Circle, Minimize2 } from 'lucide-react';

interface PhysicsAssetEditorProps {
    assetId: string;
    name: string;
    isActive: boolean;
}

// Mock Physics Tree Data (Bodies associated with bones)
const mockPhysicsTree = {
    id: 'root',
    name: 'Root',
    type: 'body',
    shape: 'box',
    children: [
        {
            id: 'pelvis',
            name: 'Pelvis',
            type: 'body',
            shape: 'capsule',
            children: [
                {
                    id: 'spine_01',
                    name: 'Spine_01',
                    type: 'body',
                    shape: 'capsule',
                    children: []
                },
                { id: 'thigh_l', name: 'Thigh_L', type: 'body', shape: 'capsule', children: [] },
                { id: 'thigh_r', name: 'Thigh_R', type: 'body', shape: 'capsule', children: [] }
            ]
        }
    ]
};

const TreeNode = ({ node, level, selectedId, onSelect, theme }: any) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    const getIcon = (shape: string) => {
        if (shape === 'box') return <Box size={12} className="mr-2 opacity-70" />;
        if (shape === 'capsule') return <Circle size={12} className="mr-2 opacity-70" />; // Proxy for capsule
        return <Minimize2 size={12} className="mr-2 opacity-70" />;
    };

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
                {getIcon(node.shape)}
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

export const PhysicsAssetEditor: React.FC<PhysicsAssetEditorProps> = ({ assetId, name, isActive }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);

    return (
        <div className="flex flex-col w-full h-full" style={{ backgroundColor: theme.colors.bg.primary, color: theme.colors.text.primary }}>
            {/* Main Content: Sidebar + Viewport + Details */}
            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar: Physics Tree */}
                <div className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                    <div className="p-3 border-b font-medium text-xs uppercase tracking-wider" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.muted }}>
                        Physics Bodies
                    </div>
                    <div className="flex-1 overflow-y-auto py-2">
                        <TreeNode node={mockPhysicsTree} level={0} selectedId={selectedBodyId} onSelect={setSelectedBodyId} theme={theme} />
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
                        {selectedBodyId ? (
                            <>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Body Name</label>
                                    <div className="text-sm p-2 rounded border" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                        {selectedBodyId}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-bold mt-4 mb-2 opacity-80">Physics Properties</div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span style={{ color: theme.colors.text.secondary }}>Mass (kg)</span>
                                        <input type="number" defaultValue={10} className="w-20 p-1 rounded border bg-transparent text-right" style={{ borderColor: theme.colors.border.default }} />
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span style={{ color: theme.colors.text.secondary }}>Linear Damping</span>
                                        <input type="number" defaultValue={0.1} className="w-20 p-1 rounded border bg-transparent text-right" style={{ borderColor: theme.colors.border.default }} />
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span style={{ color: theme.colors.text.secondary }}>Angular Damping</span>
                                        <input type="number" defaultValue={0.1} className="w-20 p-1 rounded border bg-transparent text-right" style={{ borderColor: theme.colors.border.default }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-bold mt-4 mb-2 opacity-80">Collision</div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span style={{ color: theme.colors.text.secondary }}>Collision Response</span>
                                        <select className="w-32 p-1 rounded border bg-transparent" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.primary }}>
                                            <option>BlockAll</option>
                                            <option>OverlapAll</option>
                                            <option>PhysicsActor</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-center opacity-50 italic mt-10">
                                Select a body to view properties
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
