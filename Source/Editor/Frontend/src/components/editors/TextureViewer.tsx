import React from 'react';
import { useTheme } from '../../ThemeContext';

interface TextureViewerProps {
    assetId: string; // This will act as the path for now
    name: string;
}

export const TextureViewer: React.FC<TextureViewerProps> = ({ assetId, name }) => {
    const { theme } = useTheme();

    // Convert assetId (path) to a usable URL if needed. 
    // For the webview, we might need a specific protocol or just serve it relative if it's in the project.
    // Assuming 'assetId' is the full path. Use 'plume-asset://' protocol or similar if backend handles it, 
    // or just try to load it directly if the WebView supports local file access (which it should for the editor).
    // However, standard <img> tags might block local paths due to security.
    // PlumeEditor backend likely needs to serve these, or we rely on the WebView's ability to read local files.
    // Let's assume standard file URI works or a custom protocol is needed. 
    // Re-checking ContentBrowserPanel:
    // It uses specific icons. It doesn't seem to show thumbnails yet??
    // The 'Icon' variable in ContentBrowserPanel is just a Lucide icon.
    // Wait, does Plume Engine have a server for assets?
    // User mentions "visualisation de la texture".

    // Strategy: Try using the file path directly with `t=Date.now()` to bust cache.
    // If local file access is blocked, we might need a backend helper.
    // But given it's a WebView in a C++ app, `src="file:///..."` *should* work if CSP allows it.

    // Normalize path for URL
    const normalizedPath = assetId.replace(/\\/g, '/');
    // Try using the asset:// protocol which should be registered by the backend
    const assetSrc = `asset://${normalizedPath}`;

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden"
            style={{ backgroundColor: theme.colors.bg.primary }}
        >
            <div
                className="flex-1 flex items-center justify-center overflow-hidden p-4 relative"
                style={{
                    // Checkerboard pattern
                    backgroundImage: `
            linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
            linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
            linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
          `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#1a1a1a'
                }}
            >
                <img
                    src={assetSrc}
                    alt={name}
                    className="max-w-full max-h-full object-contain shadow-lg"
                    onError={(e) => {
                        console.error("Failed to load image:", assetSrc);
                        // Verify if we can load it via file protocol (might be blocked but worth a try in dev)
                        const img = e.target as HTMLImageElement;

                        // Helper to prevent infinite loops if something weird happens
                        if (!img.dataset.retryCount) img.dataset.retryCount = '0';
                        const retry = parseInt(img.dataset.retryCount);
                        if (retry > 4) {
                            img.style.display = 'none';
                            return;
                        }
                        img.dataset.retryCount = (retry + 1).toString();

                        if (!img.src.startsWith('file://') && !img.src.includes('plume-asset') && !img.dataset.triedRelative) {
                            // First fallback: File protocol
                            img.src = `file:///${normalizedPath}`;
                        } else if (img.src.startsWith('file://') && !img.src.includes('plume-asset')) {
                            // Second fallback: Custom protocol with domain
                            img.src = `https://plume-asset/${normalizedPath}`;
                        } else if (img.src.includes('plume-asset') && !img.dataset.triedRelative) {
                            // Third fallback: Relative path from document root
                            img.src = normalizedPath;
                            img.dataset.triedRelative = 'true';
                        } else if (img.dataset.triedRelative === 'true') {
                            // Fourth fallback: Try stepping up to find Content (assuming Bin/Release/UI depth)
                            // Trying a deep traversal guess
                            img.src = `../../${normalizedPath}`;
                            img.dataset.triedRelative = 'deep';
                        } else if (img.dataset.triedRelative === 'deep') {
                            // Final desperate attempt: absolute path without file scheme if browser allows it? Unlikely.
                            // But maybe just '../'
                            img.src = `../${normalizedPath}`;
                            img.dataset.triedRelative = 'shallow';
                        } else {
                            img.style.display = 'none';
                        }
                    }}
                />
                <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                    {name}
                </div>
            </div>
            <div
                className="h-8 border-t flex items-center px-4 text-xs"
                style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default,
                    color: theme.colors.text.secondary
                }}
            >
                <span>Path: {assetId}</span>
            </div>
        </div>
    );
};
