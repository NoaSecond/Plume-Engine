import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { X } from 'lucide-react';

export interface Tab {
    id: string;
    title: string;
    type: 'scene' | 'static-mesh';
    data?: any; // Extra data like entity ID for static mesh
    closable?: boolean;
}

interface TabSystemProps {
    tabs: Tab[];
    activeTabId: string;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
    children?: React.ReactNode;
    // Children will be the content. 
    // The parent is responsible for rendering the correct content based on activeTabId relative to the tabs.
    // Actually, a better pattern might be to pass a render function or let the parent handle the content area entirely.
    // Let's stick to just rendering the Tab Header here, and let the parent render the content area below it.
}

export const TabSystem: React.FC<TabSystemProps> = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
    const { theme } = useTheme();

    return (
        <div
            className="flex items-end w-full h-9 select-none"
            style={{
                backgroundColor: theme.colors.bg.secondary, // Tab bar background
                borderBottom: `1px solid ${theme.colors.border.default}`
            }}
        >
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => onTabClick(tab.id)}
                        className={`
              relative h-full flex items-center px-4 min-w-[120px] max-w-[200px] cursor-pointer group
              text-xs border-r transition-colors
            `}
                        style={{
                            backgroundColor: isActive ? theme.colors.bg.primary : 'transparent',
                            color: isActive ? theme.colors.accent.primary : theme.colors.text.muted,
                            borderColor: theme.colors.border.default,
                            borderTop: isActive ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent'
                        }}
                    >
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
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
