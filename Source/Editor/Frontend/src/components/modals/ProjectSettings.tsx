import React, { useState } from 'react';
import { X, Monitor, Package, Settings, Info } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectInfo {
  name: string;
  version: string;
  company: string;
  website: string;
  description: string;
  copyright: string;
}

interface GameSettings {
  startLevel: string;
  gameSplashScreen: string;
  gameIcon: string;
  targetPlatforms: string[];
  defaultResolution: {
    width: number;
    height: number;
  };
  fullscreenMode: 'windowed' | 'fullscreen' | 'borderless';
}

interface RenderingSettings {
  graphicsAPI: 'DirectX12' | 'Vulkan' | 'OpenGL' | 'Metal';
  vsync: boolean;
  maxFPS: number;
  antiAliasing: 'None' | 'FXAA' | 'TAA' | 'MSAA x2' | 'MSAA x4' | 'MSAA x8';
  shadowQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  textureQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  viewDistance: number;
}

interface PhysicsSettings {
  physicsEngine: 'PhysX' | 'Jolt Physics';
  gravity: number;
  defaultMaterial: string;
  enableCCD: boolean;
}

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  // isClosing removed
  const [activeTab, setActiveTab] = useState<'general' | 'rendering' | 'physics' | 'packaging'>('general');

  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: 'My Plume Game',
    version: '1.0.0',
    company: 'My Studio',
    website: 'https://example.com',
    description: 'A game made with Plume Engine',
    copyright: '© 2025 My Studio. All rights reserved.'
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    startLevel: 'MainMenu',
    gameSplashScreen: '',
    gameIcon: '',
    targetPlatforms: ['windows', 'linux'],
    defaultResolution: { width: 1920, height: 1080 },
    fullscreenMode: 'windowed'
  });

  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>({
    physicsEngine: 'PhysX',
    gravity: -9.81,
    defaultMaterial: 'Default',
    enableCCD: true
  });

  const [renderingSettings, setRenderingSettings] = useState<RenderingSettings>({
    graphicsAPI: 'OpenGL',
    vsync: true,
    maxFPS: 144,
    antiAliasing: 'TAA',
    shadowQuality: 'High',
    textureQuality: 'High',
    viewDistance: 5000
  });

  // handleClose logic removed

  const handleProjectInfoChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleGameSettingsChange = (field: keyof GameSettings, value: any) => {
    setGameSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePhysicsSettingsChange = (field: keyof PhysicsSettings, value: any) => {
    setPhysicsSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleRenderingSettingsChange = (field: keyof RenderingSettings, value: any) => {
    setRenderingSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'rendering' as const, label: 'Rendering', icon: Monitor },
    { id: 'physics' as const, label: 'Physics', icon: Info },
    { id: 'packaging' as const, label: 'Packaging', icon: Package }
  ];

  return (
    <div className='w-full h-full flex flex-col overflow-hidden' style={{ backgroundColor: theme.colors.bg.primary }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className="w-48 border-r flex flex-col"
          style={{
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.border.default
          }}
        >
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: isActive ? theme.colors.bg.elevated : 'transparent',
                    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${theme.colors.bg.elevated}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Save Button Area */}
          <div className="p-2 border-t" style={{ borderColor: theme.colors.border.default }}>
            <button
              className="w-full px-4 py-2 text-sm rounded transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.colors.accent.primary,
                color: theme.colors.text.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent.primary;
              }}
            >
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Section: Project Info */}
              <div>
                <h3 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
                  Project Info
                </h3>
                <div className="grid grid-cols-1 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={projectInfo.name}
                      onChange={(e) => handleProjectInfoChange('name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded text-sm border focus:outline-none transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Version
                    </label>
                    <input
                      type="text"
                      value={projectInfo.version}
                      onChange={(e) => handleProjectInfoChange('version', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={projectInfo.company}
                      onChange={(e) => handleProjectInfoChange('company', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={projectInfo.website}
                      onChange={(e) => handleProjectInfoChange('website', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Description
                  </label>
                  <textarea
                    value={projectInfo.description}
                    onChange={(e) => handleProjectInfoChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors resize-none"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Copyright
                  </label>
                  <input
                    type="text"
                    value={projectInfo.copyright}
                    onChange={(e) => handleProjectInfoChange('copyright', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <Settings size={18} className="mr-2" />
                  Game Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Start Level
                    </label>
                    <input
                      type="text"
                      value={gameSettings.startLevel}
                      onChange={(e) => handleGameSettingsChange('startLevel', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Game Splash Screen
                    </label>
                    <input
                      type="text"
                      value={gameSettings.gameSplashScreen}
                      onChange={(e) => handleGameSettingsChange('gameSplashScreen', e.target.value)}
                      placeholder="Path to splash screen image"
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Game Icon
                    </label>
                    <input
                      type="text"
                      value={gameSettings.gameIcon}
                      onChange={(e) => handleGameSettingsChange('gameIcon', e.target.value)}
                      placeholder="Path to game icon"
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Fullscreen Mode
                    </label>
                    <select
                      value={gameSettings.fullscreenMode}
                      onChange={(e) => handleGameSettingsChange('fullscreenMode', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    >
                      <option value="windowed">Windowed</option>
                      <option value="fullscreen">Fullscreen</option>
                      <option value="borderless">Borderless Windowed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Default Width
                    </label>
                    <input
                      type="number"
                      value={gameSettings.defaultResolution.width}
                      onChange={(e) => handleGameSettingsChange('defaultResolution',
                        { ...gameSettings.defaultResolution, width: parseInt(e.target.value) || 1920 })}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                      Default Height
                    </label>
                    <input
                      type="number"
                      value={gameSettings.defaultResolution.height}
                      onChange={(e) => handleGameSettingsChange('defaultResolution',
                        { ...gameSettings.defaultResolution, height: parseInt(e.target.value) || 1080 })}
                      className="w-full px-3 py-2 text-sm rounded border transition-colors"
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rendering' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                <Monitor size={18} className="mr-2" />
                Rendering Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Graphics API
                  </label>
                  <select
                    value={renderingSettings.graphicsAPI}
                    onChange={(e) => handleRenderingSettingsChange('graphicsAPI', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  >
                    <option value="DirectX12">DirectX 12</option>
                    <option value="Vulkan">Vulkan</option>
                    <option value="OpenGL">OpenGL</option>
                    <option value="Metal">Metal (macOS/iOS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Anti-Aliasing
                  </label>
                  <select
                    value={renderingSettings.antiAliasing}
                    onChange={(e) => handleRenderingSettingsChange('antiAliasing', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  >
                    <option value="None">None</option>
                    <option value="FXAA">FXAA</option>
                    <option value="TAA">TAA</option>
                    <option value="MSAA x2">MSAA x2</option>
                    <option value="MSAA x4">MSAA x4</option>
                    <option value="MSAA x8">MSAA x8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Shadow Quality
                  </label>
                  <select
                    value={renderingSettings.shadowQuality}
                    onChange={(e) => handleRenderingSettingsChange('shadowQuality', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Ultra">Ultra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Texture Quality
                  </label>
                  <select
                    value={renderingSettings.textureQuality}
                    onChange={(e) => handleRenderingSettingsChange('textureQuality', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Ultra">Ultra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Max FPS
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={renderingSettings.maxFPS}
                    onChange={(e) => handleRenderingSettingsChange('maxFPS', parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    View Distance
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="20000"
                    step="100"
                    value={renderingSettings.viewDistance}
                    onChange={(e) => handleRenderingSettingsChange('viewDistance', parseInt(e.target.value) || 5000)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  <input
                    type="checkbox"
                    checked={renderingSettings.vsync}
                    onChange={(e) => handleRenderingSettingsChange('vsync', e.target.checked)}
                    className="rounded transition-colors"
                    style={{
                      accentColor: theme.colors.accent.primary
                    }}
                  />
                  <span>Enable VSync</span>
                </label>
                <p className="text-xs mt-1 ml-6" style={{ color: theme.colors.text.muted }}>
                  Synchronizes rendering with display refresh rate to prevent screen tearing.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                <Info size={18} className="mr-2" />
                Physics Engine Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Physics Engine
                  </label>
                  <select
                    value={physicsSettings.physicsEngine}
                    onChange={(e) => handlePhysicsSettingsChange('physicsEngine', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  >
                    <option value="PhysX">PhysX</option>
                    <option value="Jolt Physics">Jolt Physics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Gravity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={physicsSettings.gravity}
                    onChange={(e) => handlePhysicsSettingsChange('gravity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Default Material
                  </label>
                  <input
                    type="text"
                    value={physicsSettings.defaultMaterial}
                    onChange={(e) => handlePhysicsSettingsChange('defaultMaterial', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border transition-colors"
                    style={{
                      backgroundColor: theme.colors.bg.secondary,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    <input
                      type="checkbox"
                      checked={physicsSettings.enableCCD}
                      onChange={(e) => handlePhysicsSettingsChange('enableCCD', e.target.checked)}
                      className="rounded transition-colors"
                      style={{
                        accentColor: theme.colors.accent.primary
                      }}
                    />
                    <span>Enable Continuous Collision Detection</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'packaging' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
                Build & Packaging
              </h3>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.secondary }}>
                  Target Platforms
                </label>
                <div className="space-y-2">
                  {['windows', 'linux', 'macos'].map((platform) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gameSettings.targetPlatforms.includes(platform)}
                        onChange={(e) => {
                          const platforms = e.target.checked
                            ? [...gameSettings.targetPlatforms, platform]
                            : gameSettings.targetPlatforms.filter(p => p !== platform);
                          handleGameSettingsChange('targetPlatforms', platforms);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize" style={{ color: theme.colors.text.primary }}>
                        {platform}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}


        </div>
        {/* Footer */}
        <div
          className="flex items-center justify-end space-x-3 p-4 rounded-b-lg"
          style={{
            backgroundColor: theme.colors.bg.secondary,
            borderTop: `1px solid ${theme.colors.border.default}`
          }}
        >
          <button
            className="px-4 py-2 text-sm rounded transition-colors"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: theme.colors.text.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accent.primary;
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};