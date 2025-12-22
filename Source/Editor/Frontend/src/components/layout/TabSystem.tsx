import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { X, Globe, Settings, Package, Plug, Folder, Terminal } from 'lucide-react';
import { getAssetDefinition } from '../../utils/AssetUtils';

export interface Tab {
    id: string;
    title: string;
    type: 'scene' | 'static-mesh' | 'texture' | 'sound' | 'material' | 'material-editor' | 'level' | 'skeleton' | 'animation-sequence' | 'physics-asset' | 'editor-preferences' | 'project-settings' | 'plugin-manager' | 'content-browser' | 'console';
    data?: any; // e.g. entityId or filename
    closable: boolean;
    isDirty?: boolean;
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
        // Map tab types to asset types where possible
        // Tab types: 'scene', 'static-mesh', 'texture', 'sound', 'material', ...
        // Asset types: 'staticmesh', 'texture', 'soundwave', 'material', ...

        let assetType = type;
        if (type === 'static-mesh') assetType = 'staticmesh';
        if (type === 'skeleton') assetType = 'skeleton';
        if (type === 'animation-sequence') assetType = 'animationsequence';
        if (type === 'physics-asset') assetType = 'physicsasset';
        if (type === 'material-editor') assetType = 'material';
        if (type === 'scene') return <Globe size={14} className="mr-2" />; // Special case for Scene tab
        if (type === 'editor-preferences') return <Settings size={14} className="mr-2" />;
        if (type === 'project-settings') return <Package size={14} className="mr-2" />;
        if (type === 'plugin-manager') return <Plug size={14} className="mr-2" />;
        if (type === 'content-browser') return <Folder size={14} className="mr-2" />;
        if (type === 'console') return <Terminal size={14} className="mr-2" />;

        const { Icon, color } = getAssetDefinition(assetType, '', undefined, theme);
        return <Icon size={14} className="mr-2" color={color} />; // Tab icons usually don't need fill/stroke, just color? Or maybe inherit color.
        // Actually, tabs usually use current text color or accent color if active.
        // AssetUtils returns specific asset colors. 
        // Tabs often look better with the asset's color.
        // Let's use the color.
    };

    const hoverTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Create a ghost image if needed, or rely on browser default
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropIndicator(null);
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
    };

    const handleDragOver = (e: React.DragEvent, index: number, tabId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        // Internal Reorder Logic
        if (draggedIndex !== null) {
            if (draggedIndex === index) return;
            // Calculate if we represent dropping before or after this tab
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const midPoint = rect.left + rect.width / 2;

            if (e.clientX < midPoint) {
                setDropIndicator(index);
            } else {
                setDropIndicator(index + 1);
            }
            return;
        }

        // External Drag Logic (Drag-Hover to Switch)
        if (draggedIndex === null && activeTabId !== tabId) {
            // If we are already timing this tab, do nothing
            // We need to know which tab we are timing. 
            // Simplification: Reset timer on every dragOver? No, that would prevent firing.
            // We generally get many dragOver events.
            // We should check if we have a timer running. 

            // Issue: 'hoverTimeout' doesn't know WHICH tab it was started for if we store just the timer.
            // BUT, if we mouse out to another tab, 'handleDragLeave' (on the previous tab) should clear it.
            // Or 'handleDragOver' on the NEW tab should clear the old one.

            if (!hoverTimeout.current) {
                hoverTimeout.current = setTimeout(() => {
                    onTabClick(tabId);
                    hoverTimeout.current = null;
                }, 500);
            }
        }
    };

    const handleDragLeave = () => {
        setDropIndicator(null);
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }

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
                            onDragOver={(e) => handleDragOver(e, index, tab.id)}
                            onDragLeave={handleDragLeave}
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

                            {/* Dirty Indicator */}
                            {tab.isDirty && (
                                <div className="min-w-[6px] min-h-[6px] w-[6px] h-[6px] rounded-full mr-2" style={{ backgroundColor: theme.colors.accent.primary }} />
                            )}

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
