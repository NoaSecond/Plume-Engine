import React, { useRef, useEffect } from 'react';
import { ChevronRight, Search, Folder, X, ChevronDown } from 'lucide-react';
import { AssetTile } from '../ui/Shared';
import { useTheme } from '../../ThemeContext';
interface ContentBrowserProps { show: boolean; onClose: () => void; onLog: (msg: string, type: 'WARN' | 'INFO' | 'ERROR') => void; searchQuery: string; setSearchQuery: (q: string) => void; }
export const ContentBrowserPanel: React.FC<ContentBrowserProps> = ({ show, onClose, onLog, searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (show && searchInputRef.current) setTimeout(() => searchInputRef.current?.focus(), 50); }, [show]);
  
  return (
    <div 
      className="fixed left-0 right-0 shadow-2xl transition-transform duration-300 ease-out flex flex-col"
      style={{ 
        backgroundColor: theme.colors.bg.primary,
        borderTop: `1px solid ${theme.colors.accent.primary}`,
        height: '35vh', 
        bottom: '24px', 
        zIndex: 40,
        transform: show ? 'translateY(0)' : 'translateY(calc(100% + 24px))', 
        pointerEvents: show ? 'auto' : 'none',
        willChange: 'transform'
      }}
    >
      <div 
        className="h-10 flex items-center justify-between px-4 shrink-0"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderBottom: `1px solid ${theme.colors.border.default}`
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm" style={{ color: theme.colors.text.primary }}>
            Content Browser
          </span>
          <div className="flex space-x-1 ml-4" style={{ color: theme.colors.text.secondary }}>
            <ChevronRight size={16} className="rotate-180"/>
            <ChevronRight size={16}/>
          </div>
          <div 
            className="ml-2 flex items-center rounded px-2 py-0.5 w-64 border transition-colors"
            style={{
              backgroundColor: theme.colors.bg.primary,
              borderColor: theme.colors.border.default
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border.default;
            }}
          >
            <Search size={12} className="mr-2" style={{ color: theme.colors.text.muted }}/>
            <input 
              ref={searchInputRef} 
              type="text" 
              placeholder="Filter assets..." 
              className="bg-transparent border-none outline-none text-xs w-full" 
              style={{ color: theme.colors.text.primary }}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="text-xs px-3 py-1 rounded font-medium shadow-sm transition-colors"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: theme.colors.text.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.primary;
            }}
            onClick={() => onLog("Import not implemented", "WARN")}
          >
            Import
          </button>
          <button 
            className="p-1 rounded ml-2 transition-colors"
            style={{ color: theme.colors.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
              e.currentTarget.style.color = theme.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.text.secondary;
            }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
         <div 
           className="w-48 p-2 overflow-y-auto"
           style={{
             backgroundColor: theme.colors.bg.elevated,
             borderRight: `1px solid ${theme.colors.border.default}`
           }}
         >
            <div 
              className="text-xs font-bold mb-2 flex items-center"
              style={{ color: theme.colors.text.secondary }}
            >
              <ChevronDown size={12} className="mr-1"/> Root
            </div>
            <div className="pl-4 space-y-1">
              <div 
                className="flex items-center text-xs rounded px-1 py-0.5"
                style={{
                  color: theme.colors.accent.primary,
                  backgroundColor: theme.colors.bg.secondary
                }}
              >
                <Folder size={12} className="mr-2 fill-current"/> Game
              </div>
            </div>
         </div>
         <div 
           className="flex-1 p-2 overflow-y-auto"
           style={{ backgroundColor: theme.colors.bg.secondary }}
         >
           <div className="flex flex-wrap gap-2 content-start">
             <AssetTile name="Maps" type="folder" />
             <AssetTile name="Scripts" type="folder" />
           </div>
         </div>
      </div>
    </div>
  );
};
