import React, { useState } from 'react';
import { X, Gamepad2, Monitor, Package, Settings, Info } from 'lucide-react';
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

interface PhysicsSettings {
  physicsEngine: 'PhysX' | 'Jolt Physics';
  gravity: number;
  defaultMaterial: string;
  enableCCD: boolean;
}

interface InputSettings {
  inputMappings: Array<{
    name: string;
    key: string;
    action: string;
  }>;
  controllerSupport: boolean;
  keyboardLayout: 'QWERTY' | 'AZERTY' | 'QWERTZ';
}

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'rendering' | 'physics' | 'packaging' | 'input'>('general');
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  };
  
  if (!isOpen && !isClosing) return null;
  
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

  const [inputSettings, setInputSettings] = useState<InputSettings>({
    inputMappings: [
      { name: 'Move Forward', key: 'W', action: 'MoveForward' },
      { name: 'Move Backward', key: 'S', action: 'MoveBackward' },
      { name: 'Move Left', key: 'A', action: 'MoveLeft' },
      { name: 'Move Right', key: 'D', action: 'MoveRight' }
    ],
    controllerSupport: true,
    keyboardLayout: 'QWERTY'
  });

  const handleProjectInfoChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleGameSettingsChange = (field: keyof GameSettings, value: any) => {
    setGameSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePhysicsSettingsChange = (field: keyof PhysicsSettings, value: any) => {
    setPhysicsSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleInputSettingsChange = (field: keyof InputSettings, value: any) => {
    setInputSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'rendering' as const, label: 'Rendering', icon: Monitor },
    { id: 'physics' as const, label: 'Physics', icon: Info },
    { id: 'packaging' as const, label: 'Packaging', icon: Package },
    { id: 'input' as const, label: 'Input', icon: Gamepad2 }
  ];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}`}>
      <div 
        className={`w-4/5 h-4/5 rounded-lg shadow-xl flex flex-col ${isClosing ? 'modal-content-exit' : 'modal-content'}`}
        style={{ 
          backgroundColor: theme.colors.bg.primary,
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 rounded-t-lg"
          style={{ 
            backgroundColor: theme.colors.bg.secondary,
            borderBottom: `1px solid ${theme.colors.border.default}`
          }}
        >
          <div className="flex items-center space-x-3">
            <Settings size={20} style={{ color: theme.colors.accent.primary }} />
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              Project Settings
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded transition-colors"
            style={{ color: theme.colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
              e.currentTarget.style.color = theme.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div 
            className="w-48 p-2 overflow-y-auto"
            style={{ 
              backgroundColor: theme.colors.bg.elevated,
              borderRight: `1px solid ${theme.colors.border.default}`
            }}
          >
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors text-left"
                    style={{
                      backgroundColor: isActive ? theme.colors.accent.primary : 'transparent',
                      color: isActive ? theme.colors.text.primary : theme.colors.text.secondary
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = theme.colors.bg.secondary;
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
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                    <Info size={18} className="mr-2" />
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectInfo.name}
                        onChange={(e) => handleProjectInfoChange('name', e.target.value)}
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
                    <Gamepad2 size={18} className="mr-2" />
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
                <h3 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
                  Rendering Settings
                </h3>
                <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                  Rendering configuration will be available in a future update.
                </p>
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

            {activeTab === 'input' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <Gamepad2 size={18} className="mr-2" />
                  Input System
                </h3>
                
                <div>
                  <h4 className="text-md font-medium mb-3" style={{ color: theme.colors.text.primary }}>
                    General Input Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                        Keyboard Layout
                      </label>
                      <select
                        value={inputSettings.keyboardLayout}
                        onChange={(e) => handleInputSettingsChange('keyboardLayout', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded border transition-colors"
                        style={{
                          backgroundColor: theme.colors.bg.secondary,
                          borderColor: theme.colors.border.default,
                          color: theme.colors.text.primary
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.accent.primary}
                        onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.default}
                      >
                        <option value="QWERTY">QWERTY</option>
                        <option value="AZERTY">AZERTY</option>
                        <option value="QWERTZ">QWERTZ</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                        <input
                          type="checkbox"
                          checked={inputSettings.controllerSupport}
                          onChange={(e) => handleInputSettingsChange('controllerSupport', e.target.checked)}
                          className="rounded transition-colors"
                          style={{
                            accentColor: theme.colors.accent.primary
                          }}
                        />
                        <span>Controller Support</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3" style={{ color: theme.colors.text.primary }}>
                    Input Mappings
                  </h4>
                  <div className="space-y-2">
                    {inputSettings.inputMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded" style={{ backgroundColor: theme.colors.bg.secondary }}>
                        <div className="flex-1">
                          <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                            {mapping.name}
                          </span>
                        </div>
                        <div className="w-20">
                          <input
                            type="text"
                            value={mapping.key}
                            onChange={(e) => {
                              const newMappings = [...inputSettings.inputMappings];
                              newMappings[index].key = e.target.value;
                              handleInputSettingsChange('inputMappings', newMappings);
                            }}
                            className="w-full px-2 py-1 text-sm text-center rounded border"
                            style={{
                              backgroundColor: theme.colors.bg.elevated,
                              borderColor: theme.colors.border.default,
                              color: theme.colors.text.primary
                            }}
                          />
                        </div>
                        <div className="w-32">
                          <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                            {mapping.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>
                    Note: InputAction and InputMappingContext files can be created from the Content Browser.
                  </p>
                </div>
              </div>
            )}
          </div>
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
            onClick={onClose}
            className="px-4 py-2 text-sm rounded transition-colors"
            style={{
              backgroundColor: theme.colors.bg.elevated,
              color: theme.colors.text.primary,
              border: `1px solid ${theme.colors.border.default}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.elevated;
            }}
          >
            Cancel
          </button>
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