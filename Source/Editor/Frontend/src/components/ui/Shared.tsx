import React, { useState, useEffect } from 'react';
import { LucideIcon, FileCode, Folder, Image as ImageIcon, Box } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface IconButtonProps {
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
  fill?: string;
}
export const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, active = false, onClick, title, className = "", fill }) => {
  const { theme } = useTheme();
  
  return (
    <button 
      onClick={onClick} 
      title={title}
      className={`p-1.5 rounded transition-colors ${className}`}
      style={{
        backgroundColor: active ? theme.colors.accent.primary : 'transparent',
        color: active ? theme.colors.text.primary : theme.colors.text.secondary
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Icon size={16} fill={fill} />
    </button>
  );
};

interface MenuBarItemProps {
  label: string;
  items: string[];
  onAction?: (action: string) => void;
}
export const MenuBarItem: React.FC<MenuBarItemProps> = ({ label, items, onAction }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    // Fermer tous les autres menus
    if (!isOpen) {
      document.dispatchEvent(new CustomEvent('closeAllMenus', { detail: { except: label } }));
    }
  };
  
  const handleItemClick = (item: string) => {
    onAction?.(item);
    setIsOpen(false);
  };
  
  // Écouter les événements globaux
  useEffect(() => {
    const handleCloseAllMenus = (event: CustomEvent) => {
      if (event.detail.except !== label) {
        setIsOpen(false);
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-item-container')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('closeAllMenus', handleCloseAllMenus as EventListener);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('closeAllMenus', handleCloseAllMenus as EventListener);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [label]);
  
  return (
    <div className="menu-item-container relative">
      <div 
        className="menu-label px-3 py-1 text-xs cursor-pointer select-none transition-colors duration-150"
        onClick={handleClick}
        style={{
          color: theme.colors.text.primary
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {label}
      </div>
      {isOpen && (
        <div 
          className="menu-dropdown absolute left-0 top-full w-48 shadow-xl z-50 flex flex-col rounded-md overflow-hidden"
          style={{
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default,
            border: `1px solid ${theme.colors.border.default}`,
            padding: '0.25rem 0'
          }}
        >
          {items.map((item, i) => (
            <div 
              key={i} 
              onClick={() => handleItemClick(item)} 
              className="px-4 py-1.5 text-xs flex justify-between group cursor-pointer transition-colors duration-150"
              style={{
                color: theme.colors.text.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent.primary;
                e.currentTarget.style.color = theme.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.text.primary;
              }}
            >
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AssetTile = ({ name, type, onContextMenu }: { name: string, type: string, onContextMenu?: (e: React.MouseEvent, info: { name: string, type: string }) => void }) => {
  const { theme } = useTheme();
  let Icon = FileCode;
  let color = theme.colors.text.muted;
  
  if (type === 'folder') { 
    Icon = Folder; 
    color = "#eab308"; // yellow-500 
  }
  if (type === 'script') { 
    Icon = FileCode; 
    color = "#22c55e"; // green-500
  }
  if (type === 'texture') { 
    Icon = ImageIcon; 
    color = "#f87171"; // red-400
  }
  if (type === 'mesh') { 
    Icon = Box; 
    color = "#60a5fa"; // blue-400
  }
  
  return (
    <div 
      className="flex flex-col items-center p-2 rounded cursor-pointer group w-24 transition-colors"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, { name, type });
      }}
    >
      <div 
        className="w-16 h-16 rounded mb-2 flex items-center justify-center border shadow-sm relative overflow-hidden transition-colors"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderColor: theme.colors.border.default
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.colors.accent.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border.default;
        }}
      >
         <Icon size={32} style={{ color }} />
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>
      <span 
        className="text-[10px] text-center break-words w-full truncate px-1 rounded"
        style={{
          color: theme.colors.text.secondary,
          backgroundColor: `${theme.colors.bg.secondary}80` // 50% opacity
        }}
      >
        {name}
      </span>
    </div>
  );
};
