export const en = {
    // =================================================================================================
    // GLOBAL / APP
    // =================================================================================================

    // App
    'app.tab.preferences': 'Editor Preferences',
    'app.tab.plugins': 'Plugin Manager',
    'app.tab.project_settings': 'Project Settings',
    'app.mesh.new': 'New Mesh',

    // Header
    'header.running': 'RUNNING',
    'header.editor_mode': 'EDITOR MODE',
    'header.minimize': 'Minimize',
    'header.maximize': 'Maximize/Restore',
    'header.close': 'Close',

    // Footer
    'footer.content_browser': 'Content Browser (Ctrl+Space)',
    'footer.console': 'Console (Ctrl+I)',
    'footer.entities': '{count} entities',

    // Menu
    'menu.file': 'File',
    'menu.file.new_level': 'New Level',
    'menu.file.open_level': 'Open Level',
    'menu.file.save': 'Save',
    'menu.file.save_as': 'Save As',
    'menu.file.import_asset': 'Import Asset',
    'menu.file.export_project': 'Export Project',
    'menu.file.exit': 'Exit',

    'menu.edit': 'Edit',
    'menu.edit.undo': 'Undo',
    'menu.edit.redo': 'Redo',
    'menu.edit.preferences': 'Editor Preferences',
    'menu.edit.project_settings': 'Project Settings',

    'menu.window': 'Window',
    'menu.window.viewport': 'Viewport',
    'menu.window.outliner': 'Outliner',
    'menu.window.details': 'Details',
    'menu.window.content_browser': 'Content Browser',
    'menu.window.console': 'Console',

    'menu.tools': 'Tools',
    'menu.tools.plugins': 'Plugins',
    'menu.tools.build_all': 'Build All',

    'menu.help': 'Help',
    'menu.help.website': 'Website',
    'menu.help.documentation': 'Documentation',
    'menu.help.repository': 'Repository',
    'menu.help.about': 'About',

    // Toolbar
    'toolbar.save_level': 'Save Current Level (Ctrl+S)',
    'toolbar.select': 'Select',
    'toolbar.translate': 'Translate',
    'toolbar.rotate': 'Rotate',
    'toolbar.scale': 'Scale',
    'toolbar.settings': 'Editor Settings',
    'toolbar.build': 'BUILD',

    // Settings (Preferences)
    'settings.theme': 'Themes',
    'settings.shortcuts': 'Shortcuts',
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.select_theme': 'Select Theme',
    'settings.theme_description': 'Choose a look and feel for the editor.',
    'settings.language_description': 'Choose the interface language.',
    'settings.shortcuts_description': 'Keyboard shortcuts configuration.',

    // =================================================================================================
    // PANELS
    // =================================================================================================

    // Content Browser
    'browser.title': 'Content Browser',
    'browser.search_placeholder': 'Filter assets... (Ctrl+K)',
    'browser.import': 'Import',
    'browser.drop_files': 'Drop files to import',
    'browser.delete_confirm': 'Delete "{name}"?',
    'browser.delete': 'Delete',
    'browser.cancel': 'Cancel',
    'browser.docker': 'Docker',
    'browser.docker_title': 'Open a new permanent docked Content Browser',
    'browser.forward_title': 'Forward (not implemented)',
    'browser.zoom_in': 'Zoom In (Ctrl+Scroll Up)',
    'browser.zoom_out': 'Zoom Out (Ctrl+Scroll Down)',

    'browser.context.create_folder': 'Create Folder',
    'browser.context.open_explorer': 'Open In Explorer',
    'browser.context.paste': 'Paste',
    'browser.context.import': 'Import',
    'browser.context.create_material': 'Create Material',
    'browser.context.create_level': 'Create Level',
    'browser.context.change_color': 'Change Color',
    'browser.context.rename': 'Rename',
    'browser.context.delete': 'Delete',
    'browser.context.duplicate': 'Duplicate',
    'browser.context.copy': 'Copy',

    // Outliner
    'outliner.hierarchy': 'Hierarchy',
    'outliner.create_folder': 'Create Folder',
    'outliner.rename_tooltip': 'Rename (F2)',
    'outliner.duplicate_tooltip': 'Duplicate (Ctrl+D)',
    'outliner.delete_tooltip': 'Delete (Del)',
    'outliner.delete_confirm': 'Delete "{name}"?',
    'outliner.delete': 'Delete',
    'outliner.cancel': 'Cancel',
    'outliner.actors_count': '{count} Actors',
    'outliner.selected_count': '({count} selected)',

    // Details
    'details.title': 'Details',
    'details.select_actor': 'Select an actor.',
    'details.folder_no_props': 'Folders have no properties.',
    'details.transform': 'Transform',
    'details.position': 'Location',
    'details.rotation': 'Rotation',
    'details.scale': 'Scale',

    // Console
    'console.title': 'Console',
    'console.info': 'Info',
    'console.warning': 'Warning',
    'console.error': 'Error',
    'console.docker': 'Docker',
    'console.dock_tooltip': 'Dock Console',
    'console.clear': 'Clear (Ctrl+L)',
    'console.clear_tooltip': 'Clear Console (Ctrl+L)',
    'console.no_logs': 'No logs to display...',
    'console.placeholder': "Type 'help' to list commands",

    // =================================================================================================
    // EDITORS
    // =================================================================================================

    // Material Editor
    'material.save': 'Save',
    'material.compile': 'Compile Shader',
    'material.fit_view': 'Fit View',
    'material.lock': 'Lock Interactivity',
    'material.unlock': 'Unlock Interactivity',
    'material.zoom_in': 'Zoom In',
    'material.zoom_out': 'Zoom Out',
    'material.node_actions': 'Node Actions',
    'material.rename': 'Rename (F2)',
    'material.comment': 'Comment Selection (Ctrl+/)',
    'material.copy': 'Copy (Ctrl+C)',
    'material.duplicate': 'Duplicate (Ctrl+D)',
    'material.delete': 'Delete (Del)',
    'material.search_placeholder': 'Search nodes...',
    'material.no_nodes': 'No nodes found',
    'material.category.constants': 'Constants',
    'material.category.textures': 'Textures',
    'material.category.maths': 'Maths',
    'material.category.utility': 'Utility',

    // Asset Viewers (Common)
    'asset.path': 'Path: {path}',

    // Sound Viewer
    'sound.waveform_unavailable': 'Waveform Unavailable (Streamed Asset)',
    'sound.load_error': 'Failed to load audio asset.',
    'sound.rewind': 'Rewind (Home)',
    'sound.play': 'Play (Space)',
    'sound.pause': 'Pause (Space)',
    'sound.stop': 'Stop',
    'sound.loop': 'Toggle Loop (L)',
    'sound.mute': 'Mute (M)',

    // Static Mesh Editor
    'mesh.preview_mesh': 'Preview Mesh',
    'mesh.preview_light': 'Preview Light',
    'mesh.details': 'Mesh Details',
    'mesh.editing': 'Editing properties for {id}',

    // =================================================================================================
    // MODALS & SETTINGS
    // =================================================================================================

    // Plugin Manager
    'plugin.search_placeholder': 'Search a plugin...',
    'plugin.all': 'All plugins',
    'plugin.enabled': 'Enabled plugins',
    'plugin.categories': 'CATEGORIES',
    'plugin.official': 'Official',
    'plugin.community': 'Community',
    'plugin.none_found': 'No plugins found',
    'plugin.none_found_detail': 'Try modifying your filters or search query',
    'plugin.by': 'By {author}',
    'plugin.activated': 'Enabled',
    'plugin.deactivated': 'Disabled',

    // Project Settings
    'project.tabs.general': 'General',
    'project.tabs.rendering': 'Rendering',
    'project.tabs.physics': 'Physics',
    'project.tabs.packaging': 'Packaging',
    'project.save': 'Save',

    'project.info.title': 'Project Info',
    'project.info.name': 'Display Name',
    'project.info.version': 'Version',
    'project.info.company': 'Company Name',
    'project.info.website': 'Website',
    'project.info.description': 'Description',
    'project.info.copyright': 'Copyright',

    'project.game.title': 'Game Settings',
    'project.game.start_level': 'Start Level',
    'project.game.splash': 'Game Splash Screen',
    'project.game.splash_placeholder': 'Path to splash screen image',
    'project.game.icon': 'Game Icon',
    'project.game.icon_placeholder': 'Path to game icon',
    'project.game.fullscreen': 'Fullscreen Mode',
    'project.game.modes.windowed': 'Windowed',
    'project.game.modes.fullscreen': 'Fullscreen',
    'project.game.modes.borderless': 'Borderless Windowed',
    'project.game.width': 'Default Width',
    'project.game.height': 'Default Height',

    'project.rendering.title': 'Rendering Settings',
    'project.rendering.api': 'Graphics API',
    'project.rendering.aa': 'Anti-Aliasing',
    'project.rendering.shadows': 'Shadow Quality',
    'project.rendering.textures': 'Texture Quality',
    'project.rendering.fps': 'Max FPS',
    'project.rendering.distance': 'View Distance',
    'project.rendering.vsync': 'Enable VSync',
    'project.rendering.vsync_desc': 'Synchronizes rendering with display refresh rate to prevent screen tearing.',

    'project.physics.title': 'Physics Engine Settings',
    'project.physics.engine': 'Physics Engine',
    'project.physics.gravity': 'Gravity',
    'project.physics.material': 'Default Material',
    'project.physics.ccd': 'Enable Continuous Collision Detection',

    'project.packaging.title': 'Build & Packaging',
    'project.packaging.platforms': 'Target Platforms',

    // Project Settings Options
    'project.options.low': 'Low',
    'project.options.medium': 'Medium',
    'project.options.high': 'High',
    'project.options.ultra': 'Ultra',
    'project.options.none': 'None',
    'project.aa.fxaa': 'FXAA',
    'project.aa.taa': 'TAA',
    'project.aa.msaa2': 'MSAA x2',
    'project.aa.msaa4': 'MSAA x4',
    'project.aa.msaa8': 'MSAA x8',
    'project.fullscreen.windowed': 'Windowed',
    'project.fullscreen.fullscreen': 'Fullscreen',
    'project.fullscreen.borderless': 'Borderless Windowed',
    'project.platform.windows': 'Windows',
    'project.platform.linux': 'Linux',
    'project.platform.macos': 'macOS',
};
