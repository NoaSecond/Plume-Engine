import React, { useState, useEffect } from 'react';
import { LucideIcon, FileCode, Folder, Image as ImageIcon, Box, Music, File, Globe, Layers, Bone, Film } from 'lucide-react';
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

export const AssetTile = ({ id, name, type, selected = false, onClick, onDoubleClick, onContextMenu, meta }: { id?: string, name: string, type: string, selected?: boolean, onClick?: (e: React.MouseEvent) => void, onDoubleClick?: (e: React.MouseEvent) => void, onContextMenu?: (e: React.MouseEvent, info: { name: string, type: string }) => void, meta?: any }) => {
  const { theme } = useTheme();
  let Icon = File;
  let color = "#9ca3af"; // gray-400

  if (type === 'folder') {
    Icon = Folder;
    color = "#eab308"; // yellow-500
  }

  const lowerType = type ? type.toLowerCase() : '';
  const lowerName = name ? name.toLowerCase() : '';

  // Specific Asset Types
  if (lowerType === 'staticmesh' || lowerType === 'mesh' || lowerName.endsWith('.plume_mesh') || lowerName.endsWith('.fbx') || lowerName.endsWith('.obj')) {
    Icon = Box;
    color = "#5DE2E7"; // StaticMesh
  }
  else if (lowerType === 'texture' || lowerType === 'image' || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.tga')) {
    Icon = ImageIcon;
    color = "#D05C5E"; // Texture
  }
  else if (lowerType === 'soundwave' || lowerType === 'sound' || lowerName.endsWith('.wav') || lowerName.endsWith('.mp3')) {
    Icon = Music;
    color = "#CC6CE7"; // Sound
  }
  else if (lowerType === 'material' || lowerName.endsWith('.plumematerial')) {
    Icon = Layers;
    color = "#7DDA58"; // Material
  }
  else if (lowerType === 'level' || lowerType === 'map' || lowerName.endsWith('.plumemap') || lowerName.endsWith('.map')) {
    Icon = Globe;
    color = "#FE9900"; // Level
  }
  else if (lowerType === 'skeletalmesh' || lowerName.endsWith('.plumeskel')) {
    Icon = Bone;
    color = "#FFECA1"; // SkeletalMesh
  }
  else if (lowerType === 'animationsequence' || lowerType === 'anim' || lowerName.endsWith('.plumeanim')) {
    Icon = Film;
    color = "#BFD641"; // AnimationSequence
  }
  else if (lowerType === 'script' || lowerName.endsWith('.ts') || lowerName.endsWith('.js')) {
    Icon = FileCode;
    color = "#22c55e"; // green-500 for scripts
  }

  // Plume meta files
  if (name === '.plume_meta' || name.endsWith('.plume_meta')) {
    Icon = FileCode;
    color = theme.colors.accent.secondary;
  }

  // if meta.color provided, prefer it (strip leading '#')
  let finalColor = color;
  try {
    // @ts-ignore
    if (meta && meta.color) {
      // ensure string and remove leading '#'
      const mcol: string = typeof meta.color === 'string' ? (meta.color as string) : '';
      if (mcol.length > 0) finalColor = mcol.startsWith('#') ? mcol : ('#' + mcol);
    }
  } catch (e) { }

  const displayName = name.replace(/\.(plumeasset|plume_mesh|fbx|obj|gltf|glb|png|jpg|jpeg|tga|bmp|wav|mp3|ogg|plumematerial|plumemap|plumeskel|plumeanim)$/i, '');

  return (
    <div
      className="flex flex-col items-center p-2 rounded cursor-pointer group w-24 transition-colors"
      onClick={(e) => onClick?.(e)}
      onDoubleClick={(e) => onDoubleClick?.(e)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, { name, type });
      }}
      style={{
        backgroundColor: selected ? theme.colors.bg.elevated : undefined,
        border: selected ? `1px solid ${theme.colors.accent.primary}` : undefined
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
        <Icon
          size={32}
          color={finalColor}
          fill={type === 'folder' ? 'none' : (name === '.plume_meta' || name.endsWith('.plume_meta') ? finalColor : "none")}
          stroke={type === 'folder' ? finalColor : (name === '.plume_meta' || name.endsWith('.plume_meta') ? finalColor : finalColor)}
          strokeWidth={type === 'folder' || name === '.plume_meta' || name.endsWith('.plume_meta') ? 1.5 : 2}
        />
      </div>
      <span
        className="text-[10px] text-center break-words w-full truncate px-1 rounded"
        style={{
          color: selected ? theme.colors.text.primary : theme.colors.text.secondary,
          backgroundColor: 'transparent'
        }}
        title={displayName}
      >
        {displayName}
      </span>
    </div>
  );
};
