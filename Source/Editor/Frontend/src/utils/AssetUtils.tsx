import { File as FileIcon, Folder, Box, Image as ImageIcon, Music, Layers, Mountain, Bone, Film, FileCode } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const getAssetDefinition = (type: string, name: string = '', metaColor?: string, theme?: any) => {
    const defaultColor = theme?.colors?.text?.secondary || '#9ca3af';
    let Icon: LucideIcon = FileIcon;
    let color = defaultColor;

    const lowerType = type ? type.toLowerCase() : '';
    const lowerName = name ? name.toLowerCase() : '';

    if (lowerType === 'folder') {
        Icon = Folder;
        color = metaColor ? (metaColor.startsWith('#') ? metaColor : '#' + metaColor) : '#eab308';
    }
    else if (lowerType === 'staticmesh' || lowerType === 'mesh' || lowerName.endsWith('.plume_mesh') || lowerName.endsWith('.fbx') || lowerName.endsWith('.obj')) {
        Icon = Box;
        color = "#5DE2E7";
    }
    else if (lowerType === 'texture' || lowerType === 'image' || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.tga')) {
        Icon = ImageIcon;
        color = "#D05C5E";
    }
    else if (lowerType === 'soundwave' || lowerType === 'sound' || lowerName.endsWith('.wav') || lowerName.endsWith('.mp3')) {
        Icon = Music;
        color = "#CC6CE7";
    }
    else if (lowerType === 'material') {
        Icon = Layers;
        color = "#7DDA58";
    }
    else if (lowerType === 'level' || lowerType === 'map' || lowerName.endsWith('.map')) {
        Icon = Mountain;
        color = "#FE9900";
    }
    else if (lowerType === 'skeletalmesh' || lowerName.endsWith('.plumeskel')) {
        Icon = Bone;
        color = "#FFECA1";
    }
    else if (lowerType === 'animationsequence' || lowerType === 'anim' || lowerName.endsWith('.plumeanim')) {
        Icon = Film;
        color = "#BFD641";
    }
    else if (lowerType === 'script' || lowerName.endsWith('.ts') || lowerName.endsWith('.js')) {
        Icon = FileCode;
        color = "#22c55e";
    }

    // Plume meta helper detection
    if (lowerName === '.plume_meta' || lowerName.endsWith('.plume_meta')) {
        Icon = FileCode;
        color = theme?.colors?.accent?.secondary || '#64748b';
    }

    return { Icon, color };
};
