import React, { useState, useRef, useEffect } from 'react';
import ViewSettingsMenu from './ViewSettingsMenu';
import { Company, Task, SavedView, ColumnDefinition, ColumnType, Person } from '../types';
import ImportModal from './ImportModal';
import CreateAttributeModal from './CreateAttributeModal';
import AttributePicker from './AttributePicker';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
import TypeIcon from './TypeIcon';
import SortableHeader from './SortableHeader';
import DatePickerPopover from './DatePickerPopover';
import { downloadCSV } from '../utils/csvHelper';
import { sortData, SortConfig } from '../utils/sortHelper';
import { fetchAttributes, createAttribute, updateAttribute, Attribute, fetchRecords, createRecord, updateRecord, deleteRecord } from '../utils/schemaApi';
import { attributeToColumn } from '../utils/attributeHelpers';
import {
    Plus,
    Download,
    MoreHorizontal,
    ChevronDown,
    Globe,
    GripVertical,
    EyeOff,
    Check,
    FileDown,
    Star,
    Trash2,
    X,
    Calendar,
    User,
    Link as LinkIcon
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';

// TypeIcon is now imported from shared component

interface GenericObjectViewProps {
    objectId: string;
    objectName: string; // e.g. "Company", "Person", "Invoice"
    slug?: string; // Table name / API slug
    data?: any[]; // Optional external data
    people?: Person[]; // For legacy relation support
    onAddRecord?: (record: any) => void;
    onUpdateRecord?: (record: any) => void;
    onDeleteRecord?: (id: string) => void;
    DetailPanelRequest?: (props: {
        isOpen: boolean;
        onClose: () => void;
        data: any;
        onUpdate: (data: any) => void;
        columns: ColumnDefinition[];
        people?: Person[];
        onEditAttribute: (col: ColumnDefinition) => void;
        onAddProperty: () => void;
    }) => React.ReactNode;
    // Extension points
    columns?: ColumnDefinition[]; // Override default attribute-based columns
    renderCustomCell?: (record: any, column: ColumnDefinition) => React.ReactNode;
}

const GenericObjectView: React.FC<GenericObjectViewProps> = ({
    objectId,
    objectName,
    slug,
    data: externalData,
    people = [],
    onAddRecord: externalAdd,
    onUpdateRecord: externalUpdate,
    onDeleteRecord: externalDelete,
    DetailPanelRequest,
    columns: externalColumns, // Destructure
    renderCustomCell // Destructure
}) => {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [columns, setColumns] = useState<ColumnDefinition[]>(externalColumns || []);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false); // Default to false if we have columns

    // Internal data state if externalData is not provided
    const [internalData, setInternalData] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const data = externalData || internalData;

    const [currentViewId, setCurrentViewId] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateAttributeOpen, setIsCreateAttributeOpen] = useState(false);

    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

    const [activeDragColumn, setActiveDragColumn] = useState<ColumnDefinition | null>(null);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'asc' });
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);

    // Bulk Selection State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
    const [bulkActionMenu, setBulkActionMenu] = useState<string | null>(null);


    const viewMenuRef = useRef<HTMLDivElement>(null);
    const addColumnRef = useRef<HTMLDivElement>(null);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);

    // Load attributes and data
    useEffect(() => {
        const load = async () => {
            setIsLoadingAttributes(true);
            try {
                // Always fetch attributes to support dynamic properties, even for standard views
                const attrs = await fetchAttributes(objectId);
                setAttributes(attrs);

                if (!externalColumns) {
                    // Standard dynamic view: use all attributes
                    const cols = attrs.map(attr => ({
                        ...attributeToColumn(attr),
                        visible: true
                    }));
                    setColumns(cols);
                } else {
                    // Hybrid view (Tasks/People): Use external system columns + append custom attributes
                    const systemAttrIds = new Set(externalColumns.map(c => c.id));
                    // Also check for accessor keys to avoid duplicates? 
                    // Usually externalColumns cover system attributes.

                    const dynamicCols = attrs
                        .filter(attr => !attr.isSystem) // Only add custom attributes
                        .map(attr => ({
                            ...attributeToColumn(attr),
                            visible: true
                        }));

                    setColumns([...externalColumns, ...dynamicCols]);
                }
            } catch (err) {
                console.error('Failed to load attributes', err);
                // Fallback for hybrid if fetch fails
                if (externalColumns) setColumns(externalColumns);
            } finally {
                setIsLoadingAttributes(false);
            }

            // Load data if internal
            if (!externalData && slug) {
                setIsLoadingData(true);
                try {
                    const records = await fetchRecords(slug);
                    setInternalData(records);
                } catch (err) {
                    console.error('Failed to load records', err);
                } finally {
                    setIsLoadingData(false);
                }
            }
        };
        load();
    }, [objectId, slug, externalData]);

    const sortedData = React.useMemo(() => {
        // Use existing sortHelper but adapted regarding column definitions
        return sortData(data, sortConfig, columns, { people });
    }, [data, sortConfig, columns, people]);

    // DnD-Kit Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Drag and Drop (dnd-kit) ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const col = columns.find(c => c.id === active.id);
        if (col) setActiveDragColumn(col);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex((col) => col.id === active.id);
                const newIndex = items.findIndex((col) => col.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveDragColumn(null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {

            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) setIsViewMenuOpen(false);
            if (addColumnRef.current && !addColumnRef.current.contains(event.target as Node)) setIsAddColumnOpen(false);
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) setActiveHeaderMenu(null);
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) setIsImportMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Escape key handler for bulk mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.defaultPrevented) {
                if (isBulkMode) {
                    handleExitBulkMode();
                    e.preventDefault();
                    return;
                }

                setIsViewMenuOpen(false);
                setIsAddColumnOpen(false);
                setActiveHeaderMenu(null);
                setIsImportMenuOpen(false);
                setBulkActionMenu(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBulkMode]);

    // --- Bulk Selection Handlers ---
    const handleHeaderCheckboxClick = () => {
        if (!isBulkMode) {
            setIsBulkMode(true);
            setSelectedRecordIds(new Set(sortedData.map(r => r.id)));
        } else {
            if (selectedRecordIds.size === sortedData.length) {
                setSelectedRecordIds(new Set());
            } else {
                setSelectedRecordIds(new Set(sortedData.map(r => r.id)));
            }
        }
    };

    const handleRowCheckboxClick = (recordId: string) => {
        const newSet = new Set(selectedRecordIds);
        if (newSet.has(recordId)) {
            newSet.delete(recordId);
        } else {
            newSet.add(recordId);
        }
        setSelectedRecordIds(newSet);
    };

    const handleExitBulkMode = () => {
        setIsBulkMode(false);
        setSelectedRecordIds(new Set());
        setBulkActionMenu(null);
    };

    const handleBulkUpdate = async (field: string, value: any) => {
        for (const id of selectedRecordIds) {
            await handleUpdateField(id, field, value);
        }
        setBulkActionMenu(null);
    };

    const handleBulkDelete = async () => {
        if (externalDelete) {
            selectedRecordIds.forEach(id => externalDelete(id));
        } else if (slug) {
            for (const id of selectedRecordIds) {
                try {
                    await deleteRecord(slug, id);
                    setInternalData(prev => prev.filter(r => r.id !== id));
                } catch (err) {
                    console.error('Failed to delete record', id, err);
                }
            }
        }
        setSelectedRecordIds(new Set());
        setIsBulkMode(false);
        setBulkActionMenu(null);
    };

    const handleAddInternal = async () => {
        // Basic empty record creation
        const newRecord: any = {
            createdAt: new Date().toISOString()
        };
        // Populate default fields if they exist
        if (columns.find(c => c.accessorKey === 'name')) newRecord.name = `New ${objectName}`;

        if (externalAdd) {
            // Legacy ID generation if needed, but normally handled by server
            newRecord.id = Math.random().toString(36).substr(2, 9);
            externalAdd(newRecord);
        } else if (slug) {
            try {
                const created = await createRecord(slug, newRecord);
                setInternalData(prev => [created, ...prev]);
            } catch (err) {
                console.error("Failed to create record", err);
            }
        }
    };

    const handleUpdateField = async (id: string, field: string, value: any) => {
        const record = data.find(r => r.id === id);
        if (record) {
            const updatedRecord = { ...record, [field]: value };

            if (externalUpdate) {
                externalUpdate(updatedRecord);
            } else if (slug) {
                // Optimistic update
                setInternalData(prev => prev.map(r => r.id === id ? updatedRecord : r));
                try {
                    await updateRecord(slug, id, { [field]: value });
                } catch (err) {
                    console.error("Failed to update field", err);
                    // Revert?
                }
            }
        }
    };

    const handleDetailUpdate = async (updatedData: any) => {
        if (externalUpdate) {
            externalUpdate(updatedData);
        } else if (slug) {
            setInternalData(prev => prev.map(r => r.id === updatedData.id ? updatedData : r));
            try {
                await updateRecord(slug, updatedData.id, updatedData);
            } catch (err) {
                console.error("Failed to update record", err);
            }
        }
    }

    // Attribute Management
    const handleSaveAttribute = async (attributeData: any) => {
        try {
            if (editingAttribute) {
                await updateAttribute(editingAttribute.id, attributeData);
            } else {
                await createAttribute(objectId, attributeData);
            }

            // Reload attributes
            const attrs = await fetchAttributes(objectId);
            setAttributes(attrs);
            setColumns(attrs.map(a => {
                // Preserve visibility state
                const existing = columns.find(c => c.id === a.id);
                return { ...attributeToColumn(a), visible: existing ? existing.visible : true };
            }));
            setEditingAttribute(null);
        } catch (err) {
            console.error('Failed to save attribute', err);
        }
    };

    const handleToggleAttribute = (attrId: string) => {
        setColumns(columns.map(c => c.id === attrId ? { ...c, visible: !c.visible } : c));
    };

    const handleEditAttributeRaw = (col: ColumnDefinition) => {
        const attr = attributes.find(a => a.id === col.id);
        if (attr) {
            setEditingAttribute(attr);
            setIsCreateAttributeOpen(true);
            setActiveHeaderMenu(null);
        }
    };

    const handleEditAttributeFromPicker = (attr: Attribute) => {
        setEditingAttribute(attr);
        setIsCreateAttributeOpen(true);
        setIsAddColumnOpen(false);
    };

    const handleStartCreateAttribute = () => {
        setEditingAttribute(null);
        setIsCreateAttributeOpen(true);
        setIsAddColumnOpen(false);
    }

    // Rendering
    const safeDateValue = (value: any) => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    };

    const personOptions = people.map(p => ({
        id: p.id,
        label: p.name,
        icon: <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{p.name.substring(0, 1).toUpperCase()}</div>
    }));

    const renderCellContent = (record: any, col: ColumnDefinition) => {
        try {
            const custom = renderCustomCell ? renderCustomCell(record, col) : null;
            if (custom) return custom;
        } catch (err) {
            console.error('Error rendering custom cell', err);
            return <div className="text-red-500 text-xs p-2">Error</div>;
        }

        const value = record[col.accessorKey];

        if (col.readonly) {
            return (
                <div className="w-full h-full px-3 flex items-center text-gray-500 select-none bg-gray-50/30">
                    {col.type === 'timestamp' || col.type === 'date'
                        ? (value ? new Date(value).toLocaleDateString() : '-')
                        : (value || '-')}
                </div>
            );
        }

        switch (col.type) {
            case 'text':
            case 'url':
            case 'email':
            case 'phone':
                return (
                    <input
                        className="w-full h-full px-3 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-300"
                        value={value || ''}
                        onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.value)}
                        placeholder="-"
                    />
                );
            case 'checkbox':
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                    </div>
                );
            case 'rating':
                return (
                    <div className="w-full h-full px-3 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                className={`cursor-pointer ${star <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                                onClick={() => handleUpdateField(record.id, col.accessorKey, star)}
                            />
                        ))}
                    </div>
                );
            case 'currency':
            case 'number':
                return (
                    <div className="w-full h-full px-3 flex items-center relative">
                        {col.type === 'currency' && <span className="text-gray-400 text-xs absolute left-3">$</span>}
                        <input
                            type="number"
                            className={`w-full bg-transparent outline-none ${col.type === 'currency' ? 'pl-4' : ''} text-sm text-gray-900 placeholder:text-gray-300`}
                            value={value || ''}
                            onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.value)}
                            placeholder={col.type === 'currency' ? '0.00' : '-'}
                        />
                    </div>
                );
            case 'relation':
                // Simplification: For now only support People relation if it's the POC field
                // In future: Check col.options or config for target
                if (col.id === 'attr_comp_poc' || col.accessorKey === 'pointOfContactId') {
                    return (
                        <SearchableSelect
                            value={value}
                            onChange={(val) => handleUpdateField(record.id, col.accessorKey, val)}
                            options={personOptions}
                            className="border-transparent bg-transparent"
                        />
                    );
                }
                // Fallback for other relations (display count or simplified view)
                return (
                    <div className="w-full h-full px-3 flex items-center text-sm text-gray-500 italic">
                        {value ? (Array.isArray(value) ? `${value.length} items` : '1 item') : 'Empty'}
                    </div>
                );
            case 'multi-select':
            case 'select':
                if (col.options && col.options.length > 0) {
                    return (
                        <SearchableSelect
                            value={Array.isArray(value) ? value[0] : value}
                            onChange={(val) => handleUpdateField(record.id, col.accessorKey, col.type === 'multi-select' ? [val] : val)}
                            options={col.options.map(opt => ({
                                id: opt.id,
                                label: opt.label,
                                icon: <div className={`w-3 h-3 rounded-full ${opt.color.split(' ')[0]}`}></div>
                            }))}
                            className="border-transparent bg-transparent"
                        />
                    );
                }
                // Fallback to text if no options defined
                return (
                    <div className="w-full h-full px-3 flex items-center">
                        <input
                            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300"
                            value={Array.isArray(value) ? value.join(', ') : (value || '')}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateField(record.id, col.accessorKey, col.type === 'multi-select' ? val.split(', ') : val)
                            }}
                            placeholder={col.type === 'multi-select' ? "tag1, tag2..." : "Select..."}
                        />
                    </div>
                );
            case 'date':
                return (
                    <input
                        type="date"
                        className="w-full h-full px-3 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300"
                        value={safeDateValue(value)}
                        onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.value)}
                    />
                );
            default:
                return (
                    <input
                        className="w-full h-full px-3 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-300"
                        value={value || ''}
                        onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.value)}
                        placeholder="-"
                    />
                );
        }
    };

    const visibleColumns = columns.filter(c => c.visible);

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onComplete={() => {
                    setTimeout(() => {
                        setIsImportModalOpen(false);
                        handleAddInternal();
                    }, 1000);
                }}
                entityType={objectName.toLowerCase() + "s"}
            />
            <CreateAttributeModal
                isOpen={isCreateAttributeOpen}
                onClose={() => { setIsCreateAttributeOpen(false); setEditingAttribute(null); }}
                onSave={handleSaveAttribute}
                initialData={editingAttribute}
            />

            {/* Header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 bg-white z-20">
                <div className="flex items-center gap-2 relative">
                    <div className="bg-blue-100 text-blue-700 p-1 rounded-md">
                        {/* Simplified icon logic - could be dynamic based on object icon */}
                        <Globe size={16} />
                    </div>
                    <span className="font-semibold text-gray-900">
                        {/* Support dynamic name or pluralization */}
                        {slug ? objectName : `All ${objectName}s`}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative" ref={importMenuRef}>
                        <button
                            onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
                        >
                            <Download size={14} /> Import / Export <ChevronDown size={12} />
                        </button>
                        {isImportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100 py-1">
                                <div onClick={() => { setIsImportModalOpen(true); setIsImportMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                                    <Download size={14} /> Import from CSV
                                </div>
                                <div onClick={() => downloadCSV(data, `${objectName.toLowerCase()}s_export`)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                                    <FileDown size={14} /> Export to CSV
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAddInternal}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                    >
                        <Plus size={14} /> New
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="h-10 border-b border-gray-200 flex items-center px-4 gap-2 bg-white flex-shrink-0 z-10">
                {/* View Settings */}
                <ViewSettingsMenu
                    columns={columns}
                    setColumns={setColumns}
                />

                {/* Add Property Button */}
                <div className="relative" ref={addColumnRef}>
                    <div
                        onClick={() => setIsAddColumnOpen(!isAddColumnOpen)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${isAddColumnOpen ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Plus size={14} className="text-gray-500" />
                        <span>Add property</span>
                    </div>
                    {isAddColumnOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50">
                            <AttributePicker
                                attributes={attributes}
                                visibleAttributeIds={visibleColumns.map(c => c.id)}
                                onToggleAttribute={handleToggleAttribute}
                                onCreateAttribute={handleStartCreateAttribute}
                                onEditAttribute={handleEditAttributeFromPicker}
                                objectName={objectName}
                            />
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 rounded-md text-xs text-gray-600 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <MoreHorizontal size={14} className="text-gray-400" />
                    <span>
                        Sorted by <strong>{sortConfig ? columns.find(c => c.id === sortConfig.key)?.label : 'Default'}</strong>
                        {sortConfig && (sortConfig.direction === 'asc' ? ' (Asc)' : ' (Desc)')}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white scroll-smooth pb-20">
                {isLoadingData ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading records...</div>
                ) : (
                    <table className="w-full border-collapse table-fixed min-w-full">
                        <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_rgba(229,231,235,1)]">
                            <tr>
                                {/* Selection Column Header - Only in Bulk Mode */}
                                {isBulkMode && (
                                    <th className="w-10 pl-4 py-2.5 text-left border-b border-gray-200 bg-white">
                                        <div
                                            onClick={handleHeaderCheckboxClick}
                                            className="w-4 h-4 border border-gray-300 rounded hover:border-blue-500 cursor-pointer flex items-center justify-center transition-colors"
                                        >
                                            {selectedRecordIds.size === sortedData.length && sortedData.length > 0 && (
                                                <Check size={12} className="text-blue-600" />
                                            )}
                                            {selectedRecordIds.size > 0 && selectedRecordIds.size < sortedData.length && (
                                                <div className="w-2 h-0.5 bg-blue-600 rounded" />
                                            )}
                                        </div>
                                    </th>
                                )}
                                {/* First Column Header - Entry point for bulk mode - Replaces Selection Column when not in bulk mode */}
                                {!isBulkMode && (
                                    <th className="w-10 pl-4 py-2.5 text-left border-b border-gray-200 bg-white">
                                        <div
                                            onClick={handleHeaderCheckboxClick}
                                            className="w-4 h-4 border border-gray-300 rounded hover:border-blue-500 cursor-pointer flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                            title="Select all"
                                        />
                                    </th>
                                )}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={visibleColumns.map(c => c.id)}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {visibleColumns.map((col, idx) => (
                                            <SortableHeader
                                                key={col.id}
                                                column={col}
                                                activeHeaderMenu={activeHeaderMenu}
                                                setActiveHeaderMenu={setActiveHeaderMenu}
                                                setSortConfig={setSortConfig}
                                                onEditAttribute={handleEditAttributeRaw}
                                                onHideColumn={handleToggleAttribute}
                                            />
                                        ))}
                                    </SortableContext>
                                    <DragOverlay>
                                        {activeDragColumn ? (
                                            <div
                                                className="px-3 py-2.5 bg-white border border-gray-200 shadow-lg flex items-center gap-1.5 opacity-90 rounded cursor-grabbing"
                                            >
                                                <TypeIcon type={activeDragColumn.type} />
                                                <span className="text-xs font-medium text-gray-700">{activeDragColumn.label}</span>
                                                <div className="ml-auto">
                                                    <ChevronDown size={12} />
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map(record => (
                                <tr key={record.id} className={`group hover:bg-gray-50 transition-colors h-10 ${isBulkMode && selectedRecordIds.has(record.id) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}>
                                    {/* Selection Checkbox - Only in Bulk Mode */}
                                    {isBulkMode && (
                                        <td className="pl-4 py-1 border-b border-gray-100">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleRowCheckboxClick(record.id); }}
                                                className="w-4 h-4 border border-gray-300 rounded cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors bg-white"
                                            >
                                                {selectedRecordIds.has(record.id) && <Check size={12} className="text-blue-600" />}
                                            </div>
                                        </td>
                                    )}
                                    {/* First Column - Entry point: Only when NOT in bulk mode */}
                                    {!isBulkMode && (
                                        <td className="pl-4 py-1 border-b border-gray-100">
                                            <div
                                                className="w-4 h-4 border border-gray-300 rounded hover:border-blue-500 cursor-pointer transition-all opacity-0 group-hover:opacity-100 bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowCheckboxClick(record.id);
                                                    setIsBulkMode(true);
                                                }}
                                            />
                                        </td>
                                    )}
                                    {visibleColumns.map(col => (
                                        <td key={col.id} className="py-0 border-b border-gray-100 border-r border-gray-50 text-sm text-gray-700 relative">
                                            {col.accessorKey === 'name' ? (
                                                <div
                                                    className="flex items-center gap-2 px-3 py-2 h-full cursor-pointer hover:bg-gray-100"
                                                    onClick={() => setSelectedRecord(record)}
                                                >
                                                    <CompanyAvatar name={record.name} size="sm" />
                                                    <span className="font-medium text-gray-900 truncate w-full">{record.name}</span>
                                                </div>
                                            ) : (
                                                renderCellContent(record, col)
                                            )}
                                        </td>
                                    ))}
                                    <td className="border-b border-gray-100"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Bulk Actions Toolbar */}
            {isBulkMode && (() => {
                // Identify column types for quick actions
                const dateColumns = visibleColumns.filter(col => !col.readonly && (col.type === 'date' || col.type === 'timestamp'));
                const relationColumns = visibleColumns.filter(col => !col.readonly && col.type === 'relation');
                const selectColumns = visibleColumns.filter(col => !col.readonly && (col.type === 'select' || col.type === 'multi-select'));
                const checkboxColumns = visibleColumns.filter(col => !col.readonly && col.type === 'checkbox');
                const ratingColumns = visibleColumns.filter(col => !col.readonly && col.type === 'rating');
                const clearableColumns = visibleColumns.filter(col => !col.readonly && col.accessorKey !== 'name');

                return (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-30">
                        {/* Selection Count */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md">
                            {selectedRecordIds.size} selected
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1" />

                        {/* Quick Action: First Date Column */}
                        {dateColumns.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setBulkActionMenu(bulkActionMenu === 'date' ? null : 'date')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={selectedRecordIds.size === 0}
                                >
                                    <Calendar size={14} />
                                    <span>{dateColumns[0].label}</span>
                                </button>
                                {bulkActionMenu === 'date' && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-2 min-w-[280px]">
                                        <DatePickerPopover
                                            isOpen={true}
                                            date={null}
                                            onChange={(d) => handleBulkUpdate(dateColumns[0].accessorKey, d)}
                                            onClose={() => setBulkActionMenu(null)}
                                            triggerRef={{ current: null }}
                                            align="left"
                                            forcedPosition="top"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Action: First Relation Column */}
                        {relationColumns.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setBulkActionMenu(bulkActionMenu === 'relation' ? null : 'relation')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={selectedRecordIds.size === 0}
                                >
                                    <LinkIcon size={14} />
                                    <span>{relationColumns[0].label}</span>
                                </button>
                                {bulkActionMenu === 'relation' && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-2 min-w-[250px]">
                                        <div className="text-xs font-medium text-gray-500 mb-2 px-1">Set {relationColumns[0].label}</div>
                                        <SearchableSelect
                                            value=""
                                            onChange={(val) => handleBulkUpdate(relationColumns[0].accessorKey, val)}
                                            options={people.map(p => ({ id: p.id, label: p.name, icon: <User size={14} className="text-gray-400" /> }))}
                                            className="border border-gray-200 rounded-md"
                                            dropdownPosition="top"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button
                            onClick={handleExitBulkMode}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Exit bulk mode"
                        >
                            <X size={14} />
                        </button>

                        <div className="w-px h-6 bg-gray-200 mx-1" />

                        {/* Delete Action */}
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>

                        {/* More Actions */}
                        <div className="relative">
                            <button
                                onClick={() => setBulkActionMenu(bulkActionMenu === 'more' ? null : 'more')}
                                className="flex items-center justify-center w-8 h-8 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            {bulkActionMenu === 'more' && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 max-h-80 overflow-y-auto">
                                    <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Update Fields</div>

                                    {/* Checkbox Columns */}
                                    {checkboxColumns.map(col => (
                                        <div key={col.id} className="px-3 py-2 border-b border-gray-50">
                                            <div className="text-xs font-medium text-gray-600 mb-1.5">{col.label}</div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleBulkUpdate(col.accessorKey, true)}
                                                    className="flex-1 text-xs px-2 py-1 hover:bg-gray-100 rounded text-gray-700 border border-gray-200"
                                                >
                                                    ✓ Yes
                                                </button>
                                                <button
                                                    onClick={() => handleBulkUpdate(col.accessorKey, false)}
                                                    className="flex-1 text-xs px-2 py-1 hover:bg-gray-100 rounded text-gray-700 border border-gray-200"
                                                >
                                                    ✗ No
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Select Columns */}
                                    {selectColumns.map(col => (
                                        <div key={col.id} className="px-3 py-2 border-b border-gray-50">
                                            <div className="text-xs font-medium text-gray-600 mb-1.5">{col.label}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {(col.options || []).slice(0, 6).map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleBulkUpdate(col.accessorKey, opt.id)}
                                                        className={`text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 ${opt.color?.split(' ')[0] || ''}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Rating Columns */}
                                    {ratingColumns.map(col => (
                                        <div key={col.id} className="px-3 py-2 border-b border-gray-50">
                                            <div className="text-xs font-medium text-gray-600 mb-1.5">{col.label}</div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleBulkUpdate(col.accessorKey, star)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                    >
                                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Clear Field Options */}
                                    {clearableColumns.length > 0 && (
                                        <>
                                            <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Clear Fields</div>
                                            {clearableColumns.map(col => (
                                                <button
                                                    key={col.id}
                                                    onClick={() => handleBulkUpdate(col.accessorKey, null)}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                                                >
                                                    Clear {col.label}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1" />

                        {/* Exit Bulk Mode */}
                        <button
                            onClick={handleExitBulkMode}
                            className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-md transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })()}

            {DetailPanelRequest && DetailPanelRequest({
                isOpen: !!selectedRecord,
                onClose: () => setSelectedRecord(null),
                data: selectedRecord,
                onUpdate: handleDetailUpdate,
                columns: columns,
                people: people,
                onEditAttribute: handleEditAttributeRaw
            })}
        </div>
    );
};

export default GenericObjectView;
