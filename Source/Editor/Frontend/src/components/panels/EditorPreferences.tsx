import { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { themes, ThemeName } from '../../themes/index';
import { Settings as SettingsIcon, Palette, Keyboard, ChevronDown } from 'lucide-react';

interface EditorPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

type PreferenceTab = 'general' | 'theme' | 'shortcuts';

export function EditorPreferences({ isOpen, onClose }: EditorPreferencesProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<PreferenceTab>('general');

  // If used as a tab, we assume it's always "open" if rendered. 
  // We keep the prop for compatibility if needed, but we don't return null based on it 
  // because the TabSystem handles mounting/unmounting.
  // Actually, if we keep the prop, we should respect it if it was passed as false, 
  // but in the tab system it won't be passed. 
  // Let's just ignore isOpen or assume true.

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: theme.colors.bg.primary }}>
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation */}
        <div
          className="w-48 border-r overflow-y-auto"
          style={{
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default
          }}
        >
          <div className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className="w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-opacity-70 flex items-center gap-2"
              style={{
                backgroundColor: activeTab === 'general' ? theme.colors.bg.elevated : 'transparent',
                color: activeTab === 'general' ? theme.colors.text.primary : theme.colors.text.secondary
              }}
            >
              <SettingsIcon size={16} />
              {t('settings.general')}
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className="w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-opacity-70 flex items-center gap-2"
              style={{
                backgroundColor: activeTab === 'theme' ? theme.colors.bg.elevated : 'transparent',
                color: activeTab === 'theme' ? theme.colors.text.primary : theme.colors.text.secondary
              }}
            >
              <Palette size={16} />
              {t('settings.theme')}
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className="w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-opacity-70 flex items-center gap-2"
              style={{
                backgroundColor: activeTab === 'shortcuts' ? theme.colors.bg.elevated : 'transparent',
                color: activeTab === 'shortcuts' ? theme.colors.text.primary : theme.colors.text.secondary
              }}
            >
              <Keyboard size={16} />
              {t('settings.shortcuts')}
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'theme' && <ThemeSettings />}
          {activeTab === 'shortcuts' && <ShortcutSettings />}
        </div>
      </div>
    </div>
  );
}

function ThemeSettings() {
  const { theme, currentTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          {t('settings.select_theme')}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(themes).map(([key, themeData]) => {
            const isActive = currentTheme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key as ThemeName)}
                className="text-left p-4 rounded border transition-all"
                style={{
                  backgroundColor: isActive ? theme.colors.bg.elevated : theme.colors.bg.secondary,
                  borderColor: isActive ? theme.colors.accent.primary : theme.colors.border.default,
                  borderWidth: isActive ? '2px' : '1px'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{
                          backgroundColor: themeData.colors.bg.primary,
                          borderColor: theme.colors.border.default
                        }}
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{
                          backgroundColor: themeData.colors.accent.primary,
                          borderColor: theme.colors.border.default
                        }}
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{
                          backgroundColor: themeData.colors.text.primary,
                          borderColor: theme.colors.border.default
                        }}
                      />
                    </div>
                    <span className="font-medium" style={{ color: theme.colors.text.primary }}>
                      {themeData.displayName}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      backgroundColor: theme.colors.accent.primary,
                      color: theme.colors.text.primary
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: theme.colors.text.muted }}>
                  {themeData.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-6" style={{ borderColor: theme.colors.border.default }}>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          Color Preview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorPreview label="Primary Background" color={theme.colors.bg.primary} />
          <ColorPreview label="Secondary Background" color={theme.colors.bg.secondary} />
          <ColorPreview label="Primary Accent" color={theme.colors.accent.primary} />
          <ColorPreview label="Secondary Accent" color={theme.colors.accent.secondary} />
          <ColorPreview label="Primary Text" color={theme.colors.text.primary} />
          <ColorPreview label="Secondary Text" color={theme.colors.text.secondary} />
          <ColorPreview label="Success" color={theme.colors.status.success} />
          <ColorPreview label="Error" color={theme.colors.status.error} />
        </div>
      </div>
    </div>
  );
}

function ColorPreview({ label, color }: { label: string; color: string }) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded border"
        style={{
          backgroundColor: color,
          borderColor: theme.colors.border.default
        }}
      />
      <div>
        <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
          {label}
        </div>
        <div className="text-xs font-mono" style={{ color: theme.colors.text.muted }}>
          {color}
        </div>
      </div>
    </div>
  );
}


