import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useTheme } from '../../../../ThemeContext';

const TextureSampleNode = ({ data, selected }: NodeProps) => {
    const { theme } = useTheme();
    const [hover, setHover] = React.useState(false);

    // Image loading state
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const retryIndex = useRef(0);

    const textureId = data.textureAssetId;
    const availableTextures = data.availableTextures || [];
    const selectedTexture = availableTextures.find((t: any) => t.id === textureId);

    // Helper to normalize path (force start from Content/ onwards)
    const normalizeContentPath = (p: string) => {
        const normalized = p.replace(/\\/g, '/');
        const idx = normalized.indexOf('/Content/');
        if (idx !== -1) return normalized.substring(idx + 1);
        const idx2 = normalized.indexOf('Content/');
        if (idx2 === 0) return normalized;
        return normalized; // Fallback
    };

    useEffect(() => {
        if (selectedTexture && (selectedTexture.path || selectedTexture.name)) {
            const rawPath = selectedTexture.path || selectedTexture.name;
            const relativePath = normalizeContentPath(rawPath);

            // Try 1: Asset protocol with relative path (likely what TextureViewer uses)
            // TextureViewer uses normalizePath which likely results in 'Content/Folder/Asset.plumeasset'
            setImgSrc(`asset://${relativePath}`);
            retryIndex.current = 0;
        } else {
            setImgSrc(null);
        }
    }, [textureId, selectedTexture]);

    const handleImageError = () => {
        if (!selectedTexture) return;

        const rawPath = selectedTexture.path || selectedTexture.name;
        const absolutePath = rawPath.replace(/\\/g, '/');
        const relativePath = normalizeContentPath(rawPath);

        const relativeNoExt = relativePath.replace(/\.plumeasset$/i, '');
        const absoluteNoExt = absolutePath.replace(/\.plumeasset$/i, '');

        // Retry Strategy with prioritisation
        const strategies = [
            `asset://${relativePath}`,                  // 0: Initial (Relative Asset)
            `asset://${relativeNoExt}.png`,             // 1: Relative Asset + PNG (Extension swap)
            `file:///${absoluteNoExt}.png`,             // 2: Absolute File + PNG
            `file:///${absoluteNoExt}.jpg`,             // 3: Absolute File + JPG
            `file:///${absoluteNoExt}.jpeg`,            // 4: Absolute File + JPEG
            `https://plume-asset/${relativePath}`,      // 5: Custom Domain
            `https://plume-asset/${relativeNoExt}.png`, // 6: Custom Domain + PNG
            `file:///${absolutePath}`                   // 7: Absolute File (Raw)
        ];

        const nextIndex = retryIndex.current + 1;
        if (nextIndex < strategies.length) {
            retryIndex.current = nextIndex;
            setImgSrc(strategies[nextIndex]);
        } else {
            setImgSrc(null);
        }
    };

    const outputs = [
        { id: 'rgb', label: 'RGB' },
        { id: 'r', label: 'R' },
        { id: 'g', label: 'G' },
        { id: 'b', label: 'B' },
        { id: 'a', label: 'A' },
    ];

    return (
        <div
            style={{
                background: theme.colors.bg.secondary,
                border: selected
                    ? `1px solid ${theme.colors.accent.primary}`
                    : `1px solid ${hover ? theme.colors.text.secondary : theme.colors.border.default}`,
                borderRadius: theme.borderRadius.md,
                minWidth: '200px',
                color: theme.colors.text.primary,
                boxShadow: selected ? `0 0 0 1px ${theme.colors.accent.primary}` : theme.shadows.md,
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Header */}
            <div
                style={{
                    padding: '8px 12px',
                    background: selected ? theme.colors.accent.primary + '20' : theme.colors.bg.tertiary,
                    borderBottom: `1px solid ${theme.colors.border.default}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    Texture Sample
                </div>
            </div>

            {/* Preview */}
            <div style={{
                height: '128px',
                width: '100%',
                background: '#1a1a1a',
                borderBottom: `1px solid ${theme.colors.border.default}`,
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: `
                    linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
                {imgSrc && (
                    <img
                        src={imgSrc}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={handleImageError}
                    />
                )}
                {/* Asset Name Overlay */}
                {selectedTexture && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {selectedTexture.name.replace(/\.plumeasset$/i, '')}
                    </div>
                )}
            </div>

            {/* Inputs Body */}
            <div style={{ padding: '12px 0', display: 'flex' }}>
                {/* Inputs Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        position: 'relative',
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px',
                    }}>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="uvs"
                            style={{
                                width: '10px',
                                height: '10px',
                                background: theme.colors.text.secondary,
                                left: '-5px',
                            }}
                        />
                        <span>UVs</span>
                    </div>
                </div>

                {/* Outputs Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {outputs.map(output => (
                        <div key={output.id} style={{
                            position: 'relative',
                            padding: '6px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px',
                        }}>
                            <span>{output.label}</span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={output.id}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    background: theme.colors.text.secondary,
                                    right: '-5px',
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(TextureSampleNode);
