import { File as FileIcon, Folder, Box, Image as ImageIcon, Music, Layers, Mountain, Bone, Film, FileCode, Skull, Dumbbell } from 'lucide-react';
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
    else if (lowerType === 'staticmesh' || lowerType === 'mesh') {
        Icon = Box;
        color = "#5DE2E7";
    }
    else if (lowerType === 'texture' || lowerType === 'image') {
        Icon = ImageIcon;
        color = "#D05C5E";
    }
    else if (lowerType === 'soundwave' || lowerType === 'sound') {
        Icon = Music;
        color = "#CC6CE7";
    }
    else if (lowerType === 'material') {
        Icon = Layers;
        color = "#7DDA58";
    }
    else if (lowerType === 'level' || lowerType === 'map') {
        Icon = Mountain;
        color = "#FE9900";
    }
    else if (lowerType === 'skeletalmesh') {
        Icon = Bone;
        color = "#ffb6c1"; // Light Pink (Unreal-ish)
    }
    else if (lowerType === 'skeleton') {
        Icon = Skull;
        color = "#64b5f6"; // Light Blue
    }
    else if (lowerType === 'physicsasset') {
        Icon = Dumbbell; // Distinct from Box (StaticMesh)
        color = "#f97316"; // Orange
    }
    else if (lowerType === 'animationsequence' || lowerType === 'anim') {
        Icon = Film;
        color = "#a3e635"; // Lime Green
    }
    else if (lowerType === 'script') {
        Icon = FileCode;
        color = "#22c55e";
    }

    // Plume meta helper detection
    if (lowerName === '.plumemeta' || lowerName.endsWith('.plumemeta')) {
        Icon = FileCode;
        color = theme?.colors?.accent?.secondary || '#64748b';
    }

    return { Icon, color };
};
