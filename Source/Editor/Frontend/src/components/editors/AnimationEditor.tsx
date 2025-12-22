import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface AnimationEditorProps {
    assetId: string;
    name: string;
    isActive: boolean;
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({ assetId, name, isActive }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    return (
        <div className="flex flex-col w-full h-full" style={{ backgroundColor: theme.colors.bg.primary, color: theme.colors.text.primary }}>
            {/* Main Content: Sidebar + Viewport/Timeline */}
            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar: properties */}
                <div className="w-80 flex flex-col border-r h-full shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                    <div className="p-3 border-b font-medium text-xs uppercase tracking-wider" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.muted }}>
                        Animation Details
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Placeholder properties */}
                        <div>
                            <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Name</label>
                            <div className="text-sm p-2 rounded border" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                {name}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Asset ID</label>
                            <div className="text-xs p-2 rounded border font-mono opacity-70 break-all" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                {assetId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center & Bottom: Viewport + Timeline */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* 3D Viewport Area */}
                    <div className="flex-1 relative bg-black/20 flex items-center justify-center">
                        <p className="text-sm opacity-50">3D Viewport Placeholder</p>
                        {/* integrate with actual renderer later */}
                    </div>

                    {/* Bottom Timeline */}
                    <div className="h-64 border-t flex flex-col shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                        {/* Timeline Toolbar */}
                        <div className="h-10 border-b flex items-center px-4 gap-2" style={{ borderColor: theme.colors.border.default }}>
                            <button onClick={() => setCurrentFrame(0)} className="p-1 hover:bg-white/10 rounded" title="Reset"><SkipBack size={16} /></button>
                            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:bg-white/10 rounded" title={isPlaying ? "Pause" : "Play"}>
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded" title="End"><SkipForward size={16} /></button>
                            <div className="ml-4 text-xs font-mono" style={{ color: theme.colors.text.secondary }}>
                                Frame: {currentFrame}
                            </div>
                        </div>
                        {/* Timeline Grid Placeholder */}
                        <div className="flex-1 p-4 overflow-hidden relative">
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: `linear-gradient(to right, ${theme.colors.border.default} 1px, transparent 1px)`,
                                backgroundSize: '20px 100%'
                            }} />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: '20px' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Path - Full Width */}
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
