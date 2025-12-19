import React from 'react';
import { useTheme } from '../../../ThemeContext';
import { AssetTile } from '../../ui/Shared';


import { Asset } from '../../../hooks/useContentBrowser';

interface AssetGridProps {
    assets: Asset[];
    searchQuery: string;
    zoomLevel: number;
    selectedIds: Set<string>;
    lastSelectedId: string | null;
    editingId: string | null;
    editingValue: string;
    setEditingValue: (val: string) => void;
    setEditingId: (id: string | null) => void;
    commitRename: (asset: Asset, val: string) => void;
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setLastSelectedId: (id: string | null) => void;
    handleAssetClick: (asset: Asset, e: React.MouseEvent) => void;
    handleAssetDoubleClick: (asset: Asset, e: React.MouseEvent) => void;
    handleAssetContextMenu: (e: React.MouseEvent, asset: Asset, info: any) => void;
}

import { getAssetDefinition } from '../../../utils/AssetUtils';

// Helper for icon and color -> Now integrated via AssetUtils
// const getAssetConfig = (type: string, name: string, metaColor?: string, theme?: any) => ... replaced by getAssetDefinition


const RenamingAsset = ({ asset, editingValue, setEditingValue, commitRename, setEditingId, setAssets, theme, zoomLevel }: any) => {
    const type = asset.type ? asset.type.toLowerCase() : '';
    const name = asset.name ? asset.name.toLowerCase() : '';
    const { Icon, color } = getAssetDefinition(type, name, asset.meta?.color, theme);
    const baseSize = 96;
    const size = Math.round(baseSize * zoomLevel);

    return (
        <div
            className="flex flex-col items-center p-2 rounded cursor-pointer group transition-colors"
            style={{
                backgroundColor: theme.colors.selection.background,
                border: `1px solid ${theme.colors.selection.border}`,
                width: `${size}px`
            }}
        >
            <div
                className="rounded mb-2 flex items-center justify-center border shadow-sm relative overflow-hidden transition-transform"
                style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default,
                    width: `${Math.round(size * 0.66)}px`,
                    height: `${Math.round(size * 0.66)}px`
                }}
            >
                <Icon size={Math.round(32 * zoomLevel)} color={color} strokeWidth={type === 'folder' ? 1.5 : 2} />
            </div>
            <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(asset, editingValue);
                    if (e.key === 'Escape') {
                        setEditingId(null);
                        if (!asset.path) setAssets((prev: any[]) => prev.filter(it => it.id !== asset.id));
                    }
                }}
                onBlur={() => commitRename(asset, editingValue)}
                autoFocus
                className="text-xs text-center bg-black/50 text-white border border-blue-500 rounded px-1 w-full outline-none"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

export const AssetGrid: React.FC<AssetGridProps> = ({
    assets,
    searchQuery,
    zoomLevel,
    selectedIds,
    editingId,
    editingValue,
    setEditingValue,
    commitRename,
    setEditingId,
    setAssets,
    handleAssetClick,
    handleAssetDoubleClick,
    handleAssetContextMenu
}) => {
    const { theme } = useTheme();

    // Helper to filter hidden sources
    const visibleAssets = React.useMemo(() => {
        const hiddenSources = new Set<string>();
        assets.forEach(a => {
            const meta = a.meta as any;
            if (a.name.endsWith('.plumeasset') && meta?.source) {
                hiddenSources.add(meta.source);
            }
        });
        const visible = assets.filter(a => !hiddenSources.has(a.name) && a.name !== '.plume_meta' && !a.name.endsWith('.plume_meta'));
        return searchQuery ? visible.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) : visible;
    }, [assets, searchQuery]);

    return (
        <div
            className="flex flex-wrap gap-2 content-start"
        // Click handler for clearing selection is managed by parent container to catch clicks in empty space
        >
            {visibleAssets.map(a => {
                if (a.id === editingId) {
                    return (
                        <RenamingAsset
                            key={a.id}
                            asset={a}
                            editingValue={editingValue}
                            setEditingValue={setEditingValue}
                            commitRename={commitRename}
                            setEditingId={setEditingId}
                            setAssets={setAssets}
                            theme={theme}
                            zoomLevel={zoomLevel}
                        />
                    );
                } else {
                    return (
                        <AssetTile
                            key={a.id}
                            id={a.id}
                            name={a.name}
                            type={a.type || (a.name.includes('.') ? 'file' : 'folder')}
                            selected={selectedIds.has(a.id)}
                            meta={a.meta}
                            scale={zoomLevel}
                            searchQuery={searchQuery}
                            onClick={(e) => handleAssetClick(a, e)}
                            onDoubleClick={(e) => handleAssetDoubleClick(a, e)}
                            onContextMenu={(e, info) => handleAssetContextMenu(e, a, info)}
                        />
                    );
                }
            })}
        </div>
    );
};
