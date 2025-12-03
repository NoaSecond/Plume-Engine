import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../ThemeContext';

export type ContextMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onSelect, onClose }) => {
  const { theme } = useTheme();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger open animation on next frame
    const id = requestAnimationFrame(() => setIsOpen(true));
    return () => {
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // close on left click outside menu
      if (e.button === 0) {
        if (!menuRef.current || !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      }
    };

    const onContextMenuCapture = (e: Event) => {
      // capture phase: if right-click outside menu, close current menu
      if (!menuRef.current || !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
      // do not stop propagation; allow target handlers to open a new menu
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('contextmenu', onContextMenuCapture, true); // capture

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('contextmenu', onContextMenuCapture, true);
    };
  }, [onClose]);

  const menu = (
    <div
      ref={menuRef}
      className="fixed rounded shadow-xl"
      style={{
        left: x,
        top: y,
        zIndex: 9999,
        transform: isOpen ? 'translateY(0)' : 'translateY(6px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 140ms cubic-bezier(.2,.8,.2,1), transform 140ms cubic-bezier(.2,.8,.2,1)'
      }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      <div
        style={{
          backgroundColor: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          color: theme.colors.text.primary,
          minWidth: 200,
          boxShadow: `0 6px 20px rgba(0,0,0,0.25)`
        }}
        className="rounded overflow-hidden transition-all"
      >
        {items.map((it) => (
          <div
            key={it.id}
            className="px-4 py-2 text-sm cursor-pointer select-none"
            onClick={() => { if (!it.disabled) onSelect(it.id); }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.backgroundColor = theme.colors.accent.primary;
              el.style.color = theme.colors.text.primary;
              el.style.transition = 'background-color 120ms ease';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = theme.colors.text.primary;
            }}
            style={{ opacity: it.disabled ? 0.5 : 1 }}
            role="menuitem"
            tabIndex={0}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{it.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(menu, document.body);
  }

  return menu;
};

export default ContextMenu;
