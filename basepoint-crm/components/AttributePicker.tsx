import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Settings,
    Check,
    Type,
    Hash,
    Calendar,
    Link as LinkIcon,
    Layout,
    List,
    Users,
    Grid2X2,
    DollarSign,
    Activity,
    MapPin,
    Phone,
    Globe,
    Clock,
    Star,
    CheckSquare
} from 'lucide-react';
import { ColumnType } from '../types';
import { Attribute } from '../utils/schemaApi';

interface AttributePickerProps {
    attributes: Attribute[];
    visibleAttributeIds: string[];
    onToggleAttribute: (attributeId: string) => void;
    onCreateAttribute: () => void;
    onEditAttribute: (attribute: Attribute) => void;
    objectName: string; // e.g., "Company", "Person"
}

const TypeIcon = ({ type, size = 14 }: { type: string; size?: number }) => {
    switch (type) {
        case 'text': return <Type size={size} className="text-gray-500" />;
        case 'url': return <LinkIcon size={size} className="text-gray-500" />;
        case 'relation': return <Layout size={size} className="text-gray-500" />;
        case 'select': return <List size={size} className="text-gray-500" />;
        case 'date': return <Calendar size={size} className="text-gray-500" />;
        case 'number': return <Hash size={size} className="text-gray-500" />;
        case 'checkbox': return <CheckSquare size={size} className="text-gray-500" />;
        case 'rating': return <Star size={size} className="text-gray-500" />;
        case 'timestamp': return <Clock size={size} className="text-gray-500" />;
        case 'currency': return <DollarSign size={size} className="text-gray-500" />;
        case 'status': return <Activity size={size} className="text-gray-500" />;
        case 'location': return <MapPin size={size} className="text-gray-500" />;
        case 'phone': return <Phone size={size} className="text-gray-500" />;
        case 'multi-select': return <Grid2X2 size={size} className="text-gray-500" />;
        default: return <Hash size={size} className="text-gray-500" />;
    }
};

const AttributePicker: React.FC<AttributePickerProps> = ({
    attributes,
    visibleAttributeIds,
    onToggleAttribute,
    onCreateAttribute,
    onEditAttribute,
    objectName
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter attributes based on search
    const filteredAttributes = attributes.filter(attr =>
        attr.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group attributes (system vs custom vs relations)
    const systemAttributes = filteredAttributes.filter(a => a.isSystem && a.type !== 'relation');
    const customAttributes = filteredAttributes.filter(a => !a.isSystem && a.type !== 'relation');
    const relationAttributes = filteredAttributes.filter(a => a.type === 'relation');

    return (
        <div className="w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-100">
            {/* Search Header */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                        placeholder="Search attributes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-1">

                {searchTerm === '' && (
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Properties
                    </div>
                )}

                {/* System Attributes */}
                {systemAttributes.map(attr => (
                    <AttributeItem
                        key={attr.id}
                        attribute={attr}
                        isVisible={visibleAttributeIds.includes(attr.id)}
                        onToggle={() => onToggleAttribute(attr.id)}
                        onEdit={() => onEditAttribute(attr)}
                    />
                ))}

                {/* Custom Attributes */}
                {customAttributes.length > 0 && (
                    <>
                        <div className="border-t border-gray-100 my-1 mx-3"></div>
                        {customAttributes.map(attr => (
                            <AttributeItem
                                key={attr.id}
                                attribute={attr}
                                isVisible={visibleAttributeIds.includes(attr.id)}
                                onToggle={() => onToggleAttribute(attr.id)}
                                onEdit={() => onEditAttribute(attr)}
                            />
                        ))}
                    </>
                )}

                {/* Relations */}
                {relationAttributes.length > 0 && (
                    <>
                        <div className="border-t border-gray-100 my-1 mx-3"></div>
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Relations
                        </div>
                        {relationAttributes.map(attr => (
                            <AttributeItem
                                key={attr.id}
                                attribute={attr}
                                isVisible={visibleAttributeIds.includes(attr.id)}
                                onToggle={() => onToggleAttribute(attr.id)}
                                onEdit={() => onEditAttribute(attr)}
                            />
                        ))}
                    </>
                )}

                {filteredAttributes.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-gray-500">
                        No attributes found matching "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                <button
                    onClick={onCreateAttribute}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                >
                    <Plus size={16} />
                    Create new attribute
                </button>
            </div>
        </div>
    );
};

const AttributeItem = ({
    attribute,
    isVisible,
    onToggle,
    onEdit
}: {
    attribute: Attribute,
    isVisible: boolean,
    onToggle: () => void,
    onEdit: () => void
}) => (
    <div
        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
    >
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onToggle}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isVisible ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                {isVisible && <Check size={10} className="text-white" />}
            </div>
            <div className="p-1 rounded bg-gray-100 text-gray-500">
                <TypeIcon type={attribute.type} />
            </div>
            <span className="text-sm text-gray-700 truncate">{attribute.name}</span>
        </div>

        <button
            onClick={(e) => {
                e.stopPropagation();
                onEdit();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
        >
            <Settings size={14} />
        </button>
    </div>
);

export default AttributePicker;
