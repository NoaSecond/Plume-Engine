import React from 'react';
import { Lightbulb, Box, ChevronDown, MousePointer2 } from 'lucide-react';
import { Entity, Transform } from '../../types';
interface DetailsPanelProps { selectedEntity: Entity | undefined; setEntities: React.Dispatch<React.SetStateAction<Entity[]>>; }
export const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedEntity, setEntities }) => {
  const updateTransform = (axis: 'x'|'y'|'z', type: 'position'|'rotation'|'scale', value: string) => {
    if (!selectedEntity) return;
    const val = parseFloat(value);
    if (isNaN(val)) return;
    setEntities(prev => prev.map(e => { if (e.id === selectedEntity.id) return { ...e, transform: { ...e.transform, [type]: { ...e.transform[type], [axis]: val } } }; return e; }));
  };
  const updateName = (name: string) => { if(!selectedEntity) return; setEntities(prev => prev.map(e => e.id === selectedEntity.id ? {...e, name} : e)); };
  if (!selectedEntity) return ( <div className="h-1/2 flex flex-col bg-[#1e1e1e] border-l border-black"><div className="h-8 bg-[#252525] px-2 flex items-center border-b border-black text-xs font-bold text-slate-400"><span>Details</span></div><div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs p-4 text-center"><MousePointer2 size={32} className="mb-2 opacity-50"/><p>Select an actor.</p></div></div> );
  return (
    <div className="h-1/2 flex flex-col bg-[#1e1e1e] border-l border-black">
      <div className="h-8 bg-[#252525] px-2 flex items-center border-b border-black text-xs font-bold text-slate-400"><span>Details</span></div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center mb-4 pb-2 border-b border-slate-700">
          <div className="w-8 h-8 bg-slate-800 border border-slate-600 rounded flex items-center justify-center mr-2">{selectedEntity.type === 'Light' ? <Lightbulb size={16} className="text-yellow-200"/> : <Box size={16} className="text-blue-400"/>}</div>
          <div className="flex flex-col flex-1"><input className="bg-transparent text-sm font-bold border border-transparent hover:border-slate-600 rounded px-1 -ml-1 focus:border-blue-500 focus:bg-slate-900 outline-none w-full" value={selectedEntity.name} onChange={(e) => updateName(e.target.value)} /><span className="text-[10px] text-slate-500 font-mono">{selectedEntity.type} {selectedEntity.subType ? "("+selectedEntity.subType+")" : ''}</span></div>
        </div>
        <div className="mb-2">
           <div className="flex items-center bg-[#2a2a2a] px-2 py-1 rounded-t text-[10px] font-bold text-slate-400 border-b border-slate-700"><ChevronDown size={10} className="mr-1"/> Transform</div>
           <div className="bg-[#222] p-2 rounded-b space-y-3 text-[10px]">
             {['position', 'rotation', 'scale'].map((prop) => (
               <div key={prop} className="flex items-center">
                 <span className="w-16 capitalize text-slate-400 font-semibold truncate" title={prop}>{prop}</span>
                 <div className="flex-1 flex space-x-1">
                   {(['x', 'y', 'z'] as const).map(axis => (
                      <div key={axis} className="flex-1 flex items-center bg-[#151515] rounded overflow-hidden border border-transparent focus-within:border-blue-500">
                        <span className={`px-1.5 font-bold cursor-ew-resize select-none ${axis === 'x' ? 'text-red-500' : axis === 'y' ? 'text-green-500' : 'text-blue-500'}`}>{axis.toUpperCase()}</span>
                        <input type="number" step="0.1" className="w-full bg-transparent border-none outline-none text-slate-200 py-0.5 px-1 font-mono text-right" value={selectedEntity.transform[prop as keyof Transform][axis]} onChange={(e) => updateTransform(axis, prop as any, e.target.value)} />
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
