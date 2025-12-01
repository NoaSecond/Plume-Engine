import React, { useRef, useEffect } from 'react';
import { ChevronRight, Search, Folder, X, ChevronDown } from 'lucide-react';
import { AssetTile } from '../ui/Shared';
interface ContentBrowserProps { show: boolean; onClose: () => void; onLog: (msg: string, type: 'WARN' | 'INFO' | 'ERROR') => void; searchQuery: string; setSearchQuery: (q: string) => void; }
export const ContentBrowserPanel: React.FC<ContentBrowserProps> = ({ show, onClose, onLog, searchQuery, setSearchQuery }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (show && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 50); }, [show]);
  
  return (
    <div className="fixed left-0 right-0 bg-[#1e1e1e] border-t border-blue-500 shadow-2xl transition-transform duration-300 ease-out z-40 flex flex-col" style={{ height: '35vh', bottom: '24px', transform: show ? 'translateY(0)' : 'translateY(calc(100% + 24px))', pointerEvents: show ? 'auto' : 'none' }}>
      <div className="h-10 bg-[#252525] flex items-center justify-between px-4 border-b border-black shrink-0">
        <div className="flex items-center space-x-2"><span className="font-bold text-sm">Content Browser</span><div className="flex space-x-1 ml-4 text-slate-400"><ChevronRight size={16} className="rotate-180"/><ChevronRight size={16}/></div><div className="ml-2 flex items-center bg-[#151515] border border-black rounded px-2 py-0.5 w-64 focus-within:border-blue-500"><Search size={12} className="text-slate-500 mr-2"/><input ref={searchInputRef} type="text" placeholder="Filter assets..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
        <div className="flex items-center space-x-2"><button className="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 text-white font-medium shadow-sm" onClick={() => onLog("Import not implemented", "WARN")}>Import</button><button className="p-1 hover:bg-slate-700 rounded ml-2 text-slate-400 hover:text-white" onClick={onClose}><X size={16} /></button></div>
      </div>
      <div className="flex-1 flex overflow-hidden">
         <div className="w-48 bg-[#1a1a1a] border-r border-black p-2 overflow-y-auto">
            <div className="text-xs text-slate-300 font-bold mb-2 flex items-center"><ChevronDown size={12} className="mr-1"/> Root</div>
            <div className="pl-4 space-y-1"><div className="flex items-center text-xs text-blue-400 bg-slate-800 rounded px-1 py-0.5"><Folder size={12} className="mr-2 fill-current"/> Game</div></div>
         </div>
         <div className="flex-1 bg-[#151515] p-2 overflow-y-auto"><div className="flex flex-wrap gap-2 content-start"><AssetTile name="Maps" type="folder" /><AssetTile name="Scripts" type="folder" /></div></div>
      </div>
    </div>
  );
};
