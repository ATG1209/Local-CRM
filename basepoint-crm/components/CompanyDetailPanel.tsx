import React, { useState, useEffect, useRef } from 'react';
import { ACTIVITY_COLUMNS, ViewState, Company, Activity, Person, SavedView, ColumnDefinition, ColumnType } from '../types';
import SearchableSelect from './SearchableSelect';
import RelationPicker from './RelationPicker';
import CompanyAvatar from './CompanyAvatar';
import ActivityTimeline from './ActivityTimeline';
import TaskDetailPanel from './TaskDetailPanel';
import DatePickerPopover from './DatePickerPopover';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
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
    Activity as ActivityIcon,
    MapPin,
    Phone,
    Layout,
    List,
    Grid2X2,
    RefreshCcw
} from 'lucide-react';

import PersonDetailPanel from './PersonDetailPanel';
import { fetchAttributes } from '../utils/schemaApi';

interface CompanyDetailPanelProps {
    company: Company | null;
    isOpen: boolean;
    onClose: () => void;
    companies: Company[];
    people: Person[];
    activities: Activity[];
    onUpdate: (company: Company) => void;
    columns: ColumnDefinition[];
    onEditAttribute: (col: ColumnDefinition) => void;
    onAddProperty: () => void;
    onToggleVisibility?: (colId: string) => void;
    onOpenActivityModal?: (companyId: string) => void;
    onUpdateActivity: (activity: Activity) => void;
    onDeleteActivity: (id: string) => void;
    onUpdatePerson: (person: Person) => void;
    onDeletePerson: (id: string) => void;
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
        case 'status': return <ActivityIcon size={14} className="text-gray-400" />;
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
    companies,
    people,
    activities,
    onUpdate,
    columns,
    onEditAttribute,
    onAddProperty,
    onToggleVisibility,
    onOpenActivityModal,
    onUpdateActivity,
    onDeleteActivity,
    onUpdatePerson,
    onDeletePerson
}) => {
    const [showHiddenProps, setShowHiddenProps] = useState(false);
    const [editForm, setEditForm] = useState<Company | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [editingHeader, setEditingHeader] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [personColumns, setPersonColumns] = useState<ColumnDefinition[]>([]);
    const [logTouchPickerOpen, setLogTouchPickerOpen] = useState(false);
    const logTouchTriggerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (company) {
            setEditForm(company);
            setEditingHeader(false);
        }
    }, [company]);

    useEffect(() => {
        const loadPersonAttributes = async () => {
            try {
                const attrs = await fetchAttributes('obj_people');
                const { attributeToColumn } = await import('../utils/attributeHelpers');
                setPersonColumns(attrs.map(attr => attributeToColumn(attr)));
            } catch (err) {
                console.error("Failed to load person attributes", err);
            }
        };
        if (isOpen) {
            loadPersonAttributes();
        }
    }, [isOpen]);

    // Handle Escape key to close the panel (unless nested panel is handled first)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !editingActivity && !editingPerson) {
                onClose();
            }
        };

        if (isOpen) {
            // Priority listener, handle only if editingActivity is NOT open
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, editingActivity]);

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

    const inputClass = "w-full text-sm px-0 py-1 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent rounded transition-all outline-none";

    const renderFieldInput = (col: ColumnDefinition) => {
        const value = (editForm as any)[col.accessorKey];

        if (col.readonly) {
            return (
                <div className="text-sm text-gray-500 py-1 transition-all">
                    {col.type === 'timestamp' || col.type === 'date'
                        ? (value ? new Date(value).toLocaleDateString() : '-')
                        : (typeof value === 'object' && value !== null ? '-' : (value || '-'))}
                </div>
            );
        }

        // Special case: LogTouchControl for lastLoggedAt field
        const isLogTouchField = col.accessorKey === 'lastLoggedAt' ||
            col.id === 'lastLoggedAt' ||
            (col.label && col.label.toLowerCase().includes('last logged'));

        if (isLogTouchField) {
            let loggedDate = value ? new Date(value) : null;
            // Validate date
            if (loggedDate && isNaN(loggedDate.getTime())) {
                loggedDate = null;
            }

            // Logic: Incremental time with urgency colors
            let statusText = 'Never logged';
            let colorClass = 'text-gray-400 italic';

            if (loggedDate) {
                const daysSince = differenceInCalendarDays(new Date(), loggedDate);

                if (daysSince === 0) {
                    statusText = 'Today';
                } else if (daysSince === 1) {
                    statusText = 'Yesterday';
                } else {
                    statusText = `${daysSince} days ago`;
                }

                if (daysSince >= 14) {
                    colorClass = 'text-red-600 font-medium';
                } else if (daysSince >= 10) {
                    colorClass = 'text-yellow-600 font-medium';
                } else {
                    colorClass = 'text-gray-900';
                }
            }

            return (
                <div className="flex items-center gap-2 min-h-[32px] relative group">
                    {/* Quick Log Button - Always visible */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateField(col.accessorKey, Date.now());
                        }}
                        className="p-1.5 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Log touch now"
                    >
                        <RefreshCcw size={14} />
                    </button>

                    <div
                        className={`flex-1 flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${logTouchPickerOpen ? 'bg-gray-50' : ''}`}
                        onClick={() => setLogTouchPickerOpen(true)}
                        ref={logTouchTriggerRef}
                    >
                        <span className={`text-sm ${colorClass}`}>
                            {statusText}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLogTouchPickerOpen(true);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                        title="Pick a date"
                    >
                        <Calendar size={14} />
                    </button>

                    <DatePickerPopover
                        date={loggedDate}
                        onChange={(newDate) => {
                            if (newDate) {
                                handleUpdateField(col.accessorKey, newDate.getTime());
                            } else {
                                handleUpdateField(col.accessorKey, null);
                            }
                        }}
                        onClose={() => setLogTouchPickerOpen(false)}
                        isOpen={logTouchPickerOpen}
                        triggerRef={logTouchTriggerRef as React.RefObject<HTMLElement>}
                        align="left"
                    />
                </div>
            );
        }

        switch (col.type) {
            case 'relation': // Multi-select for POC and other relations
                return (
                    <RelationPicker
                        value={value}
                        onChange={(newIds) => handleUpdateField(col.accessorKey, newIds)}
                        onItemClick={col.accessorKey === 'attr_comp_poc' || col.accessorKey === 'pointOfContactId' ? (id) => setEditingPerson(people.find(p => p.id === id) || null) : undefined}
                        options={personOptions}
                        type="person"
                        placeholder="Select..."
                        emptyMessage="Select as many as you like"
                    />
                );
            case 'select':
            case 'multi-select':
                if (col.options && col.options.length > 0) {
                    return (
                        <SearchableSelect
                            value={Array.isArray(value) ? value[0] : value}
                            onChange={(val) => handleUpdateField(col.accessorKey, col.type === 'multi-select' ? [val] : val)}
                            options={col.options.map(opt => ({
                                id: opt.id,
                                label: opt.label,
                                icon: <div className={`w-3 h-3 rounded-full ${opt.color.split(' ')[0]}`}></div>
                            }))}
                            className="border-transparent bg-transparent hover:bg-gray-50"
                        />
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                );
            case 'rating':
                return (
                    <div className="flex items-center gap-1">
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
                            className={`${inputClass} min-h-[80px] py-2 resize-none`}
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

    const detailColumns = columns.filter(col =>
        !col.hidden &&
        col.id !== 'name' &&
        col.id !== 'domain' &&
        col.type !== 'url'
    );

    const hiddenColumns = columns.filter(col =>
        col.hidden &&
        col.id !== 'name' &&
        col.id !== 'domain'
    );

    const linkColumns = columns.filter(col =>
        !col.hidden &&
        (col.type === 'url' || col.id === 'domain')
    );

    if (!isOpen || !company || !editForm) return null;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
                    onClick={onClose}
                />
            )}
            <div
                className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                ref={panelRef}
            >
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
                                <div key={col.id} className="group grid grid-cols-[160px_1fr_auto] items-center gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 min-h-[32px] overflow-hidden">
                                        <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                            <TypeIcon type={col.type} />
                                        </div>
                                        <span className="truncate" title={col.label}>{col.label}</span>
                                    </div>

                                    <div className="relative min-w-0">
                                        {renderFieldInput(col)}
                                    </div>

                                    {/* Action buttons - Settings & Hide */}
                                    <div className="flex items-center gap-0.5 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                <div key={col.id} className="group grid grid-cols-[160px_1fr_auto] items-center gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1 opacity-70 hover:opacity-100">
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 min-h-[32px]">
                                                        <div className="p-1 rounded bg-gray-100 text-gray-400 flex-shrink-0">
                                                            <TypeIcon type={col.type} />
                                                        </div>
                                                        <span className="truncate" title={col.label}>{col.label}</span>
                                                    </div>
                                                    <div className="relative min-w-0 pointer-events-none grayscale opacity-60">
                                                        {renderFieldInput(col)}
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

                    {/* Activity Section */}
                    <div className="py-6">
                        <div className="flex items-center justify-between mb-4 px-5">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Activity</h3>
                            {onOpenActivityModal && company && (
                                <button
                                    onClick={() => onOpenActivityModal(company.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + Log activity
                                </button>
                            )}
                        </div>
                        <ActivityTimeline
                            activities={activities.filter(a => a.linkedCompanyId === company?.id)}
                            companies={companies}
                            people={people}
                            showPersonLinks={true}
                            onOpenActivity={(a) => setEditingActivity(a)}
                        />
                    </div>
                </div>

                {/* Activity Detail Panel (Nested) */}
                <TaskDetailPanel
                    task={editingActivity}
                    isOpen={!!editingActivity}
                    onClose={() => setEditingActivity(null)}
                    companies={companies}
                    people={people}
                    onUpdate={onUpdateActivity}
                    onDelete={onDeleteActivity}
                    columns={ACTIVITY_COLUMNS}
                    onEditAttribute={() => { }}
                    onAddProperty={() => { }}
                />

                {/* Person Detail Panel (Nested) */}
                <PersonDetailPanel
                    person={editingPerson}
                    isOpen={!!editingPerson}
                    onClose={() => setEditingPerson(null)}
                    companies={companies}
                    people={people}
                    activities={activities}
                    onUpdate={onUpdatePerson}
                    onDeleteActivity={onDeleteActivity}
                    onUpdateActivity={onUpdateActivity}
                    onDeletePerson={onDeletePerson}
                    columns={personColumns}
                    onEditAttribute={() => { }}
                    onAddProperty={() => { }}
                />
            </div>
        </>
    );
};

export default CompanyDetailPanel;
