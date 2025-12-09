import {
    Camera,
    Music,
    Video,
    Shield,
    BookOpen,
    Zap,
    UserCheck,
    Trash2,
    LucideIcon
} from "lucide-react";

/**
 * Icon mapping for church units
 * Maps unit IDs to their corresponding Lucide React icons
 */
export const UNIT_ICONS: Record<string, LucideIcon> = {
    "3hmedia": Camera,
    "3hmusic": Music,
    "3hmovies": Video,
    "3hsecurity": Shield,
    "discipleship": BookOpen,
    "praisefeet": Zap,
    "ushering": UserCheck,
    "sanitation": Trash2,
};

/**
 * Get icon component for a unit ID
 * Returns Users icon as fallback if unit icon not found
 */
export const getUnitIcon = (unitId: string): LucideIcon => {
    return UNIT_ICONS[unitId] || UserCheck;
};

/**
 * Get icon color classes for a unit ID
 */
export const getUnitIconColors = (unitId: string): { bg: string; text: string } => {
    const colorMap: Record<string, { bg: string; text: string }> = {
        "3hmedia": { bg: "bg-purple-100", text: "text-purple-600" },
        "3hmusic": { bg: "bg-blue-100", text: "text-blue-600" },
        "3hmovies": { bg: "bg-red-100", text: "text-red-600" },
        "3hsecurity": { bg: "bg-gray-100", text: "text-gray-600" },
        "discipleship": { bg: "bg-green-100", text: "text-green-600" },
        "praisefeet": { bg: "bg-yellow-100", text: "text-yellow-600" },
        "ushering": { bg: "bg-indigo-100", text: "text-indigo-600" },
        "sanitation": { bg: "bg-teal-100", text: "text-teal-600" },
    };

    return colorMap[unitId] || { bg: "bg-blue-100", text: "text-blue-600" };
};