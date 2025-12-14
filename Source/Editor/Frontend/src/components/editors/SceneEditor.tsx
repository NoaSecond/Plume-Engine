import React from 'react';
import { Toolbar } from '../layout/Toolbar';
import { Viewport } from '../viewport/Viewport';
import { OutlinerPanel } from '../panels/OutlinerPanel';
import { DetailsPanel } from '../panels/DetailsPanel';
import { useTheme } from '../../ThemeContext';
import { Entity, ToolType } from '../../types';

interface SceneEditorProps {
    // Toolbar Props
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    onSave: () => void;
    onDelete: () => void;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;

    // Viewport & Data Props
    entities: Entity[];
    setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    cameraTransform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } };
    setCameraTransform: React.Dispatch<React.SetStateAction<{ position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }>>;
    viewMode: 'Lit' | 'Unlit' | 'Wireframe';
    setViewMode: (mode: 'Lit' | 'Unlit' | 'Wireframe') => void;
    onAddEntity: (type: Entity['type']) => void;

    // Outliner Props
    onDuplicate: (ent: Entity) => void;
    onDeleteEntity: (id: string) => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
    activeTool, setActiveTool, onSave, onDelete, isPlaying, onPlay, onPause, onStop,
    entities, setEntities, selectedId, setSelectedId, cameraTransform, setCameraTransform,
    viewMode, setViewMode, onAddEntity, onDuplicate, onDeleteEntity
}) => {
    const { theme } = useTheme();
    const selectedEntity = entities.find(e => e.id === selectedId);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <Toolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onSave={onSave}
                onDelete={onDelete}
                isPlaying={isPlaying}
                onPlay={onPlay}
                onPause={onPause}
                onStop={onStop}
            />
            <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                <Viewport
                    entities={entities}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    cameraTransform={cameraTransform}
                    setCameraTransform={setCameraTransform}
                    activeTool={activeTool}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onAddEntity={onAddEntity}
                />
                <div
                    className="w-80 flex flex-col shrink-0 border-l"
                    style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default
                    }}
                >
                    <OutlinerPanel
                        entities={entities}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        onAddEntity={onAddEntity}
                        setEntities={setEntities}
                        onDuplicate={onDuplicate}
                        onDelete={onDeleteEntity}
                    />
                    <DetailsPanel selectedEntity={selectedEntity} setEntities={setEntities} />
                </div>
            </div>
        </div>
    );
};
