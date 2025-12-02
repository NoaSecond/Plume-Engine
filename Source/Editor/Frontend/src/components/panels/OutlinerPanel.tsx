import React, { useState } from 'react';
import { Folder, Search, Lightbulb, Camera, Box, FolderPlus, Edit2, Copy, Trash2 } from 'lucide-react';
import { Entity } from '../../types';
import { useTheme } from '../../ThemeContext';
interface OutlinerPanelProps {
  entities: Entity[]; selectedId: string | null; setSelectedId: (id: string | null) => void;
  onAddEntity: (type: Entity['type']) => void; setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  onDuplicate: (ent: Entity) => void; onDelete: (id: string) => void;
}
export const OutlinerPanel: React.FC<OutlinerPanelProps> = ({ entities, selectedId, setSelectedId, onAddEntity, setEntities, onDuplicate, onDelete }) => {
  const { theme } = useTheme();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedItem(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDrop = (_e: React.DragEvent, index: number) => {
     if (draggedItem === null) return;
     const newEntities = [...entities];
     const item = newEntities.splice(draggedItem, 1)[0];
     newEntities.splice(index, 0, item);
     setEntities(newEntities);
     setDraggedItem(null);
  };
  return (
    <div 
      className="h-1/2 flex flex-col"
      style={{ borderBottom: `1px solid ${theme.colors.border.default}` }}
    >
      <div 
        className="h-8 px-2 flex items-center justify-between text-xs font-bold"
        style={{ 
          backgroundColor: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.secondary 
        }}
      >
        <span>Hierarchy</span>
        <div className="flex space-x-1">
          <button 
            className="transition-colors"
            style={{ color: theme.colors.text.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
            onClick={() => onAddEntity('Folder')}
          >
            <FolderPlus size={14}/>
          </button>
          <Search size={12} className="ml-2" style={{ color: theme.colors.text.muted }}/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5 select-none" onDragOver={(e) => e.preventDefault()}>
        {entities.map((ent, index) => (
          <div 
            key={ent.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, index)} 
            onDrop={(e) => handleDrop(e, index)} 
            onClick={() => setSelectedId(ent.id)}
            className="flex items-center px-2 py-1 text-xs rounded cursor-pointer group border transition-colors"
            style={{
              backgroundColor: selectedId === ent.id ? theme.colors.accent.primary : 'transparent',
              color: selectedId === ent.id ? theme.colors.text.primary : theme.colors.text.secondary,
              borderColor: selectedId === ent.id ? theme.colors.accent.secondary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (selectedId !== ent.id) {
                e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId !== ent.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {ent.type === 'Folder' ? <Folder size={12} className="mr-2 text-yellow-500"/> : ent.type === 'Light' ? <Lightbulb size={12} className="mr-2 text-yellow-200"/> : ent.type === 'Camera' ? <Camera size={12} className="mr-2 text-blue-300"/> : <Box size={12} className="mr-2 text-blue-400"/>}
            {renameId === ent.id ? (
              <input 
                autoFocus 
                className="flex-1 px-1 outline-none border rounded" 
                style={{
                  backgroundColor: theme.colors.bg.primary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.accent.primary
                }}
                defaultValue={ent.name} 
                onBlur={() => setRenameId(null)} 
                onKeyDown={(e) => { 
                  if(e.key === 'Enter') { 
                    setEntities(entities.map(item => item.id === ent.id ? {...item, name: e.currentTarget.value} : item)); 
                    setRenameId(null); 
                  }
                }} 
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <span className="flex-1 truncate">{ent.name}</span>
            )}
            <div className={`flex space-x-1 opacity-0 group-hover:opacity-100 ${selectedId === ent.id ? 'opacity-100' : ''}`}>
              <button onClick={(e) => { e.stopPropagation(); setRenameId(ent.id); }}><Edit2 size={10}/></button>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(ent); }}><Copy size={10}/></button>
              <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDelete(ent.id); }}><Trash2 size={10}/></button>
            </div>
          </div>
        ))}
      </div>
      <div 
        className="h-6 text-[10px] flex items-center px-2"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderTop: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.muted
        }}
      >
        {entities.length} Actors
      </div>
    </div>
  );
};
