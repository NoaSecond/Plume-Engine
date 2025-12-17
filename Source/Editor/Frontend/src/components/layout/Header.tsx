import React from 'react';
import { MenuBarItem } from '../ui/Shared';
import { PlumeLogo } from '../ui/PlumeLogo';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { Minus, Square, X } from 'lucide-react';

interface HeaderProps {
  isPlaying: boolean;
  onSave: () => void;
  onAbout: () => void;
  onPreferences: () => void;
  onPlugins: () => void;
  onProjectSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isPlaying, onSave, onAbout, onPreferences, onPlugins, onProjectSettings }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Allow drag only on header background, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('.menu-item-container') ||
      target.classList.contains('menu-label')) {
      return;
    }

    // Envoyer un message au backend pour commencer le drag
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'start-drag' });
    }
  };

  const handleMinimize = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'minimize' });
    }
  };

  const handleMaximize = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'maximize' });
    }
  };

  const handleClose = () => {
    // @ts-ignore
    if (window.chrome?.webview) {
      // @ts-ignore
      window.chrome.webview.postMessage({ action: 'close' });
    }
  };

  return (
    <div
      className="h-8 flex items-center px-2 border-b shrink-0"
      onMouseDown={handleHeaderMouseDown}
      style={{
        backgroundColor: theme.colors.bg.secondary,
        borderColor: theme.colors.border.default
      }}
    >
      <div className="flex items-center mr-6 font-bold tracking-wider select-none">
        <PlumeLogo />
        <span style={{ color: theme.colors.text.primary }}>PLUME</span>
        <span className="ml-0.5" style={{ color: theme.colors.accent.primary }}>ENGINE</span>
      </div>
      <div className="flex space-x-1 h-full items-center">
        <MenuBarItem
          label={t('menu.file')}
          items={[
            t('menu.file.new_level'),
            t('menu.file.open_level'),
            t('menu.file.save'),
            t('menu.file.save_as'),
            t('menu.file.import_asset'),
            t('menu.file.export_project'),
            t('menu.file.exit')
          ]}
          onAction={(a) => a === t('menu.file.save') && onSave()}
        />
        <MenuBarItem
          label={t('menu.edit')}
          items={[
            t('menu.edit.undo'),
            t('menu.edit.redo'),
            t('menu.edit.preferences'),
            t('menu.edit.project_settings')
          ]}
          onAction={(a) => {
            if (a === t('menu.edit.preferences')) onPreferences();
            if (a === t('menu.edit.project_settings')) onProjectSettings();
          }}
        />
        <MenuBarItem
          label={t('menu.window')}
          items={[
            t('menu.window.viewport'),
            t('menu.window.outliner'),
            t('menu.window.details'),
            t('menu.window.content_browser'),
            t('menu.window.console')
          ]}
        />
        <MenuBarItem
          label={t('menu.tools')}
          items={[
            t('menu.tools.plugins'),
            t('menu.tools.build_all')
          ]}
          onAction={(a) => a === t('menu.tools.plugins') && onPlugins()}
        />
        <MenuBarItem
          label={t('menu.help')}
          items={[
            t('menu.help.website'),
            t('menu.help.documentation'),
            t('menu.help.repository'),
            t('menu.help.about')
          ]}
          onAction={(a) => a === t('menu.help.about') && onAbout()}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="text-xs font-mono" style={{ color: theme.colors.text.muted }}>
          {isPlaying ? (
            <span className="animate-pulse" style={{ color: theme.colors.status.success }}>● {t('header.running')}</span>
          ) : (
            <span>{t('header.editor_mode')}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-1 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={t('header.minimize')}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={t('header.maximize')}
          >
            <Square size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
            title={t('header.close')}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