function GeneralSettings() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          {t('settings.language')}
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
          {t('settings.language_description')}
        </p>

        <div className="relative inline-block w-64">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
            className="w-full appearance-none px-4 py-2 pr-8 rounded border focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.border.default,
              color: theme.colors.text.primary,
              // We'll use the accent color for the focus ring if we could style it easily with style prop, 
              // but focus ring is easier with tailwind classes or css variables. 
              // For now standard border is enough.
            }}
          >
            <option value="en">English (US)</option>
            <option value="fr">Français (FR)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
            <ChevronDown size={16} color={theme.colors.text.secondary} />
          </div>
        </div>

      </div>
    </div>
  );
}

function ShortcutSettings() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const shortcutGroups = [
    {
      category: 'General',
      items: [
        { action: 'Save', keys: 'Ctrl + S' },
        { action: 'Copy', keys: 'Ctrl + C' },
        { action: 'Paste', keys: 'Ctrl + V' },
        { action: 'Undo', keys: 'Ctrl + Z' },
        { action: 'Redo', keys: 'Ctrl + Y' },
      ]
    },
    {
      category: 'Content Browser',
      items: [
        { action: 'Open / Toggle', keys: 'Ctrl + Space' },
        { action: 'Search', keys: 'Ctrl + K' },
        { action: 'Select All', keys: 'Ctrl + A' },
        { action: 'Rename Asset', keys: 'F2' },
        { action: 'Duplicate Asset', keys: 'Ctrl + D' },
        { action: 'Delete Asset', keys: 'Delete' },
      ]
    },
    {
      category: 'Console',
      items: [
        { action: 'Toggle Console', keys: 'Ctrl + I' },
        { action: 'Clear Output', keys: 'Ctrl + L' },
      ]
    },
    {
      category: 'Material Editor',
      items: [
        { action: 'Align Nodes Vertically', keys: 'Q' },
        { action: 'Create Comment', keys: 'Ctrl + /' },
        { action: 'Fit View', keys: 'Ctrl + F' },
        { action: 'Lock/Unlock Interactivity', keys: 'Ctrl + L' },
        { action: 'Zoom In', keys: 'Ctrl + +' },
        { action: 'Zoom Out', keys: 'Ctrl + -' },
      ]
    },
    {
      category: 'Audio Preview',
      items: [
        { action: 'Play / Pause', keys: 'Space' },
        { action: 'Toggle Loop', keys: 'L' },
        { action: 'Mute', keys: 'M' },
        { action: 'Rewind', keys: 'Backspace / Home' }
      ]
    },
    {
      category: 'Viewport',
      items: [
        { action: 'Movement', keys: 'Z, Q, S, D / Arrow Keys' },
        { action: 'Elevation', keys: 'Shift (Up), Ctrl (Down)' },
        { action: 'Roll', keys: 'A, E' },
        { action: 'Look', keys: 'Right Click + Mouse' }
      ]
    },
    {
      category: 'Simulation',
      items: [
        { action: 'Play', keys: 'F5' },
        { action: 'Stop', keys: 'Shift + F5' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          Keyboard Shortcuts
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.colors.text.muted }}>
          List of keyboard shortcuts arranged by category.
        </p>
      </div>

      <div className="space-y-6">
        {shortcutGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <h4 className="text-sm font-medium border-b pb-1" style={{
              color: theme.colors.text.secondary,
              borderColor: theme.colors.border.subtle || theme.colors.border.default
            }}>
              {group.category}
            </h4>
            <div className="space-y-1">
              {group.items.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 hover:bg-opacity-50 rounded"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : theme.colors.bg.secondary
                  }}
                >
                  <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                    {shortcut.action}
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-1 rounded min-w-[30px] text-center"
                    style={{
                      backgroundColor: theme.colors.bg.elevated,
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.default}`
                    }}
                  >
                    {shortcut.keys}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded" style={{
        backgroundColor: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.default}`
      }}>
        <p className="text-xs" style={{ color: theme.colors.text.muted }}>
          💡 Shortcut customization will be available in a future version.
        </p>
      </div>
    </div>
  );
}
