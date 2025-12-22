import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';

interface SkeletalMeshEditorProps {
    assetId: string;
    name: string;
    isActive: boolean;
}

export const SkeletalMeshEditor: React.FC<SkeletalMeshEditorProps> = ({ assetId, name, isActive }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    return (
        <div className="flex flex-col w-full h-full" style={{ backgroundColor: theme.colors.bg.primary, color: theme.colors.text.primary }}>
            {/* Main Content: Sidebar + Viewport + Details */}
            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar: Morph Targets / Mesh Tree (Placeholder for now) */}
                <div className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.secondary }}>
                    <div className="p-3 border-b font-medium text-xs uppercase tracking-wider" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.muted }}>
                        Mesh Sections
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="text-xs opacity-70 flex items-center gap-2">
                            <input type="checkbox" checked readOnly />
                            <span>LOD 0</span>
                        </div>
                        <div className="text-xs opacity-50 pl-6">Section 1 (Material A)</div>
                        <div className="text-xs opacity-50 pl-6">Section 2 (Material B)</div>
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
                        <div>
                            <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Name</label>
                            <div className="text-sm p-2 rounded border" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                {name}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs mb-1" style={{ color: theme.colors.text.secondary }}>Skeleton</label>
                            <div className="text-xs p-2 rounded border flex justify-between items-center" style={{ borderColor: theme.colors.border.default, backgroundColor: theme.colors.bg.primary }}>
                                <span className="opacity-70">SK_Mannequin</span>
                                <button className="text-[10px] bg-white/10 px-1 rounded hover:bg-white/20">Browse</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-bold mt-4 mb-2 opacity-80">Materials</div>
                            <div className="flex flex-col gap-2">
                                <div className="text-xs p-1 border rounded flex items-center gap-2" style={{ borderColor: theme.colors.border.default }}>
                                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                                    <span className="flex-1 truncate">M_Chest</span>
                                </div>
                                <div className="text-xs p-1 border rounded flex items-center gap-2" style={{ borderColor: theme.colors.border.default }}>
                                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                                    <span className="flex-1 truncate">M_Limbs</span>
                                </div>
                            </div>
                        </div>
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
