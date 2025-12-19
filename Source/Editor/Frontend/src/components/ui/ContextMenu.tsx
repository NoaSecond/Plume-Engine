import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../ThemeContext';

export type ContextMenuItem = {
  id: string;
  label?: string;
  shortcut?: string;
  disabled?: boolean;
  type?: 'item' | 'separator';
};

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
  direction?: 'up' | 'down';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onSelect, onClose, direction = 'down' }) => {
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

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    zIndex: 9999,
    opacity: isOpen ? 1 : 0,
    transition: 'opacity 140ms cubic-bezier(.2,.8,.2,1), transform 140ms cubic-bezier(.2,.8,.2,1)'
  };

  if (direction === 'up') {
    style.bottom = window.innerHeight - y;
    style.top = 'auto';
    style.transform = isOpen ? 'translateY(0)' : 'translateY(6px)';
  } else {
    style.top = y;
    style.transform = isOpen ? 'translateY(0)' : 'translateY(-6px)';
  }

  const menu = (
    <div
      ref={menuRef}
      className="fixed rounded shadow-xl"
      style={style}
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
          it.type === 'separator' ? (
            <div key={it.id} className="my-1 border-t" style={{ borderColor: theme.colors.border.default }} />
          ) : (
            <div
              key={it.id}
              className="px-4 py-2 text-sm cursor-pointer select-none"
              onMouseDown={(e) => {
                // handle selection on mouseDown to avoid other handlers closing the menu first
                if (!it.disabled) {
                  onSelect(it.id);
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={() => {
                // fallback: ensure the handler runs if mouseDown wasn't used
                if (!it.disabled) onSelect(it.id);
              }}
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
                {it.shortcut && <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 16 }}>{it.shortcut}</span>}
              </div>
            </div>
          )
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
