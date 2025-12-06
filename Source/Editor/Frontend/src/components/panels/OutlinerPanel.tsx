import React, { useState, useEffect } from 'react';
import { Folder, Search, Lightbulb, Camera, Box, FolderPlus, Edit2, Copy, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Entity } from '../../types';
import { useTheme } from '../../ThemeContext';

interface EntityWithChildren extends Entity {
  children?: EntityWithChildren[];
  parentId?: string;
}

interface OutlinerPanelProps {
  entities: Entity[]; 
  selectedId: string | null; 
  setSelectedId: (id: string | null) => void;
  onAddEntity: (type: Entity['type']) => void; 
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  onDuplicate: (ent: Entity) => void; 
  onDelete: (id: string) => void;
}

export const OutlinerPanel: React.FC<OutlinerPanelProps> = ({ 
  entities, 
  selectedId, 
  setSelectedId, 
  onAddEntity, 
  setEntities, 
  onDuplicate, 
  onDelete 
}) => {
  const { theme } = useTheme();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<{id:string,name:string,items?:Entity[]}|null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Entity | Entity[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Initialize selectedIds from selectedId only once on mount
  useEffect(() => {
    if (selectedId && selectedIds.size === 0) {
      setSelectedIds(new Set([selectedId]));
      setLastSelectedId(selectedId);
    }
  }, []); // Empty dependency array - only run once on mount

  // Convert flat entity list to hierarchical structure
  const buildHierarchy = (): EntityWithChildren[] => {
    const entitiesWithParent = entities.map(e => ({
      ...e,
      parentId: (e as any).parentId,
      children: []
    }));

    const map = new Map<string, EntityWithChildren>();
    const roots: EntityWithChildren[] = [];

    entitiesWithParent.forEach(e => map.set(e.id, e));

    entitiesWithParent.forEach(e => {
      if (e.parentId && map.has(e.parentId)) {
        const parent = map.get(e.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(e);
      } else {
        roots.push(e);
      }
    });

    return roots;
  };

  // Flatten hierarchy back to list for setEntities
  const flattenHierarchy = (nodes: EntityWithChildren[]): Entity[] => {
    const result: Entity[] = [];
    const flatten = (node: EntityWithChildren) => {
      const { children, ...entity } = node;
      result.push(entity as Entity);
      if (children && children.length > 0) {
        children.forEach(flatten);
      }
    };
    nodes.forEach(flatten);
    return result;
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key } = e;
      const keyLower = key.toLowerCase();

      if (selectedIds.size === 0) return;

      const firstSelectedId = Array.from(selectedIds)[0];
      const selectedEntity = entities.find(ent => ent.id === firstSelectedId);
      if (!selectedEntity) return;

      // F2 to rename
      if (keyLower === 'f2') {
        e.preventDefault();
        if (selectedIds.size === 1) {
          setRenameId(firstSelectedId);
        }
      }
      // Delete key
      else if (keyLower === 'delete') {
        e.preventDefault();
        handleDeleteSelected();
      }
      // Ctrl+C to copy
      else if (ctrlKey && keyLower === 'c') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+V to paste
      else if (ctrlKey && keyLower === 'v') {
        e.preventDefault();
        handlePaste();
      }
      // Ctrl+D to duplicate
      else if (ctrlKey && keyLower === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
      // Ctrl+A to select all
      else if (ctrlKey && keyLower === 'a') {
        e.preventDefault();
        const allIds = entities.map(e => e.id);
        setSelectedIds(new Set(allIds));
        if (allIds.length > 0) {
          setSelectedId(allIds[0]);
          setLastSelectedId(allIds[allIds.length - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entities, selectedIds, clipboard]);

  // Handle Enter key in delete confirmation popup
  useEffect(() => {
    if (!deletePending) return;

    const onDeletePopupKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setDeletePending(null);
      }
    };

    window.addEventListener('keydown', onDeletePopupKey);
    return () => window.removeEventListener('keydown', onDeletePopupKey);
  }, [deletePending]);

  const handleEntityClick = (e: React.MouseEvent, entityId: string) => {
    if (e.ctrlKey) {
      // Ctrl+Click: toggle selection
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(entityId)) {
          newSet.delete(entityId);
          // Update selectedId to first remaining or null
          const remaining = Array.from(newSet);
          setSelectedId(remaining.length > 0 ? remaining[0] : null);
        } else {
          newSet.add(entityId);
          setSelectedId(entityId);
        }
        return newSet;
      });
      setLastSelectedId(entityId);
    } else if (e.shiftKey && lastSelectedId) {
      // Shift+Click: select range (replace selection)
      const currentIndex = entities.findIndex(ent => ent.id === entityId);
      const lastIndex = entities.findIndex(ent => ent.id === lastSelectedId);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = entities.slice(start, end + 1).map(ent => ent.id);

        setSelectedIds(new Set(rangeIds));
        setSelectedId(rangeIds[0]);
        // Don't update lastSelectedId so we can extend the selection
      }
    } else {
      // Normal click: select only this item
      setSelectedIds(new Set([entityId]));
      setSelectedId(entityId);
      setLastSelectedId(entityId);
    }
  };

  const handleDeleteSelected = () => {
    const selectedEntities = entities.filter(ent => selectedIds.has(ent.id));
    if (selectedEntities.length === 0) return;

    if (selectedEntities.length === 1) {
      setDeletePending({ 
        id: selectedEntities[0].id, 
        name: selectedEntities[0].name,
        items: selectedEntities
      });
    } else {
      const names = selectedEntities.map(e => e.name).join(', ');
      setDeletePending({ 
        id: 'multi', 
        name: `${selectedEntities.length} items (${names})`,
        items: selectedEntities
      });
    }
  };

  const confirmDelete = () => {
    if (!deletePending || !deletePending.items) return;
    
    const idsToDelete = new Set(deletePending.items.map(item => item.id));
    setEntities(prev => prev.filter(e => !idsToDelete.has(e.id)));
    
    setSelectedIds(new Set());
    setSelectedId(null);
    setLastSelectedId(null);
    setDeletePending(null);
  };

  const handleCopy = () => {
    const selectedEntities = entities.filter(ent => selectedIds.has(ent.id));
    if (selectedEntities.length === 0) return;
    
    setClipboard(selectedEntities.length === 1 ? selectedEntities[0] : selectedEntities);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    
    const itemsToPaste = Array.isArray(clipboard) ? clipboard : [clipboard];
    itemsToPaste.forEach(item => {
      onDuplicate(item);
    });
  };

  const handleDuplicateSelected = () => {
    const selectedEntities = entities.filter(ent => selectedIds.has(ent.id));
    selectedEntities.forEach(ent => {
      onDuplicate(ent);
    });
  };

  const handleDragStart = (e: React.DragEvent, entityId: string) => { 
    // If dragging a selected item and there are multiple selections, drag all
    if (selectedIds.has(entityId)) {
      setDraggedIds(Array.from(selectedIds));
    } else {
      setDraggedIds([entityId]);
    }
    e.dataTransfer.effectAllowed = "move"; 
  };

  const handleDragOver = (e: React.DragEvent, entityId: string, entityType: Entity['type']) => {
    e.preventDefault();
    if (entityType === 'Folder') {
      setDragOverFolder(entityId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetEntity?: Entity) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
    
    if (draggedIds.length === 0) return;
    
    // If dropping on a folder, set parent
    if (targetEntity && targetEntity.type === 'Folder') {
      const draggedEntities = entities.filter(ent => draggedIds.includes(ent.id));
      
      // Don't allow dragging a folder into itself or its children
      if (draggedIds.includes(targetEntity.id)) {
        setDraggedIds([]);
        return;
      }
      
      const updatedEntities = entities.map(e => {
        if (draggedIds.includes(e.id)) {
          return { ...e, parentId: targetEntity.id } as any;
        }
        return e;
      });
      
      setEntities(updatedEntities);
      setDraggedIds([]);
      
      // Expand the folder to show the new children
      setExpandedFolders(prev => new Set([...prev, targetEntity.id]));
      return;
    }
    
    setDraggedIds([]);
  };

  const hierarchy = buildHierarchy();

  // Recursive component to render entity tree
  const renderEntity = (ent: EntityWithChildren, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(ent.id);
    const hasChildren = ent.type === 'Folder' && ent.children && ent.children.length > 0;
    
    return (
      <React.Fragment key={ent.id}>
        <div 
          draggable 
          onDragStart={(e) => handleDragStart(e, ent.id)} 
          onDragOver={(e) => handleDragOver(e, ent.id, ent.type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, ent)} 
          onClick={(e) => handleEntityClick(e, ent.id)}
          className="flex items-center px-2 py-1 text-xs rounded cursor-pointer group border transition-colors"
          style={{
            backgroundColor: selectedIds.has(ent.id) ? theme.colors.accent.primary : 
                           dragOverFolder === ent.id ? theme.colors.accent.hover : 'transparent',
            color: selectedIds.has(ent.id) ? theme.colors.text.primary : theme.colors.text.secondary,
            borderColor: selectedIds.has(ent.id) ? theme.colors.accent.secondary : 
                        dragOverFolder === ent.id ? theme.colors.accent.primary : 'transparent',
            paddingLeft: `${8 + depth * 16}px`
          }}
          onMouseEnter={(e) => {
            if (!selectedIds.has(ent.id) && dragOverFolder !== ent.id) {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
            }
          }}
          onMouseLeave={(e) => {
            if (!selectedIds.has(ent.id) && dragOverFolder !== ent.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Folder expand/collapse arrow */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(ent.id);
              }}
              className="mr-1"
              style={{ color: theme.colors.text.muted }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          
          {/* Icon */}
          {ent.type === 'Folder' ? <Folder size={12} className="mr-2 text-yellow-500"/> : 
           ent.type === 'Light' ? <Lightbulb size={12} className="mr-2 text-yellow-200"/> : 
           ent.type === 'Camera' ? <Camera size={12} className="mr-2 text-blue-300"/> : 
           <Box size={12} className="mr-2 text-blue-400"/>}
          
          {/* Name / Rename input */}
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
                } else if (e.key === 'Escape') {
                  setRenameId(null);
                }
              }} 
              onClick={(e) => e.stopPropagation()} 
            />
          ) : (
            <span className="flex-1 truncate">{ent.name}</span>
          )}
          
          {/* Action buttons */}
          <div className={`flex space-x-1 opacity-0 group-hover:opacity-100 ${selectedIds.has(ent.id) ? 'opacity-100' : ''}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); setRenameId(ent.id); }}
              title="Rename (F2)"
            >
              <Edit2 size={10}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(ent); }}
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={10}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteSelected(); }}
              title="Delete (Del)"
            >
              <Trash2 size={10}/>
            </button>
          </div>
        </div>
        
        {/* Render children if folder is expanded */}
        {hasChildren && isExpanded && ent.children!.map(child => renderEntity(child, depth + 1))}
      </React.Fragment>
    );
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
            title="Create Folder"
          >
            <FolderPlus size={14}/>
          </button>
          <Search size={12} className="ml-2" style={{ color: theme.colors.text.muted }}/>
        </div>
      </div>
      <div 
        className="flex-1 overflow-y-auto p-1 select-none" 
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          // Deselect all when clicking on empty area
          if (e.target === e.currentTarget) {
            setSelectedIds(new Set());
            setSelectedId(null);
            setLastSelectedId(null);
          }
        }}
      >
        {hierarchy.map(ent => renderEntity(ent))}
      </div>
      
      {deletePending && (
        <div style={{ position: 'absolute', right: 16, bottom: 56, zIndex: 60 }}>
          <div className="flex items-center space-x-2 p-3 rounded shadow" style={{ backgroundColor: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.default}` }}>
            <div className="text-sm" style={{ color: theme.colors.text.primary }}>
              Delete "{deletePending.name}"?
            </div>
            <button 
              className="px-3 py-1 rounded text-sm" 
              style={{ backgroundColor: '#ef4444', color: '#fff' }} 
              onClick={confirmDelete}
            >
              Delete
            </button>
            <button 
              className="px-3 py-1 rounded text-sm" 
              style={{ backgroundColor: theme.colors.bg.elevated, color: theme.colors.text.primary }} 
              onClick={() => setDeletePending(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="h-6 text-[10px] flex items-center px-2"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderTop: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.muted
        }}
      >
        {entities.length} Actors {selectedIds.size > 0 && `(${selectedIds.size} selected)`}
      </div>
    </div>
  );
};
