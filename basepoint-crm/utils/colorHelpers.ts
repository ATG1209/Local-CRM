import { ActivityType } from '../types';

// Activity type color mapping - uses static classes for Tailwind JIT compatibility
export const ACTIVITY_COLORS: Record<ActivityType, {
    bg100: string;
    bg50: string;
    text600: string;
    border200: string;
}> = {
    task: {
        bg100: 'bg-blue-100',
        bg50: 'bg-blue-50',
        text600: 'text-blue-600',
        border200: 'border-blue-200'
    },
    call: {
        bg100: 'bg-green-100',
        bg50: 'bg-green-50',
        text600: 'text-green-600',
        border200: 'border-green-200'
    },
    meeting: {
        bg100: 'bg-purple-100',
        bg50: 'bg-purple-50',
        text600: 'text-purple-600',
        border200: 'border-purple-200'
    }
};

export const getActivityColors = (type: ActivityType) => {
    return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.task;
};

export const getObjectColor = (objectId: string) => {
    switch (objectId) {
        case 'obj_companies':
            return {
                text: 'text-blue-500',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                hover: 'hover:bg-blue-100',
                active: 'bg-blue-100'
            };
        case 'obj_deals':
            return {
                text: 'text-orange-500',
                bg: 'bg-orange-50',
                border: 'border-orange-100',
                hover: 'hover:bg-orange-100',
                active: 'bg-orange-100'
            };
        case 'obj_people':
            return {
                text: 'text-sky-500',
                bg: 'bg-sky-50',
                border: 'border-sky-100',
                hover: 'hover:bg-sky-100',
                active: 'bg-sky-100'
            };
        case 'obj_tasks':
            return {
                text: 'text-emerald-500',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                hover: 'hover:bg-emerald-100',
                active: 'bg-emerald-100'
            };
        default:
            return {
                text: 'text-purple-500',
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                hover: 'hover:bg-purple-100',
                active: 'bg-purple-100'
            };
    }
};
