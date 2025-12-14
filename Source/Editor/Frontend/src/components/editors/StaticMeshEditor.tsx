import React, { useRef, useState, useEffect } from 'react';
import { Viewport } from '../viewport/Viewport';
import { DetailsPanel } from '../panels/DetailsPanel'; // Reusing for now, might need specific one
import { Entity, ToolType } from '../../types';
import { useTheme } from '../../ThemeContext';

interface StaticMeshEditorProps {
    // Only minimal props needed for this isolated view
    entityId: string; // The ID of the mesh we are editing
    onClose: () => void;
}

export const StaticMeshEditor: React.FC<StaticMeshEditorProps> = ({ entityId, onClose }) => {
    const { theme } = useTheme();

    // Local state for this editor - isolated from the main scene
    // In a real app, this might fetch the mesh data specifically
    const [localEntities, setLocalEntities] = useState<Entity[]>([
        {
            id: 'preview-mesh',
            name: 'Preview Mesh',
            type: 'Mesh',
            visible: true,
            transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
            id: 'preview-light',
            name: 'Preview Light',
            type: 'Light',
            visible: true,
            transform: { position: { x: 50, y: 50, z: 50 }, rotation: { x: 45, y: 45, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        }
    ]);
    const [cameraTransform, setCameraTransform] = useState({ position: { x: 0, y: 0, z: -100 }, rotation: { x: 0, y: 0, z: 0 } });
    const [viewMode, setViewMode] = useState<'Lit' | 'Unlit' | 'Wireframe'>('Lit');
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedEntity = localEntities.find(e => e.id === selectedId);


    return (
        <div className="flex flex-col h-full w-full">


            <div className="flex-1 flex overflow-hidden">
                <Viewport
                    entities={localEntities}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    cameraTransform={cameraTransform}
                    setCameraTransform={setCameraTransform}
                    activeTool={activeTool}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onAddEntity={() => { }} // Disabled in mesh editor
                    showToolbar={false}
                />
                <div
                    className="w-80 flex flex-col shrink-0 border-l"
                    style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default
                    }}
                >
                    <div className="p-4 border-b" style={{ borderColor: theme.colors.border.default, color: theme.colors.text.primary }}>
                        <h3 className="font-bold">Mesh Details</h3>
                        <p className="text-xs text-muted-foreground mt-2">Editing properties for {entityId}</p>
                    </div>
                    {/* We can reuse DetailsPanel if it's generic enough, or build a custom one */}
                    <DetailsPanel selectedEntity={localEntities[0]} setEntities={setLocalEntities} />
                </div>
            </div>
        </div>
    );
};
