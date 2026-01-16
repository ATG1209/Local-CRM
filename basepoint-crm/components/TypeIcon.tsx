import React from 'react';
import { ColumnType } from '../types';
import {
    Type,
    Calendar,
    Hash,
    CheckSquare,
    Star,
    Clock,
    List,
    DollarSign,
    Activity,
    MapPin,
    Phone,
    Layout,
    User,
    Briefcase,
    Link as LinkIcon,
    Zap,
    Grid2X2
} from 'lucide-react';

interface TypeIconProps {
    type: ColumnType;
    size?: number;
    className?: string;
}

const TypeIcon: React.FC<TypeIconProps> = ({ type, size = 12, className = "text-gray-400" }) => {
    const iconProps = { size, className };

    switch (type) {
        case 'text':
            return <Type {...iconProps} />;
        case 'link':
            return <Zap {...iconProps} />;
        case 'url':
            return <LinkIcon {...iconProps} />;
        case 'relation':
            return <Layout {...iconProps} />;
        case 'select':
            return <List {...iconProps} />;
        case 'date':
            return <Calendar {...iconProps} />;
        case 'number':
            return <Hash {...iconProps} />;
        case 'checkbox':
            return <CheckSquare {...iconProps} />;
        case 'rating':
            return <Star {...iconProps} />;
        case 'timestamp':
            return <Clock {...iconProps} />;
        case 'currency':
            return <DollarSign {...iconProps} />;
        case 'status':
            return <Activity {...iconProps} />;
        case 'location':
            return <MapPin {...iconProps} />;
        case 'phone':
            return <Phone {...iconProps} />;
        case 'multi-select':
            return <Grid2X2 {...iconProps} />;
        case 'person':
            return <User {...iconProps} />;
        case 'company':
            return <Briefcase {...iconProps} />;
        default:
            return <Hash {...iconProps} />;
    }
};

export default TypeIcon;
