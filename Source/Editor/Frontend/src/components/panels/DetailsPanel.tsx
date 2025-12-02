import React from 'react';
import { Lightbulb, Box, ChevronDown, MousePointer2 } from 'lucide-react';
import { Entity, Transform } from '../../types';
import { useTheme } from '../../ThemeContext';
interface DetailsPanelProps { selectedEntity: Entity | undefined; setEntities: React.Dispatch<React.SetStateAction<Entity[]>>; }
export const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedEntity, setEntities }) => {
  const { theme } = useTheme();
  const updateTransform = (axis: 'x'|'y'|'z', type: 'position'|'rotation'|'scale', value: string) => {
    if (!selectedEntity) return;
    const val = parseFloat(value);
    if (isNaN(val)) return;
    setEntities(prev => prev.map(e => { if (e.id === selectedEntity.id) return { ...e, transform: { ...e.transform, [type]: { ...e.transform[type], [axis]: val } } }; return e; }));
  };
  const updateName = (name: string) => { if(!selectedEntity) return; setEntities(prev => prev.map(e => e.id === selectedEntity.id ? {...e, name} : e)); };
  if (!selectedEntity) return (
    <div 
      className="h-1/2 flex flex-col"
      style={{ 
        backgroundColor: theme.colors.bg.primary,
        borderLeft: `1px solid ${theme.colors.border.default}`
      }}
    >
      <div 
        className="h-8 px-2 flex items-center text-xs font-bold"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.secondary
        }}
      >
        <span>Details</span>
      </div>
      <div 
        className="flex-1 flex flex-col items-center justify-center text-xs p-4 text-center"
        style={{ color: theme.colors.text.muted }}
      >
        <MousePointer2 size={32} className="mb-2 opacity-50"/>
        <p>Select an actor.</p>
      </div>
    </div>
  );
  return (
    <div 
      className="h-1/2 flex flex-col"
      style={{
        backgroundColor: theme.colors.bg.primary,
        borderLeft: `1px solid ${theme.colors.border.default}`
      }}
    >
      <div 
        className="h-8 px-2 flex items-center text-xs font-bold"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.secondary
        }}
      >
        <span>Details</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div 
          className="flex items-center mb-4 pb-2 border-b"
          style={{ borderBottomColor: theme.colors.border.default }}
        >
          <div 
            className="w-8 h-8 border rounded flex items-center justify-center mr-2"
            style={{
              backgroundColor: theme.colors.bg.elevated,
              borderColor: theme.colors.border.default
            }}
          >
            {selectedEntity.type === 'Light' ? 
              <Lightbulb size={16} className="text-yellow-400"/> : 
              <Box size={16} className="text-blue-400"/>
            }
          </div>
          <div className="flex flex-col flex-1">
            <input 
              className="bg-transparent text-sm font-bold border border-transparent rounded px-1 -ml-1 outline-none w-full transition-colors"
              style={{
                color: theme.colors.text.primary
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.accent.primary;
                e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              value={selectedEntity.name} 
              onChange={(e) => updateName(e.target.value)} 
            />
            <span 
              className="text-[10px] font-mono"
              style={{ color: theme.colors.text.muted }}
            >
              {selectedEntity.type} {selectedEntity.subType ? "("+selectedEntity.subType+")" : ''}
            </span>
          </div>
        </div>
        <div className="mb-2">
           <div 
             className="flex items-center px-2 py-1 rounded-t text-[10px] font-bold border-b"
             style={{
               backgroundColor: theme.colors.bg.elevated,
               color: theme.colors.text.secondary,
               borderBottomColor: theme.colors.border.default
             }}
           >
             <ChevronDown size={10} className="mr-1"/> Transform
           </div>
           <div 
             className="p-2 rounded-b space-y-3 text-[10px]"
             style={{ backgroundColor: theme.colors.bg.secondary }}
           >
             {['position', 'rotation', 'scale'].map((prop) => (
               <div key={prop} className="flex items-center">
                 <span 
                   className="w-16 capitalize font-semibold truncate" 
                   title={prop}
                   style={{ color: theme.colors.text.secondary }}
                 >
                   {prop}
                 </span>
                 <div className="flex-1 flex space-x-1">
                   {(['x', 'y', 'z'] as const).map(axis => (
                      <div 
                        key={axis} 
                        className="flex-1 flex items-center rounded overflow-hidden border transition-colors"
                        style={{
                          backgroundColor: theme.colors.bg.primary,
                          borderColor: 'transparent'
                        }}
                        onFocusCapture={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.accent.primary;
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <span 
                          className={`px-1.5 font-bold cursor-ew-resize select-none ${
                            axis === 'x' ? 'text-red-500' : axis === 'y' ? 'text-green-500' : 'text-blue-500'
                          }`}
                        >
                          {axis.toUpperCase()}
                        </span>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="w-full bg-transparent border-none outline-none py-0.5 px-1 font-mono text-right" 
                          style={{ color: theme.colors.text.primary }}
                          value={selectedEntity.transform[prop as keyof Transform][axis]} 
                          onChange={(e) => updateTransform(axis, prop as any, e.target.value)} 
                        />
                      </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
