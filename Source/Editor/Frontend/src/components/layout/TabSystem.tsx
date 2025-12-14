import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { X, Box, Globe, Image as ImageIcon, Music, File, Layers, Bone, Film, Settings, Package, Plug } from 'lucide-react';

export interface Tab {
    id: string;
    title: string;
    type: 'scene' | 'static-mesh' | 'texture' | 'sound' | 'material' | 'level' | 'skeletal-mesh' | 'animation-sequence' | 'editor-preferences' | 'project-settings' | 'plugin-manager';
    data?: any; // e.g. entityId or filename
    closable: boolean;
}

interface TabSystemProps {
    tabs: Tab[];
    activeTabId: string;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    children?: React.ReactNode;
}

export const TabSystem: React.FC<TabSystemProps> = ({ tabs, activeTabId, onTabClick, onTabClose, onReorder }) => {
    const { theme } = useTheme();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const getIcon = (type: string) => {
        switch (type) {
            case 'scene': return <Globe size={14} className="mr-2" />;
            case 'static-mesh': return <Box size={14} className="mr-2" />;
            case 'texture': return <ImageIcon size={14} className="mr-2" />;
            case 'sound': return <Music size={14} className="mr-2" />;
            case 'material': return <Layers size={14} className="mr-2" />;
            case 'level': return <Globe size={14} className="mr-2" />;
            case 'skeletal-mesh': return <Bone size={14} className="mr-2" />;
            case 'animation-sequence': return <Film size={14} className="mr-2" />;
            case 'editor-preferences': return <Settings size={14} className="mr-2" />;
            case 'project-settings': return <Package size={14} className="mr-2" />;
            case 'plugin-manager': return <Plug size={14} className="mr-2" />;
            default: return <File size={14} className="mr-2" />;
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        if (onReorder) {
            onReorder(draggedIndex, dropIndex);
        }
        setDraggedIndex(null);
    };

    return (
        <div
            className="flex items-end w-full h-8 select-none" // Reduced height
            style={{
                backgroundColor: theme.colors.bg.secondary,
                borderBottom: `1px solid ${theme.colors.border.default}`
            }}
        >
            {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => onTabClick(tab.id)}
                        className={`relative h-full flex items-center px-3 min-w-[100px] max-w-[180px] cursor-pointer group text-[10px] border-r transition-colors`}
                        style={{
                            backgroundColor: isActive ? theme.colors.bg.primary : 'transparent',
                            color: isActive ? theme.colors.accent.primary : theme.colors.text.muted,
                            borderColor: theme.colors.border.default,
                            borderTop: isActive ? `2px solid ${theme.colors.accent.primary} ` : '2px solid transparent'
                        }}
                    >
                        {getIcon(tab.type)}
                        <span className="truncate flex-1 mr-2">{tab.title}</span>
                        {tab.closable && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
                                style={{ color: theme.colors.text.muted }}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
