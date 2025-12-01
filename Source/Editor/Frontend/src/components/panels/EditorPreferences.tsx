import { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { themes, ThemeName } from '../../themes';

interface EditorPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

type PreferenceTab = 'theme' | 'shortcuts';

export function EditorPreferences({ isOpen, onClose }: EditorPreferencesProps) {
  const { theme, currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<PreferenceTab>('theme');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div 
        className="w-[900px] h-[600px] flex flex-col rounded-lg shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: theme.colors.bg.primary,
          border: `1px solid ${theme.colors.border.default}`
        }}
      >
        {/* Header */}
        <div 
          className="h-12 flex items-center justify-between px-4 border-b"
          style={{ 
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            Editor Preferences
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: theme.colors.bg.elevated }}
          >
            <span style={{ color: theme.colors.text.secondary }}>✕</span>
          </button>
        </div>

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
                onClick={() => setActiveTab('theme')}
                className="w-full text-left px-3 py-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: activeTab === 'theme' ? theme.colors.bg.elevated : 'transparent',
                  color: activeTab === 'theme' ? theme.colors.text.primary : theme.colors.text.secondary
                }}
              >
                Thèmes
              </button>
              <button
                onClick={() => setActiveTab('shortcuts')}
                className="w-full text-left px-3 py-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: activeTab === 'shortcuts' ? theme.colors.bg.elevated : 'transparent',
                  color: activeTab === 'shortcuts' ? theme.colors.text.primary : theme.colors.text.secondary
                }}
              >
                Raccourcis
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'theme' && <ThemeSettings />}
            {activeTab === 'shortcuts' && <ShortcutSettings />}
          </div>
        </div>

        {/* Footer */}
        <div 
          className="h-12 flex items-center justify-end gap-2 px-4 border-t"
          style={{ 
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-sm transition-colors"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: theme.colors.text.primary
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeSettings() {
  const { theme, currentTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          Sélection du thème
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
                      Actif
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
          Aperçu des couleurs
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorPreview label="Background Principal" color={theme.colors.bg.primary} />
          <ColorPreview label="Background Secondaire" color={theme.colors.bg.secondary} />
          <ColorPreview label="Accent Principal" color={theme.colors.accent.primary} />
          <ColorPreview label="Accent Secondaire" color={theme.colors.accent.secondary} />
          <ColorPreview label="Texte Principal" color={theme.colors.text.primary} />
          <ColorPreview label="Texte Secondaire" color={theme.colors.text.secondary} />
          <ColorPreview label="Succès" color={theme.colors.status.success} />
          <ColorPreview label="Erreur" color={theme.colors.status.error} />
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

function ShortcutSettings() {
  const { theme } = useTheme();

  const shortcuts = [
    { action: 'Sauvegarder', keys: 'Ctrl + S' },
    { action: 'Ouvrir Content Browser', keys: 'Ctrl + Space' },
    { action: 'Clear Console', keys: 'Ctrl + L' },
    { action: 'Play', keys: 'F5' },
    { action: 'Stop', keys: 'Shift + F5' },
    { action: 'Renommer', keys: 'F2' },
    { action: 'Dupliquer', keys: 'Ctrl + D' },
    { action: 'Supprimer', keys: 'Suppr' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: theme.colors.text.primary }}>
          Raccourcis clavier
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.colors.text.muted }}>
          Liste des raccourcis clavier disponibles dans l'éditeur.
        </p>
      </div>

      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded"
            style={{ backgroundColor: theme.colors.bg.secondary }}
          >
            <span className="text-sm" style={{ color: theme.colors.text.primary }}>
              {shortcut.action}
            </span>
            <span 
              className="text-xs font-mono px-2 py-1 rounded"
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

      <div className="mt-6 p-4 rounded" style={{ 
        backgroundColor: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.default}`
      }}>
        <p className="text-xs" style={{ color: theme.colors.text.muted }}>
          💡 La personnalisation des raccourcis sera disponible dans une prochaine version.
        </p>
      </div>
    </div>
  );
}
