import React, { useState, useEffect, useRef } from 'react';
import { Company, Person, ColumnDefinition, ColumnType } from '../types';
import SearchableSelect from './SearchableSelect';
import RelationPicker from './RelationPicker';
import CompanyAvatar from './CompanyAvatar';
import {
    X,
    Globe,
    Edit2,
    Save,
    Link as LinkIcon,
    ExternalLink,
    Zap,
    MessageSquare,
    Plus,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    Settings,
    Type,
    Calendar,
    Hash,
    CheckSquare,
    Star,
    Clock,
    DollarSign,
    Activity,
    MapPin,
    Phone,
    Layout,
    List,
    Grid2X2
} from 'lucide-react';

interface CompanyDetailPanelProps {
    company: Company | null;
    isOpen: boolean;
    onClose: () => void;
    people: Person[];
    onUpdate: (company: Company) => void;
    columns: ColumnDefinition[];
    onEditAttribute: (col: ColumnDefinition) => void;
    onAddProperty: () => void;
    onToggleVisibility?: (colId: string) => void;
}

const TypeIcon = ({ type }: { type: ColumnType }) => {
    switch (type) {
        case 'text': return <Type size={14} className="text-gray-400" />;
        case 'url': return <LinkIcon size={14} className="text-gray-400" />;
        case 'relation': return <Layout size={14} className="text-gray-400" />;
        case 'select': return <List size={14} className="text-gray-400" />;
        case 'date': return <Calendar size={14} className="text-gray-400" />;
        case 'number': return <Hash size={14} className="text-gray-400" />;
        case 'checkbox': return <CheckSquare size={14} className="text-gray-400" />;
        case 'rating': return <Star size={14} className="text-gray-400" />;
        case 'timestamp': return <Clock size={14} className="text-gray-400" />;
        case 'currency': return <DollarSign size={14} className="text-gray-400" />;
        case 'status': return <Activity size={14} className="text-gray-400" />;
        case 'location': return <MapPin size={14} className="text-gray-400" />;
        case 'phone': return <Phone size={14} className="text-gray-400" />;
        case 'multi-select': return <Grid2X2 size={14} className="text-gray-400" />;
        case 'link': return <Zap size={14} className="text-gray-400" />;
        default: return <Hash size={14} className="text-gray-400" />;
    }
};

