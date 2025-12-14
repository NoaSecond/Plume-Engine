import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle2, Circle } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface PluginInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'Official' | 'Community' | 'System';
  enabled: boolean;
}

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: any[];
  onTogglePlugin: (id: string, enabled: boolean) => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({ isOpen, onClose, plugins, onTogglePlugin }) => {
  const { theme } = useTheme();
  // plugins state moved to parent
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'enabled' | 'Official' | 'Community'>('all');

  const togglePlugin = (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId);
    if (plugin) {
      onTogglePlugin(pluginId, !plugin.enabled);
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'enabled') return matchesSearch && plugin.enabled;
    return matchesSearch && plugin.category === selectedCategory;
  });

  const getCategoryCount = (category: 'all' | 'enabled' | 'Official' | 'Community') => {
    if (category === 'all') return plugins.length;
    if (category === 'enabled') return plugins.filter(p => p.enabled).length;
    return plugins.filter(p => p.category === category).length;
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: theme.colors.bg.primary,
        color: theme.colors.text.primary
      }}
    >
      {/* Search Bar */}
      <div
        className="px-6 py-3 border-b"
        style={{ borderColor: theme.colors.border.default }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.text.muted }} />
          <input
            type="text"
            placeholder="Rechercher un plugin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded border focus:outline-none transition-colors"
            style={{
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.border.default,
              color: theme.colors.text.primary
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-56 border-r p-4 overflow-y-auto"
          style={{ borderColor: theme.colors.border.default }}
        >
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded transition-colors hover:bg-opacity-10 hover:bg-white ${selectedCategory === 'all' ? 'bg-opacity-10 bg-white' : ''
                }`}
              style={{
                color: selectedCategory === 'all' ? theme.colors.accent.primary : theme.colors.text.secondary
              }}
            >
              <div className="flex items-center justify-between">
                <span>Tous les plugins</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: theme.colors.bg.tertiary }}
                >
                  {getCategoryCount('all')}
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('enabled')}
              className={`w-full text-left px-3 py-2 rounded transition-colors hover:bg-opacity-10 hover:bg-white ${selectedCategory === 'enabled' ? 'bg-opacity-10 bg-white' : ''
                }`}
              style={{
                color: selectedCategory === 'enabled' ? theme.colors.accent.primary : theme.colors.text.secondary
              }}
            >
              <div className="flex items-center justify-between">
                <span>Plugins activés</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: theme.colors.bg.tertiary }}
                >
                  {getCategoryCount('enabled')}
                </span>
              </div>
            </button>

            <div className="h-px my-3" style={{ backgroundColor: theme.colors.border.default }} />

            <div
              className="text-xs font-semibold px-3 py-2"
              style={{ color: theme.colors.text.muted }}
            >
              CATÉGORIES
            </div>

            <button
              onClick={() => setSelectedCategory('Official')}
              className={`w-full text-left px-3 py-2 rounded transition-colors hover:bg-opacity-10 hover:bg-white ${selectedCategory === 'Official' ? 'bg-opacity-10 bg-white' : ''
                }`}
              style={{
                color: selectedCategory === 'Official' ? theme.colors.accent.primary : theme.colors.text.secondary
              }}
            >
              <div className="flex items-center justify-between">
                <span>Officiels</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: theme.colors.bg.tertiary }}
                >
                  {getCategoryCount('Official')}
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('Community')}
              className={`w-full text-left px-3 py-2 rounded transition-colors hover:bg-opacity-10 hover:bg-white ${selectedCategory === 'Community' ? 'bg-opacity-10 bg-white' : ''
                }`}
              style={{
                color: selectedCategory === 'Community' ? theme.colors.accent.primary : theme.colors.text.secondary
              }}
            >
              <div className="flex items-center justify-between">
                <span>Community</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: theme.colors.bg.tertiary }}
                >
                  {getCategoryCount('Community')}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPlugins.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg" style={{ color: theme.colors.text.muted }}>
                  No plugins found
                </p>
                <p className="text-sm mt-2" style={{ color: theme.colors.text.disabled }}>
                  Try modifying your filters or search query
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlugins.map(plugin => (
                <div
                  key={plugin.id}
                  className="border rounded-lg p-4 hover:border-opacity-70 transition-colors"
                  style={{
                    backgroundColor: theme.colors.bg.secondary,
                    borderColor: theme.colors.border.default
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold" style={{ color: theme.colors.text.primary }}>
                          {plugin.name}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: theme.colors.bg.tertiary,
                            color: theme.colors.text.secondary
                          }}
                        >
                          v{plugin.version}
                        </span>
                        {plugin.category === 'Official' && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${theme.colors.accent.primary}33`,
                              color: theme.colors.accent.primary
                            }}
                          >
                            Officiel
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>
                        {plugin.description}
                      </p>
                      <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>
                        Par {plugin.author}
                      </p>
                    </div>

                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`ml-4 px-4 py-2 rounded flex items-center gap-2 transition-colors ${plugin.enabled ? 'bg-opacity-20' : ''
                        }`}
                      style={{
                        backgroundColor: plugin.enabled
                          ? `${theme.colors.accent.primary}33`
                          : theme.colors.bg.tertiary,
                        color: plugin.enabled
                          ? theme.colors.accent.primary
                          : theme.colors.text.secondary
                      }}
                    >
                      {plugin.enabled ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Activé</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>Désactivé</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
