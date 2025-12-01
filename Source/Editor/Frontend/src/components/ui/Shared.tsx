import React, { useState } from 'react';
import { LucideIcon, FileCode, Folder, Image as ImageIcon, Box } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
  fill?: string;
}
export const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, active = false, onClick, title, className = "", fill }) => (
  <button 
    onClick={onClick} title={title}
    className={`p-1.5 rounded hover:bg-slate-600 transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-400'} ${className}`}
  >
    <Icon size={16} fill={fill} />
  </button>
);

interface MenuBarItemProps {
  label: string;
  items: string[];
  onAction?: (action: string) => void;
}
export const MenuBarItem: React.FC<MenuBarItemProps> = ({ label, items, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div 
      className="relative px-3 py-1 text-xs hover:bg-slate-700 cursor-pointer select-none text-slate-300"
      onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}
    >
      {label}
      {isOpen && (
        <div className="absolute left-0 top-full w-48 bg-slate-800 border border-slate-600 shadow-xl z-50 flex flex-col py-1">
          {items.map((item, i) => (
            <div key={i} onClick={() => { onAction?.(item); setIsOpen(false); }} className="px-4 py-1.5 hover:bg-blue-600 hover:text-white text-slate-300 flex justify-between group">
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AssetTile = ({ name, type }: { name: string, type: string }) => {
  let Icon = FileCode;
  let color = "text-slate-400";
  if (type === 'folder') { Icon = Folder; color = "text-yellow-500"; }
  if (type === 'script') { Icon = FileCode; color = "text-green-500"; }
  if (type === 'texture') { Icon = ImageIcon; color = "text-red-400"; }
  if (type === 'mesh') { Icon = Box; color = "text-blue-400"; }
  
  return (
    <div className="flex flex-col items-center p-2 hover:bg-slate-700 rounded cursor-pointer group w-24 transition-colors">
      <div className="w-16 h-16 bg-slate-800 rounded mb-2 flex items-center justify-center border border-slate-700 group-hover:border-blue-500 shadow-sm relative overflow-hidden">
         <Icon size={32} className={color} />
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>
      <span className="text-[10px] text-slate-300 text-center break-words w-full truncate px-1 bg-slate-800/50 rounded">{name}</span>
    </div>
  );
};
