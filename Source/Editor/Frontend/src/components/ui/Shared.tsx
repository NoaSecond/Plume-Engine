import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
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

  // couter les vnements globaux
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

export interface AssetTileProps {
  id?: string;
  name: string;
  type: string;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, info: { name: string, type: string }) => void;
  meta?: any;
  scale?: number;
  searchQuery?: string;
}

import { getAssetDefinition } from '../../utils/AssetUtils';

// Helper import is at top of file, so we will handle imports separately if needed.
// But first, let's replace the logic inside AssetTile.

export const AssetTile = ({ id, name, type, selected = false, onClick, onDoubleClick, onContextMenu, meta, scale = 1, searchQuery = '' }: AssetTileProps) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const { Icon, color } = getAssetDefinition(type, name, meta?.color, theme);

  // getAssetDefinition already handles meta.color logic if passed
  const finalColor = color;

  const displayName = name.replace(/\.(plumeasset|fbx|obj|gltf|glb|png|jpg|jpeg|tga|bmp|wav|mp3|ogg|plumeskel|plumeanim)$/i, '');

  const baseSize = 96; // w-24 equivalent roughly
  const size = Math.round(baseSize * scale);

  const isMetaFile = name === '.plume_meta' || name.endsWith('.plume_meta');
  const isFolder = type === 'folder';

  // Determine styles based on state
  const fill = isFolder ? 'none' : (isMetaFile ? finalColor : "none");
  const stroke = isFolder || isMetaFile ? finalColor : finalColor;
  const strokeWidth = isFolder || isMetaFile ? 1.5 : 2;

  const textBgColor = selected
    ? (theme.name === 'feather-light' ? theme.colors.accent.primary : 'transparent')
    : 'transparent';

  return (
    <div
      draggable={!!id}
      onDragStart={(e) => {
        if (id) {
          console.log('AssetTile: DragStart', { id, name, type });
          const data = JSON.stringify({ id, name, type, meta });
          e.dataTransfer.setData('application/plume-asset', data);
          e.dataTransfer.setData('text/plain', data); // Fallback for wider compatibility
          e.dataTransfer.effectAllowed = 'all';
        }
      }}
      className="flex flex-col items-center p-2 rounded cursor-pointer group transition-all duration-75"
      style={{
        width: `${size}px`,
        backgroundColor: selected ? theme.colors.selection.background : (isHovered ? theme.colors.bg.elevated : 'transparent'),
        transform: isHovered ? 'translateY(-1px)' : 'none'
      }}
      onClick={(e) => onClick?.(e)}
      onDoubleClick={(e) => onDoubleClick?.(e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e, { name, type });
      }}
    >
      <div
        className="rounded mb-2 flex items-center justify-center border shadow-sm relative overflow-hidden transition-colors"
        style={{
          backgroundColor: theme.colors.bg.secondary,
          borderColor: (selected || isHovered) ? theme.colors.accent.primary : theme.colors.border.default,
          borderWidth: (selected || isHovered) ? '1px' : '1px',
          width: `${Math.round(size * 0.66)}px`, // Icon container relative size
          height: `${Math.round(size * 0.66)}px`
        }}
      >
        <Icon
          size={Math.round(32 * scale)}
          color={finalColor}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </div>
      <span
        className="text-[10px] text-center w-full px-1 rounded break-words whitespace-normal"
        style={{
          color: selected ? '#FFFFFF' : theme.colors.text.secondary,
          backgroundColor: textBgColor,
          textShadow: selected ? '0px 1px 2px rgba(0,0,0,0.8)' : 'none', // Strong shadow for white text visibility
          fontWeight: 'normal',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.2em',
          height: '2.4em'
        }}
        title={displayName}
      >
        {(() => {
          if (!searchQuery) return displayName;
          const index = displayName.toLowerCase().indexOf(searchQuery.toLowerCase());
          if (index === -1) return displayName;
          const before = displayName.substring(0, index);
          const match = displayName.substring(index, index + searchQuery.length);
          const after = displayName.substring(index + searchQuery.length);
          return (
            <>
              {before}
              <span style={{ backgroundColor: theme.colors.accent.secondary, color: '#fff', borderRadius: '2px', padding: '0 2px' }}>{match}</span>
              {after}
            </>
          );
        })()}
      </span>
    </div >
  );
};
