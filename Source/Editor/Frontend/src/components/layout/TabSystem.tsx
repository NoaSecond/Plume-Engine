import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { X, Box, Globe, Image as ImageIcon, Music, File, Layers, Bone, Film, Settings, Package, Plug, Folder, Terminal, FileCode } from 'lucide-react';

export interface Tab {
    id: string;
    title: string;
    type: 'scene' | 'static-mesh' | 'texture' | 'sound' | 'material' | 'level' | 'skeletal-mesh' | 'animation-sequence' | 'editor-preferences' | 'project-settings' | 'plugin-manager' | 'content-browser' | 'console';
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
    const [dropIndicator, setDropIndicator] = useState<number | null>(null);

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
            case 'content-browser': return <Folder size={14} className="mr-2" />;
            case 'console': return <Terminal size={14} className="mr-2" />;
            default: return <File size={14} className="mr-2" />;
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Create a ghost image if needed, or rely on browser default
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        if (draggedIndex === null || draggedIndex === index) return;

        // Calculate if we represent dropping before or after this tab
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;

        if (e.clientX < midPoint) {
            setDropIndicator(index);
        } else {
            setDropIndicator(index + 1);
        }
    };

    const handleDragLeave = () => {
        // Optional: debounce this or verify we actually left the container
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        if (draggedIndex === null || dropIndicator === null) {
            // Cleanup handled by dragEnd, but checking here doesn't hurt
            return;
        }

        // Adjust index if we are moving forward/backward
        let toIndex = dropIndicator;
        if (draggedIndex < toIndex) {
            toIndex -= 1;
        }

        if (onReorder && draggedIndex !== toIndex) {
            onReorder(draggedIndex, toIndex);
        }
        // State cleanup will be handled by onDragEnd
    };

    return (
        <div
            className="flex items-end w-full h-8 select-none overflow-x-auto overflow-y-hidden" // Reduced height
            style={{
                backgroundColor: theme.colors.bg.secondary,
                borderBottom: `1px solid ${theme.colors.border.default}`
            }}
            onDragLeave={() => setDropIndicator(null)}
        >
            {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const showIndicatorLeft = dropIndicator === index;
                const showIndicatorRight = dropIndicator === index + 1 && index === tabs.length - 1; // Last item special case? Actually handling logic covers index+1

                return (
                    <div key={tab.id} className="relative flex h-full">
                        {/* Visual Drop Indicator Left */}
                        {dropIndicator === index && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 z-50 animate-pulse pointer-events-none" style={{ backgroundColor: theme.colors.accent.primary }} />
                        )}

                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={handleDrop}
                            onClick={() => onTabClick(tab.id)}
                            className={`relative h-full flex items-center px-3 min-w-[100px] max-w-[180px] cursor-pointer group text-[10px] border-r transition-colors ${draggedIndex === index ? 'opacity-50' : ''}`}
                            style={{
                                backgroundColor: isActive ? theme.colors.bg.primary : 'transparent',
                                color: isActive ? theme.colors.accent.primary : theme.colors.text.muted,
                                borderColor: theme.colors.border.default,
                                borderTop: isActive ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent'
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

                        {/* Visual Drop Indicator Right (for last item only mostly, or we render indicators uniformly) */}
                        {showIndicatorRight && (
                            <div className="absolute right-0 top-0 bottom-0 w-0.5 z-50 animate-pulse pointer-events-none" style={{ backgroundColor: theme.colors.accent.primary }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
