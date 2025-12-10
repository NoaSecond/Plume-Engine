import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext';
import { LogEntry } from '../../types';

interface ConsolePanelProps {
  logs: LogEntry[];
  onClear: () => void;
  onExecuteCommand: (command: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ConsolePanel({ logs, onClear, onExecuteCommand, isOpen, setIsOpen }: ConsolePanelProps) {
  const { theme } = useTheme();
  const [command, setCommand] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [showError, setShowError] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Handle Ctrl+L keyboard shortcut for clearing console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l' && isOpen) {
        e.preventDefault();
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClear]);

  // Focus the command input when the console opens
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  const filteredLogs = logs.filter(log => {
    if (log.level === 'INFO' && !showInfo) return false;
    if (log.level === 'WARN' && !showWarning) return false;
    if (log.level === 'ERROR' && !showError) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onExecuteCommand(command);
      setCommand('');
      inputRef.current?.focus();
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return theme.colors.text.primary;
      case 'WARN':
        return theme.colors.status.warning;
      case 'ERROR':
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  return (
    <div
      className="fixed left-0 right-0 h-48 shadow-2xl transition-transform duration-300 ease-out flex flex-col"
      style={{
        backgroundColor: theme.colors.bg.primary,
        borderTop: `1px solid ${theme.colors.accent.primary}`,
        zIndex: 40,
        bottom: '24px',
        transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
        pointerEvents: isOpen ? 'auto' : 'none',
        willChange: 'transform'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1 border-b text-xs"
        style={{ borderColor: theme.colors.border.default }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: theme.colors.text.primary }}>Console</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showInfo}
                onChange={(e) => setShowInfo(e.target.checked)}
                className="w-3 h-3"
              />
              <span style={{ color: theme.colors.text.secondary }}>Info</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showWarning}
                onChange={(e) => setShowWarning(e.target.checked)}
                className="w-3 h-3"
              />
              <span style={{ color: theme.colors.status.warning }}>Warning</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showError}
                onChange={(e) => setShowError(e.target.checked)}
                className="w-3 h-3"
              />
              <span style={{ color: theme.colors.status.error }}>Error</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: theme.colors.bg.elevated,
              color: theme.colors.text.secondary,
            }}
            title="Clear Console (Ctrl+L)"
          >
            Clear (Ctrl+L)
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: theme.colors.bg.elevated,
              color: theme.colors.text.secondary,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Log Output */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-2">
        {filteredLogs.length === 0 ? (
          <div style={{ color: theme.colors.text.muted }}>
            Aucun log à afficher...
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex gap-2 py-0.5 hover:bg-opacity-10"
              style={{
                color: getLogColor(log.level),
              }}
            >
              <span style={{ color: theme.colors.text.muted }}>[{log.time}]</span>
              <span className="font-semibold">[{log.level}]</span>
              <span>{log.msg}</span>
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-2"
        style={{ borderColor: theme.colors.border.default }}
      >
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            // Allow shortcuts (Ctrl/Alt/Meta) and Escape to propagate so global
            // handlers (eg. Ctrl+I, Ctrl+Space) still work. Only stop propagation
            // for normal typing keys.
            if (!(e.ctrlKey || e.altKey || e.metaKey) && e.key !== 'Escape') {
              e.stopPropagation();
            }
          }}
          onKeyUp={(e) => {
            if (!(e.ctrlKey || e.altKey || e.metaKey) && e.key !== 'Escape') {
              e.stopPropagation();
            }
          }}
          placeholder="Entrez une commande (ex: r.ShowHitboxes 1)..."
          ref={inputRef}
          className="w-full px-2 py-1 text-xs font-mono rounded outline-none"
          style={{
            backgroundColor: theme.colors.bg.primary,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.default}`,
          }}
          onFocus={(e) => (e.target.style.borderColor = theme.colors.border.focus)}
          onBlur={(e) => (e.target.style.borderColor = theme.colors.border.default)}
        />
      </form>
    </div>
  );
}