const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({
    company,
    isOpen,
    onClose,
    people,
    onUpdate,
    columns,
    onEditAttribute,
    onAddProperty,
    onToggleVisibility
}) => {
    const [showHiddenProps, setShowHiddenProps] = useState(false);
    const [editForm, setEditForm] = useState<Company | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [editingHeader, setEditingHeader] = useState(false);

    useEffect(() => {
        if (company) {
            setEditForm(company);
            setEditingHeader(false);
        }
    }, [company]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isOpen) onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!company || !editForm) return null;

    const handleUpdateField = (field: string, value: any) => {
        if (editForm) {
            const updated = { ...editForm, [field]: value };
            setEditForm(updated);
            onUpdate(updated);
        }
    };

    const personOptions = people.map(p => ({
        id: p.id,
        label: p.name,
        icon: <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{p.name.substring(0, 1).toUpperCase()}</div>
    }));

    const inputClass = "w-full text-sm px-2 py-1 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent rounded transition-all outline-none";

    const renderFieldInput = (col: ColumnDefinition) => {
        const value = (editForm as any)[col.accessorKey];

        if (col.readonly) {
            return (
                <div className="text-sm text-gray-500 py-1">
                    {col.type === 'timestamp' || col.type === 'date'
                        ? (value ? new Date(value).toLocaleDateString() : '-')
                        : (value || '-')}
                </div>
            );
        }

        switch (col.type) {
            case 'relation': // Multi-select for POC and other relations
                return (
                    <div className="min-h-[32px]">
                        <RelationPicker
                            value={value}
                            onChange={(newIds) => handleUpdateField(col.accessorKey, newIds)}
                            options={personOptions}
                            type="person"
                            placeholder="Select..."
                            emptyMessage="Select as many as you like"
                        />
                    </div>
                );
            case 'select':
            case 'multi-select':
                if (col.options && col.options.length > 0) {
                    return (
                        <div className="h-8">
                            <SearchableSelect
                                value={Array.isArray(value) ? value[0] : value}
                                onChange={(val) => handleUpdateField(col.accessorKey, col.type === 'multi-select' ? [val] : val)}
                                options={col.options.map(opt => ({
                                    id: opt.id,
                                    label: opt.label,
                                    icon: <div className={`w-3 h-3 rounded-full ${opt.color.split(' ')[0]}`}></div>
                                }))}
                                className="border-transparent bg-transparent hover:bg-gray-50 -ml-2"
                            />
                        </div>
                    );
                }
                // Fallback to text for unconfigured selects
                return (
                    <input
                        className={inputClass}
                        value={Array.isArray(value) ? value.join(', ') : (value || '')}
                        onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateField(col.accessorKey, col.type === 'multi-select' ? val.split(', ') : val);
                        }}
                        placeholder="Select..."
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        className={inputClass}
                        value={(() => {
                            if (!value) return '';
                            try {
                                const d = new Date(value);
                                return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
                            } catch { return ''; }
                        })()}
                        onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
                    />
                );
            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleUpdateField(col.accessorKey, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer mt-1.5"
                    />
                );
            case 'rating':
                return (
                    <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                className={`cursor-pointer ${star <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                                onClick={() => handleUpdateField(col.accessorKey, star)}
                            />
                        ))}
                    </div>
                );
            default:
                if (col.id === 'notes') { // Special case for notes
                    return (
                        <textarea
                            className={`${inputClass} min-h-[80px] resize-none`}
                            value={value || ''}
                            onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
                            placeholder="Add notes..."
                        />
                    )
                }
                return (
                    <input
                        className={inputClass}
                        value={value || ''}
                        onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
                        placeholder="Empty"
                        type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                    />
                );
        }
    };

    // Separate link columns from other columns
    const linkColumns = columns.filter(c => c.type === 'link' && c.visible);
    // Filter out columns we show in the header explicitly and link columns (shown in Quick Links)
    const detailColumns = columns.filter(c => c.id !== 'name' && c.type !== 'link' && c.visible);
    // Hidden columns (for visibility toggle section)
    const hiddenColumns = columns.filter(c => c.id !== 'name' && c.type !== 'link' && !c.visible);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
                    onClick={onClose}
                />
            )}
            <div className={`fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} ref={panelRef}>
                {/* Compact Header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0 group">
                            <CompanyAvatar name={company.name} size="md" className="w-10 h-10 text-xs shadow-sm ring-1 ring-gray-200 bg-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingHeader ? (
                                <input
                                    autoFocus
                                    className="text-lg font-bold text-gray-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 outline-none w-full shadow-sm"
                                    value={editForm.name}
                                    onChange={(e) => handleUpdateField('name', e.target.value)}
                                    onBlur={() => setEditingHeader(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingHeader(false)}
                                />
                            ) : (
                                <h2
                                    className="text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-gray-600 flex items-center gap-2 group"
                                    onClick={() => setEditingHeader(true)}
                                >
                                    {editForm.name}
                                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                                </h2>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                                {/* Domain Edit */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors group relative max-w-full">
                                    <Globe size={10} />
                                    <input
                                        className="bg-transparent border-none outline-none text-xs text-gray-500 hover:text-gray-800 p-0 w-auto truncate focus:ring-0 placeholder:text-gray-300"
                                        value={editForm.domain}
                                        onChange={(e) => handleUpdateField('domain', e.target.value)}
                                        placeholder="Add website..."
                                    />
                                    {editForm.domain && (
                                        <a href={`https://${editForm.domain}`} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-blue-600">
                                            <LinkIcon size={10} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-2">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Quick Links Section */}
                    {linkColumns.length > 0 && (
                        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={12} className="text-blue-500" />
                                <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Quick Links</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {linkColumns.map(col => {
                                    const value = (editForm as any)[col.accessorKey];
                                    const abbreviation = (col as any).config?.abbreviation || col.label.substring(0, 3).toUpperCase();
                                    const hasUrl = value && value.trim();

                                    return hasUrl ? (
                                        <a
                                            key={col.id}
                                            href={value.startsWith('http') ? value : `https://${value}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-full shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:shadow transition-all cursor-pointer"
                                            title={`${col.label}: ${value}`}
                                        >
                                            {abbreviation}
                                            <ExternalLink size={10} className="opacity-60" />
                                        </a>
                                    ) : (
                                        <div
                                            key={col.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-400 text-xs font-medium rounded-full cursor-default"
                                            title={`${col.label}: Not set`}
                                        >
                                            {abbreviation}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Properties Grid */}
                    <div className="px-5 py-6 border-b border-gray-100">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 pl-1">Properties</h3>
                        <div className="space-y-1">
                            {detailColumns.map(col => (
                                <div key={col.id} className="group grid grid-cols-[140px_1fr_auto] items-start gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5 overflow-hidden">
                                        <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                            <TypeIcon type={col.type} />
                                        </div>
                                        <span className="truncate" title={col.label}>{col.label}</span>
                                    </div>
                                    <div className="relative min-w-0">
                                        {renderFieldInput(col)}
                                    </div>

                                    {/* Action buttons - Settings & Hide */}
                                    <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div
                                            className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                                            onClick={(e) => { e.stopPropagation(); onEditAttribute(col); }}
                                            title="Edit property"
                                        >
                                            <Settings size={12} />
                                        </div>
                                        {onToggleVisibility && (
                                            <div
                                                className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(col.id); }}
                                                title="Hide property"
                                            >
                                                <EyeOff size={12} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div
                                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer mt-4 pl-1 py-1"
                                onClick={onAddProperty}
                            >
                                <Plus size={12} /> Add property
                            </div>

                            {/* Hidden Properties Section */}
                            {hiddenColumns.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div
                                        className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-600 pl-1 py-1"
                                        onClick={() => setShowHiddenProps(!showHiddenProps)}
                                    >
                                        {showHiddenProps ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        <span>{hiddenColumns.length} hidden {hiddenColumns.length === 1 ? 'property' : 'properties'}</span>
                                    </div>

                                    {showHiddenProps && (
                                        <div className="mt-2 space-y-1">
                                            {hiddenColumns.map(col => (
                                                <div key={col.id} className="group flex items-center justify-between py-1.5 px-2 -mx-1 rounded hover:bg-gray-50">
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <div className="p-1 rounded bg-gray-100 text-gray-400 flex-shrink-0">
                                                            <TypeIcon type={col.type} />
                                                        </div>
                                                        <span className="truncate" title={col.label}>{col.label}</span>
                                                    </div>
                                                    {onToggleVisibility && (
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                                                            onClick={() => onToggleVisibility(col.id)}
                                                            title="Show property"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Section Placeholder */}
                    <div className="px-5 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Activity</h3>
                        </div>
                        <div className="text-sm text-gray-500 italic pl-1">
                            No recent activity.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CompanyDetailPanel;
