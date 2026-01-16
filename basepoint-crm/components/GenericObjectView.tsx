import React, { useState, useRef, useEffect } from 'react';
import ViewSettingsMenu from './ViewSettingsMenu';
import ViewSelector from './ViewSelector';
import CreateViewModal from './CreateViewModal';
import KanbanView from './KanbanView';
import { ColumnDefinition, Person, Company, SavedView, FilterRule, SortRule, FilterOperator } from '../types';
import ImportModal from './ImportModal';
import CreateAttributeModal from './CreateAttributeModal';
import AttributePicker from './AttributePicker';
import SearchableSelect from './SearchableSelect';
import RelationPicker from './RelationPicker';
import CompanyAvatar from './CompanyAvatar';
import TypeIcon from './TypeIcon';
import SortableHeader from './SortableHeader';
import DatePickerPopover from './DatePickerPopover';
import { downloadCSV } from '../utils/csvHelper';
import { sortData, SortConfig } from '../utils/sortHelper';
import { applyFilters } from '../utils/filterHelper';
import { fetchAttributes, createAttribute, updateAttribute, deleteAttribute, Attribute, fetchRecords, createRecord, updateRecord, deleteRecord } from '../utils/schemaApi';
import { attributeToColumn, pluralize } from '../utils/attributeHelpers';
import { getViewsForObject, saveView, updateView, deleteView as deleteViewFromStorage, generateViewId, toggleFavorite } from '../utils/viewsStorage';
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
    Filter,
    ArrowUpDown,
    Star,
    Trash2,
    X,
    Calendar,
    User,
    Link as LinkIcon,
    ExternalLink,
    Briefcase,
    Users,
    CheckSquare,
    Database as DatabaseIcon
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
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableFilterItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 text-xs group bg-white">
            <div {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
                <GripVertical size={12} />
            </div>
            {children}
        </div>
    );
};

// TypeIcon is now imported from shared component

interface GenericObjectViewProps {
    objectId: string;
    objectName: string; // e.g. "Company", "Person", "Invoice"
    slug?: string; // Table name / API slug
    data?: any[]; // Optional external data
    people?: Person[]; // For legacy relation support
    companies?: Company[]; // For relation sorting/filtering
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
        onToggleVisibility?: (colId: string) => void;
    }) => React.ReactNode;
    // Extension points
    columns?: ColumnDefinition[]; // Override default attribute-based columns
    renderCustomCell?: (record: any, column: ColumnDefinition) => React.ReactNode;
    // Favorites support
    initialViewId?: string; // View to select on mount (from sidebar navigation)
    onViewFavoriteChange?: () => void; // Callback when a view's favorite status changes
}

const GenericObjectView: React.FC<GenericObjectViewProps> = ({
    objectId,
    objectName,
    slug,
    data: externalData,
    people = [],
    companies = [],
    onAddRecord: externalAdd,
    onUpdateRecord: externalUpdate,
    onDeleteRecord: externalDelete,
    DetailPanelRequest,
    columns: externalColumns, // Destructure
    renderCustomCell, // Destructure
    initialViewId,
    onViewFavoriteChange
}) => {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [baseColumns, setBaseColumns] = useState<ColumnDefinition[]>(externalColumns || []);
    const [columns, setColumns] = useState<ColumnDefinition[]>(externalColumns || []);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false); // Default to false if we have columns

    // Internal data state if externalData is not provided
    const [internalData, setInternalData] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const data = externalData || internalData;

    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Saved Views State
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [currentView, setCurrentView] = useState<SavedView | null>(null);
    const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateAttributeOpen, setIsCreateAttributeOpen] = useState(false);

    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

    const [activeDragColumn, setActiveDragColumn] = useState<ColumnDefinition | null>(null);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>([{ key: 'name', direction: 'asc' }]);
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [filterSearchTerm, setFilterSearchTerm] = useState('');

    // Bulk Selection State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
    const [bulkActionMenu, setBulkActionMenu] = useState<string | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);


    const viewMenuRef = useRef<HTMLDivElement>(null);
    const addColumnRef = useRef<HTMLDivElement>(null);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const sortConfigRef = useRef<SortConfig>(sortConfig);
    const filtersRef = useRef<FilterRule[]>(filters);
    const persistedPreferencesRef = useRef<{ viewId: string; sort: string; filters: string }>({ viewId: '', sort: '', filters: '' });

    // Load attributes and data
    useEffect(() => {
        const load = async () => {
            setIsLoadingAttributes(true);
            try {
                // Always fetch attributes to support dynamic properties, even for standard views
                const attrs = await fetchAttributes(objectId);
                setAttributes(attrs);

                const mappedAttrs = attrs.map(attr => ({
                    ...attributeToColumn(attr),
                    visible: true
                }));
                if (!externalColumns) {
                    setBaseColumns(mappedAttrs);
                } else {
                    const customAttrs = mappedAttrs.filter(col => !col.isSystem);
                    setBaseColumns([...externalColumns, ...customAttrs]);
                }
            } catch (err) {
                console.error('Failed to load attributes', err);
                if (externalColumns) setBaseColumns(externalColumns);
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

    const applyViewColumns = (sourceCols: ColumnDefinition[], view: SavedView | null) => {
        if (!sourceCols || sourceCols.length === 0) return [];
        if (!view || !view.columns || view.columns.length === 0) {
            return sourceCols.map(col => ({ ...col }));
        }

        const viewMap = new Map(view.columns.map((col: any, index: number) => [col.id, { ...col, order: index }]));

        const sorted = [...sourceCols].sort((a, b) => {
            const orderA = viewMap.get(a.id)?.order ?? Number.MAX_SAFE_INTEGER;
            const orderB = viewMap.get(b.id)?.order ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

        return sorted.map(col => {
            const pref = viewMap.get(col.id);
            return {
                ...col,
                visible: pref?.visible ?? col.visible,
                width: pref?.width ?? col.width
            };
        });
    };

    useEffect(() => {
        if (baseColumns.length === 0) return;
        setColumns(applyViewColumns(baseColumns, currentView));
    }, [baseColumns, currentView]);

    // Load saved views
    useEffect(() => {
        const views = getViewsForObject(objectId);
        setSavedViews(views);

        // If initialViewId is provided, use that; otherwise use default or first view
        if (initialViewId) {
            const targetView = views.find(v => v.id === initialViewId);
            if (targetView) {
                setCurrentView(targetView);
                return;
            }
        }

        // Set current view to default or first view, or create a default table view
        const defaultView = views.find(v => v.isDefault) || views[0];
        if (defaultView) {
            setCurrentView(defaultView);
        }
    }, [objectId, initialViewId]);

    useEffect(() => {
        if (savedViews.length === 0 && columns.length > 0) {
            const defaultSort: SortRule[] = columns[0] ? [{ key: columns[0].id, direction: 'asc' }] : [];
            const defaultView: SavedView = {
                id: generateViewId(),
                name: `All ${pluralize(objectName)}`,
                objectId,
                type: 'table',
                columns,
                sort: defaultSort,
                filters: []
            };
            const stored = saveView(defaultView);
            setSavedViews([stored]);
            setCurrentView(stored);
        }
    }, [savedViews.length, columns, objectId, objectName]);

    useEffect(() => {
        if (!currentView) return;

        const serializedViewSort = JSON.stringify(currentView.sort || []);
        const serializedCurrentSort = JSON.stringify(sortConfigRef.current);
        if (serializedViewSort !== serializedCurrentSort) {
            setSortConfig(currentView.sort || []);
        }

        const serializedViewFilters = JSON.stringify(currentView.filters || []);
        const serializedCurrentFilters = JSON.stringify(filtersRef.current);
        if (serializedViewFilters !== serializedCurrentFilters) {
            setFilters(currentView.filters || []);
        }

        persistedPreferencesRef.current = {
            viewId: currentView.id,
            sort: serializedViewSort,
            filters: serializedViewFilters
        };
    }, [currentView]);

    // Auto-save logic removed. Now handling changes manually via UI.
    // We compare current state vs view state to determine "dirty" status.
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (!currentView) {
            setHasUnsavedChanges(false);
            return;
        }

        const serializedSort = JSON.stringify(sortConfig);
        const serializedFilters = JSON.stringify(filters);
        const storedSort = JSON.stringify(currentView.sort || []);
        const storedFilters = JSON.stringify(currentView.filters || []);

        const isDirty = serializedSort !== storedSort || serializedFilters !== storedFilters;
        setHasUnsavedChanges(isDirty);
    }, [sortConfig, filters, currentView]);

    const handleSaveChanges = () => {
        if (!currentView) return;
        const updated = updateView(currentView.id, { sort: sortConfig, filters });
        if (updated) {
            setSavedViews(prev => prev.map(v => v.id === updated.id ? updated : v));
            setCurrentView(updated);
            // hasUnsavedChanges will auto-update to false via useEffect
        }
    };

    const handleResetChanges = () => {
        if (!currentView) return;
        setSortConfig(currentView.sort || []);
        setFilters(currentView.filters || []);
    };

    useEffect(() => {
        if (columns.length === 0) return;

        setSortConfig(prev => {
            const validKeys = new Set(columns.map(col => col.id));
            const cleaned = prev.filter(rule => validKeys.has(rule.key));
            if (cleaned.length > 0) return cleaned;
            const fallbackColumn = columns.find(col => ['name', 'title'].includes(col.accessorKey)) || columns[0];
            return fallbackColumn ? [{ key: fallbackColumn.id, direction: 'asc' }] : prev;
        });

        setFilters(prev => prev.filter(rule => columns.some(col => col.id === rule.columnId)));
    }, [columns]);

    useEffect(() => {
        sortConfigRef.current = sortConfig;
    }, [sortConfig]);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    const filteredData = React.useMemo(() => {
        return applyFilters(data, filters, columns, { people, companies });
    }, [data, filters, columns, people, companies]);

    const sortedData = React.useMemo(() => {
        return sortData(filteredData, sortConfig, columns, { people, companies });
    }, [filteredData, sortConfig, columns, people, companies]);

    // DnD-Kit Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const persistColumnsToCurrentView = (cols: ColumnDefinition[]) => {
        if (!currentView) return;
        const columnPrefs = cols.map(col => ({ id: col.id, visible: col.visible, width: col.width }));
        const updated = updateView(currentView.id, { columns: columnPrefs });
        if (updated) {
            setSavedViews(prev => prev.map(v => v.id === updated.id ? updated : v));
            setCurrentView(updated);
        }
    };

    const applyColumnChanges = (updater: (prev: ColumnDefinition[]) => ColumnDefinition[]) => {
        setColumns(prev => {
            const next = updater(prev);
            persistColumnsToCurrentView(next);
            return next;
        });
    };

    // --- Drag and Drop (dnd-kit) ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const col = columns.find(c => c.id === active.id);
        if (col) setActiveDragColumn(col);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            applyColumnChanges((items) => {
                const oldIndex = items.findIndex((col) => col.id === active.id);
                const newIndex = items.findIndex((col) => col.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveDragColumn(null);
    };

    const handleFilterDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFilters((items) => {
                const oldIndex = items.findIndex((f) => f.id === active.id);
                const newIndex = items.findIndex((f) => f.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const widthTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

    const handleColumnResize = (columnId: string, newWidth: number) => {
        applyColumnChanges(prev => prev.map(col =>
            col.id === columnId ? { ...col, width: newWidth } : col
        ));

        // Persistence with debounce
        if (widthTimerRef.current[columnId]) {
            clearTimeout(widthTimerRef.current[columnId]);
        }

        widthTimerRef.current[columnId] = setTimeout(async () => {
            const attr = attributes.find(a => a.id === columnId);
            if (attr) {
                try {
                    const newConfig = { ...(attr.config || {}), width: newWidth };
                    await updateAttribute(columnId, { config: newConfig });
                    // Update local attribute ref to stay in sync
                    setAttributes(prev => prev.map(a => a.id === columnId ? { ...a, config: newConfig } : a));
                } catch (err) {
                    console.error('Failed to persist column width', err);
                }
            }
            delete widthTimerRef.current[columnId];
        }, 1000);
    };

    useEffect(() => {
        return () => {
            // Clean up timers on unmount
            Object.values(widthTimerRef.current).forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {

            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) setIsViewMenuOpen(false);
            if (addColumnRef.current && !addColumnRef.current.contains(event.target as Node)) setIsAddColumnOpen(false);
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) setActiveHeaderMenu(null);
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) setIsImportMenuOpen(false);
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setIsSortMenuOpen(false);
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) setIsFilterMenuOpen(false);
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
                setIsSortMenuOpen(false);
                setIsFilterMenuOpen(false);
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

    const handleBulkDeleteConfirmed = async () => {
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
        setShowDeleteConfirmation(false);
    };

    const handleBulkDelete = () => {
        setShowDeleteConfirmation(true);
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

    const addSortRule = () => {
        setSortConfig(prev => {
            if (columns.length === 0) return prev;
            const existingKeys = new Set(prev.map(rule => rule.key));
            const nextColumn = columns.find(col => !existingKeys.has(col.id));
            if (!nextColumn) return prev;
            return [...prev, { key: nextColumn.id, direction: 'asc' }];
        });
    };

    const updateSortRule = (index: number, updates: Partial<{ key: string; direction: 'asc' | 'desc' }>) => {
        setSortConfig(prev => prev.map((rule, idx) => (idx === index ? { ...rule, ...updates } : rule)));
    };

    const removeSortRule = (index: number) => {
        setSortConfig(prev => prev.filter((_, idx) => idx !== index));
    };

    const getFilterOperatorOptions = (column: ColumnDefinition) => {
        if (['number', 'currency', 'rating'].includes(column.type)) {
            return [
                { value: 'is', label: 'is' },
                { value: 'is_not', label: 'is not' },
                { value: 'gt', label: 'greater than' },
                { value: 'gte', label: 'at least' },
                { value: 'lt', label: 'less than' },
                { value: 'lte', label: 'at most' },
                { value: 'is_empty', label: 'is empty' },
                { value: 'is_not_empty', label: 'is not empty' }
            ];
        }

        if (['date', 'timestamp'].includes(column.type)) {
            return [
                { value: 'on', label: 'is' },
                { value: 'before', label: 'before' },
                { value: 'after', label: 'after' },
                { value: 'on_or_before', label: 'on or before' },
                { value: 'on_or_after', label: 'on or after' },
                { value: 'is_empty', label: 'is empty' },
                { value: 'is_not_empty', label: 'is not empty' }
            ];
        }

        if (column.type === 'multi-select') {
            return [
                { value: 'contains', label: 'contains' },
                { value: 'not_contains', label: 'does not contain' },
                { value: 'is_empty', label: 'is empty' },
                { value: 'is_not_empty', label: 'is not empty' }
            ];
        }

        if (column.type === 'select') {
            return [
                { value: 'is', label: 'is' },
                { value: 'is_not', label: 'is not' },
                { value: 'is_empty', label: 'is empty' },
                { value: 'is_not_empty', label: 'is not empty' }
            ];
        }

        if (column.type === 'checkbox') {
            return [
                { value: 'is', label: 'is' },
                { value: 'is_not', label: 'is not' },
                { value: 'is_empty', label: 'is empty' },
                { value: 'is_not_empty', label: 'is not empty' }
            ];
        }

        return [
            { value: 'contains', label: 'contains' },
            { value: 'not_contains', label: 'does not contain' },
            { value: 'is', label: 'is' },
            { value: 'is_not', label: 'is not' },
            { value: 'is_empty', label: 'is empty' },
            { value: 'is_not_empty', label: 'is not empty' }
        ];
    };

    const getDefaultOperator = (column: ColumnDefinition) => {
        if (['number', 'currency', 'rating'].includes(column.type)) return 'is';
        if (['date', 'timestamp'].includes(column.type)) return 'on';
        if (column.type === 'multi-select') return 'contains';
        if (column.type === 'checkbox') return 'is';
        if (column.type === 'select') return 'is';
        return 'contains';
    };

    const getDefaultFilterValue = (column: ColumnDefinition) => {
        if ((column.type === 'select' || column.type === 'multi-select') && column.options?.length) {
            return column.options[0].id;
        }
        if (column.type === 'checkbox') return true;
        return '';
    };

    const addFilterRule = (columnId: string) => {
        const column = columns.find(col => col.id === columnId);
        if (!column) return;

        const newRule: FilterRule = {
            id: Math.random().toString(36).slice(2, 9),
            columnId: column.id,
            operator: getDefaultOperator(column) as FilterRule['operator'],
            value: getDefaultFilterValue(column)
        };
        setFilters(prev => [...prev, newRule]);
        setFilterSearchTerm('');
    };

    const updateFilterRule = (id: string, updates: Partial<FilterRule>) => {
        setFilters(prev => prev.map(rule => (rule.id === id ? { ...rule, ...updates } : rule)));
    };

    const removeFilterRule = (id: string) => {
        setFilters(prev => prev.filter(rule => rule.id !== id));
    };

    const clearFilters = () => {
        setFilters([]);
    };

    const getRelationOptions = (column: ColumnDefinition) => {
        if (['linkedCompanyId', 'companyId'].includes(column.accessorKey) && companies.length > 0) {
            return companies.map(company => ({ id: company.name, label: company.name }));
        }
        if (['pointOfContactId', 'assignedTo', 'createdBy'].includes(column.accessorKey) && people.length > 0) {
            return people.map(person => ({ id: person.name, label: person.name }));
        }
        return [];
    };

    const isValueInputHidden = (operator: string) => {
        return operator === 'is_empty' || operator === 'is_not_empty';
    };

    const operatorLabelMap: Record<FilterOperator, string> = {
        contains: 'contains',
        not_contains: 'not containing',
        is: 'is',
        is_not: 'is not',
        is_empty: 'is empty',
        is_not_empty: 'is not empty',
        gt: '>',
        gte: '≥',
        lt: '<',
        lte: '≤',
        before: 'before',
        after: 'after',
        on: 'on',
        on_or_before: 'on/before',
        on_or_after: 'on/after'
    };

    const formatFilterValue = (rule: FilterRule, column: ColumnDefinition) => {
        if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') return '';
        if (rule.value === undefined || rule.value === null || rule.value === '') return '';

        if (column.type === 'checkbox') {
            return rule.value ? 'Yes' : 'No';
        }

        if (column.type === 'date' || column.type === 'timestamp') {
            const d = new Date(String(rule.value));
            return isNaN(d.getTime()) ? String(rule.value) : d.toLocaleDateString();
        }

        if ((column.type === 'select' || column.type === 'multi-select') && column.options) {
            const opt = column.options.find(o => o.id === rule.value);
            if (opt) return opt.label;
        }

        return String(rule.value);
    };

    const getFilterChipLabel = (rule: FilterRule) => {
        const column = columns.find(col => col.id === rule.columnId);
        if (!column) return 'Filter';
        const operatorLabel = operatorLabelMap[rule.operator] || rule.operator;
        const valueLabel = formatFilterValue(rule, column);
        return valueLabel ? `${column.label} ${operatorLabel} ${valueLabel}` : `${column.label} ${operatorLabel}`;
    };

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
            const mappedAttrs = attrs.map(attr => ({
                ...attributeToColumn(attr),
                visible: true
            }));
            if (!externalColumns) {
                setBaseColumns(mappedAttrs);
            } else {
                const customAttrs = mappedAttrs.filter(col => !col.isSystem);
                setBaseColumns([...externalColumns, ...customAttrs]);
            }
            setEditingAttribute(null);
        } catch (err) {
            console.error('Failed to save attribute', err);
        }
    };

    const handleToggleAttribute = (attrId: string) => {
        applyColumnChanges(prev => prev.map(c => c.id === attrId ? { ...c, visible: !c.visible } : c));
    };

    const handleEditAttributeRaw = (col: ColumnDefinition) => {
        // First try to find the attribute in the schema
        let attr = attributes.find(a => a.id === col.id);

        // If not found, create an Attribute object from the ColumnDefinition
        // This allows editing of system columns or columns not in the schema
        if (!attr) {
            attr = {
                id: col.id,
                objectId: objectId,
                name: col.label,
                type: col.type,
                config: {
                    options: col.options,
                },
                isSystem: col.isSystem || false,
                position: 0,
            };
        }

        setEditingAttribute(attr);
        setIsCreateAttributeOpen(true);
        setActiveHeaderMenu(null);
    };

    const handleEditAttributeFromPicker = (attr: Attribute) => {
        setEditingAttribute(attr);
        setIsCreateAttributeOpen(true);
        setIsAddColumnOpen(false);
    };

    const handleDeleteAttribute = async (column: ColumnDefinition) => {
        if (column.isSystem) return;

        if (!window.confirm(`Are you sure you want to delete the property "${column.label}"? This action cannot be undone and will delete all data associated with this property.`)) {
            return;
        }

        try {
            await deleteAttribute(column.id);

            // Reload attributes
            const attrs = await fetchAttributes(objectId);
            setAttributes(attrs);

            // Recompute columns
            const mappedAttrs = attrs.map(attr => ({
                ...attributeToColumn(attr),
                visible: true
            }));

            if (!externalColumns) {
                setBaseColumns(mappedAttrs);
            } else {
                const customAttrs = mappedAttrs.filter(col => !col.isSystem);
                // Filter out the deleted column from previous columns if it was there
                const updatedColumns = [...externalColumns, ...customAttrs].filter(c => c.id !== column.id);
                setBaseColumns(updatedColumns);
            }

            // Also remove from sort and filters if present
            setSortConfig(prev => prev.filter(s => s.key !== column.id));
            setFilters(prev => prev.filter(f => f.columnId !== column.id));

        } catch (err) {
            console.error('Failed to delete attribute', err);
            // Optionally show error toast
        }
    };

    const handleStartCreateAttribute = () => {
        setEditingAttribute(null);
        setIsCreateAttributeOpen(true);
        setIsAddColumnOpen(false);
    }

    // View Management
    const handleCreateView = (newView: SavedView) => {
        const savedNewView = saveView(newView);
        setSavedViews(prev => [...prev, savedNewView]);
        setCurrentView(savedNewView);
        setIsCreateViewModalOpen(false);
    };

    const handleDeleteView = (viewId: string) => {
        deleteViewFromStorage(viewId);
        setSavedViews(prev => prev.filter(v => v.id !== viewId));

        // If deleted current view, switch to another
        if (currentView?.id === viewId) {
            const remaining = savedViews.filter(v => v.id !== viewId);
            setCurrentView(remaining[0] || null);
        }
    };

    const handleRenameView = (viewId: string, newName: string) => {
        const updated = updateView(viewId, { name: newName });
        if (updated) {
            setSavedViews(prev => prev.map(v => v.id === viewId ? updated : v));
            if (currentView?.id === viewId) {
                setCurrentView(updated);
            }
        }
    };

    const handleViewChange = (view: SavedView) => {
        setCurrentView(view);
    };

    const handleToggleFavorite = (viewId: string) => {
        const updated = toggleFavorite(viewId);
        if (updated) {
            setSavedViews(prev => prev.map(v => v.id === viewId ? updated : v));
            if (currentView?.id === viewId) {
                setCurrentView(updated);
            }
            onViewFavoriteChange?.();
        }
    };

    const handleKanbanConfigChange = (newConfig: import('../types').KanbanConfig) => {
        if (!currentView) return;

        const updated = updateView(currentView.id, { kanbanConfig: newConfig });
        if (updated) {
            setSavedViews(prev => prev.map(v => v.id === updated.id ? updated : v));
            setCurrentView(updated);
        }
    };

    // Handle adding record with initial data (for Kanban column add)
    const handleAddWithInitialData = async (initialData?: Partial<any>) => {
        const newRecord: any = {
            createdAt: new Date().toISOString(),
            ...initialData
        };
        if (columns.find(c => c.accessorKey === 'name') && !initialData?.name) {
            newRecord.name = `New ${objectName}`;
        }

        if (externalAdd) {
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

    // Rendering
    const safeDateValue = (value: any) => {
        if (!value) return '';
        try {
            const d = new Date(value);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch (err) {
            return '';
        }
    };

    const personOptions = people.map(p => ({
        id: p.id,
        label: p.name,
        icon: <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{p.name.substring(0, 1).toUpperCase()}</div>
    }));

    const companyOptions = companies.map(c => ({
        id: c.id,
        label: c.name,
        icon: <CompanyAvatar name={c.name} size="xs" />
    }));

    const getRelationChoices = (column: ColumnDefinition) => {
        const key = column.accessorKey;
        if (['linkedCompanyId', 'companyId', 'record', 'company'].includes(key) || column.id === 'record') {
            return companyOptions;
        }
        if (['pointOfContactId', 'assignedTo', 'createdBy', 'assignee', 'poc'].includes(key) || column.id === 'assignee') {
            return personOptions;
        }
        // Fall back to people for one-to-many custom relations unless config specifies
        if ((column as any)?.config?.targetObjectId === 'obj_companies') {
            return companyOptions;
        }
        if ((column as any)?.config?.targetObjectId === 'obj_people') {
            return personOptions;
        }
        return [];
    };

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
            case 'link':
                const abbreviation = (col as any).config?.abbreviation || col.label.substring(0, 3).toUpperCase();
                const hasUrl = value && String(value).trim();
                if (hasUrl) {
                    const url = String(value).startsWith('http') ? value : `https://${value}`;
                    return (
                        <div className="w-full h-full px-2 flex items-center">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                title={`${col.label}: ${value}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {abbreviation}
                                <ExternalLink size={10} className="opacity-60" />
                            </a>
                        </div>
                    );
                }
                return (
                    <input
                        className="w-full h-full px-3 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-300"
                        value={value || ''}
                        onChange={(e) => handleUpdateField(record.id, col.accessorKey, e.target.value)}
                        placeholder="Add URL..."
                    />
                );
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
            case 'company':
            case 'person':
                // Determine target type and get appropriate options
                const targetType = (col as any)?.config?.targetObjectId;
                const isCompanyRelation =
                    col.accessorKey === 'companyId' ||
                    col.accessorKey === 'linkedCompanyId' ||
                    col.type === 'company' ||
                    targetType === 'obj_companies';
                const isPersonRelation =
                    col.id === 'attr_comp_poc' ||
                    col.accessorKey === 'pointOfContactId' ||
                    col.accessorKey === 'assignedTo' ||
                    col.type === 'person' ||
                    targetType === 'obj_people';

                // Handle Company relations
                if (isCompanyRelation) {
                    return (
                        <RelationPicker
                            value={value}
                            onChange={(newIds) => {
                                // For companyId field, store single value; otherwise array
                                if (col.accessorKey === 'companyId') {
                                    handleUpdateField(record.id, col.accessorKey, newIds[0] || null);
                                } else {
                                    handleUpdateField(record.id, col.accessorKey, newIds);
                                }
                            }}
                            options={companyOptions}
                            type="company"
                            placeholder="Select company..."
                            emptyMessage="Select as many as you like"
                        />
                    );
                }

                // Handle Person relations
                if (isPersonRelation) {
                    return (
                        <RelationPicker
                            value={value}
                            onChange={(newIds) => handleUpdateField(record.id, col.accessorKey, newIds)}
                            options={personOptions}
                            type="person"
                            placeholder="Select contact..."
                            emptyMessage="Select as many as you like"
                        />
                    );
                }

                // Fallback for other unrecognized relations
                return (
                    <SearchableSelect
                        value={value}
                        onChange={(val) => handleUpdateField(record.id, col.accessorKey, val)}
                        options={getRelationChoices(col)}
                        className="border-transparent bg-transparent"
                    />
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
    const primarySort = sortConfig[0];
    const primarySortLabel = primarySort ? columns.find(c => c.id === primarySort.key)?.label : undefined;
    const filterableColumns = columns;
    const filteredAttributes = filterableColumns.filter(col =>
        col.label.toLowerCase().includes(filterSearchTerm.toLowerCase())
    );

    const handleImportComplete = async (importedRecords: any[]) => {
        setIsImportModalOpen(false);

        // Add all imported records
        for (const record of importedRecords) {
            if (externalAdd) {
                externalAdd(record);
            } else if (slug) {
                try {
                    const created = await createRecord(slug, record);
                    setInternalData(prev => [created, ...prev]);
                } catch (err) {
                    console.error('Failed to create imported record', err);
                }
            }
        }
    };

    const entityTypeMap: Record<string, 'companies' | 'people' | 'tasks'> = {
        'Company': 'companies',
        'Person': 'people',
        'Task': 'tasks'
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
            {/* Delete Confirmation Dialog */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {selectedRecordIds.size} {selectedRecordIds.size === 1 ? 'record' : 'records'}?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This action cannot be undone. The selected {selectedRecordIds.size === 1 ? 'record' : 'records'} will be permanently deleted.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDeleteConfirmed}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onComplete={handleImportComplete}
                entityType={entityTypeMap[objectName] || 'companies'}
                existingFields={columns.map(c => c.accessorKey)}
            />
            <CreateAttributeModal
                isOpen={isCreateAttributeOpen}
                onClose={() => { setIsCreateAttributeOpen(false); setEditingAttribute(null); }}
                onSave={handleSaveAttribute}
                initialData={editingAttribute}
            />
            <CreateViewModal
                isOpen={isCreateViewModalOpen}
                onClose={() => setIsCreateViewModalOpen(false)}
                objectId={objectId}
                objectName={objectName}
                attributes={attributes}
                columns={columns}
                onCreateView={handleCreateView}
                onCreateAttribute={handleStartCreateAttribute}
            />

            {/* Header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 bg-white z-40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`${objectId === 'obj_companies' ? 'bg-blue-50 text-blue-500' :
                            objectId === 'obj_people' ? 'bg-sky-50 text-sky-500' :
                                objectId === 'obj_tasks' ? 'bg-emerald-50 text-emerald-500' :
                                    'bg-purple-50 text-purple-500'
                            } p-1.5 rounded-md`}>
                            {objectId === 'obj_companies' ? <Briefcase size={16} /> :
                                objectId === 'obj_people' ? <Users size={16} /> :
                                    objectId === 'obj_tasks' ? <CheckSquare size={16} /> :
                                        <DatabaseIcon size={16} />}
                        </div>
                        <span className="font-semibold text-gray-900">
                            {slug ? objectName : pluralize(objectName)}
                        </span>
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                    <ViewSelector
                        objectName={objectName}
                        currentView={currentView}
                        views={savedViews}
                        onViewChange={handleViewChange}
                        onCreateView={() => setIsCreateViewModalOpen(true)}
                        onDeleteView={handleDeleteView}
                        onRenameView={handleRenameView}
                        onToggleFavorite={handleToggleFavorite}
                    />
                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="w-px h-5 bg-gray-200 mx-2" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                                    Unsaved changes
                                </span>
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleResetChanges}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
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
            <div className="h-10 border-b border-gray-200 flex items-center px-4 gap-2 bg-white flex-shrink-0 z-30">
                {/* View Settings */}
                <ViewSettingsMenu
                    columns={columns}
                    setColumns={(updated) => applyColumnChanges(() => updated)}
                    viewType={currentView?.type || 'table'}
                    kanbanConfig={currentView?.kanbanConfig}
                    onKanbanConfigChange={handleKanbanConfigChange}
                />
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <div className="relative" ref={sortMenuRef}>
                    <button
                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${isSortMenuOpen ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowUpDown size={14} className="text-gray-400" />
                        <span>
                            Sorted by <strong>{primarySortLabel || 'Default'}</strong>
                            {primarySort && (primarySort.direction === 'asc' ? ' (Asc)' : ' (Desc)')}
                        </span>
                        {sortConfig.length > 1 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded-full">
                                +{sortConfig.length - 1}
                            </span>
                        )}
                        <ChevronDown size={12} className="text-gray-400" />
                    </button>

                    {isSortMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[360px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="text-sm font-semibold text-gray-900">Sort</div>
                                <div className="text-xs text-gray-500">Stack multiple sorts to break ties.</div>
                            </div>
                            <div className="p-3 space-y-2">
                                {sortConfig.length === 0 && (
                                    <div className="text-xs text-gray-500">No sorts applied yet.</div>
                                )}
                                {sortConfig.map((rule, index) => (
                                    <div key={`${rule.key}-${index}`} className="flex items-center gap-2">
                                        <select
                                            className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                                            value={rule.key}
                                            onChange={(e) => updateSortRule(index, { key: e.target.value })}
                                        >
                                            {columns.map(col => (
                                                <option key={col.id} value={col.id}>{col.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                                            value={rule.direction}
                                            onChange={(e) => updateSortRule(index, { direction: e.target.value as 'asc' | 'desc' })}
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                        <button
                                            onClick={() => removeSortRule(index)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                                            title="Remove sort"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addSortRule}
                                    className="w-full mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md py-1.5 transition-colors"
                                >
                                    + Add sort
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={filterMenuRef}>
                    <button
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${isFilterMenuOpen ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter size={14} className="text-gray-400" />
                        <span>Filter</span>
                        {filters.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">
                                {filters.length}
                            </span>
                        )}
                        <ChevronDown size={12} className="text-gray-400" />
                    </button>

                    {isFilterMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[360px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[520px]">
                            <div className="p-3 border-b border-gray-100">
                                <input
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-500 outline-none"
                                    placeholder="Search attributes..."
                                    value={filterSearchTerm}
                                    onChange={(e) => setFilterSearchTerm(e.target.value)}
                                />
                            </div>

                            {filters.length > 0 && (
                                <div className="border-b border-gray-100 px-3 py-2 space-y-2">
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active filters</div>
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleFilterDragEnd}
                                    >
                                        <SortableContext
                                            items={filters.map(f => f.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {filters.map(rule => {
                                                const column = columns.find(col => col.id === rule.columnId);
                                                if (!column) return null;
                                                const operatorOptions = getFilterOperatorOptions(column);
                                                const relationOptions = column.type === 'relation' || column.type === 'company' || column.type === 'person'
                                                    ? getRelationOptions(column)
                                                    : [];
                                                const selectOptions = column.options?.map(opt => ({ id: opt.id, label: opt.label })) || [];
                                                const dropdownOptions = column.type === 'select' || column.type === 'multi-select'
                                                    ? selectOptions
                                                    : relationOptions;
                                                const showValueInput = !isValueInputHidden(rule.operator);

                                                return (
                                                    <SortableFilterItem key={rule.id} id={rule.id}>
                                                        <div className="flex items-center gap-1 min-w-[110px] max-w-[110px] text-gray-600">
                                                            <TypeIcon type={column.type} />
                                                            <span className="truncate">{column.label}</span>
                                                        </div>
                                                        <select
                                                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                                                            value={rule.operator}
                                                            onChange={(e) => updateFilterRule(rule.id, { operator: e.target.value as FilterRule['operator'] })}
                                                        >
                                                            {operatorOptions.map(option => (
                                                                <option key={option.value} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                        {showValueInput && (
                                                            <div className="flex-1 min-w-0">
                                                                {column.type === 'checkbox' ? (
                                                                    <select
                                                                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
                                                                        value={String(rule.value)}
                                                                        onChange={(e) => updateFilterRule(rule.id, { value: e.target.value === 'true' })}
                                                                    >
                                                                        <option value="true">Checked</option>
                                                                        <option value="false">Unchecked</option>
                                                                    </select>
                                                                ) : column.type === 'date' || column.type === 'timestamp' ? (
                                                                    <input
                                                                        type="date"
                                                                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
                                                                        value={typeof rule.value === 'string' ? rule.value : ''}
                                                                        onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                                    />
                                                                ) : ['number', 'currency', 'rating'].includes(column.type) ? (
                                                                    <input
                                                                        type="number"
                                                                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
                                                                        value={rule.value ?? ''}
                                                                        onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                                    />
                                                                ) : dropdownOptions.length > 0 ? (
                                                                    <select
                                                                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
                                                                        value={String(rule.value ?? '')}
                                                                        onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {dropdownOptions.map(opt => (
                                                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white w-full"
                                                                        value={typeof rule.value === 'string' ? rule.value : ''}
                                                                        onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => removeFilterRule(rule.id)}
                                                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </SortableFilterItem>
                                                );
                                            })}
                                        </SortableContext>
                                    </DndContext>
                                    <button
                                        onClick={clearFilters}
                                        className="text-[11px] text-gray-500 hover:text-gray-700"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto py-1">
                                {filteredAttributes.map(col => (
                                    <button
                                        key={col.id}
                                        onClick={() => addFilterRule(col.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <TypeIcon type={col.type} />
                                        <span className="truncate text-xs">{col.label}</span>
                                    </button>
                                ))}
                                {filteredAttributes.length === 0 && (
                                    <div className="px-3 py-6 text-xs text-gray-500">No attributes match your search.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {(sortConfig.length > 0 || filters.length > 0) && (
                    <div className="flex items-center gap-1 flex-wrap ml-2">
                        {sortConfig.map((rule, index) => {
                            const column = columns.find(col => col.id === rule.key);
                            if (!column) return null;
                            return (
                                <div
                                    key={`sort-chip-${rule.key}-${index}`}
                                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-gray-100 border border-gray-200 rounded-full text-gray-700"
                                >
                                    <ArrowUpDown size={11} className="text-gray-400" />
                                    <span>{column.label} {rule.direction === 'asc' ? '↑' : '↓'}</span>
                                    <button
                                        onClick={() => removeSortRule(index)}
                                        className="p-0.5 text-gray-400 hover:text-gray-600"
                                        title="Remove sort"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            );
                        })}
                        {filters.map(rule => (
                            <div
                                key={`filter-chip-${rule.id}`}
                                className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-blue-50 border border-blue-100 rounded-full text-blue-700"
                            >
                                <Filter size={11} className="text-blue-400" />
                                <span className="truncate max-w-[200px]">{getFilterChipLabel(rule)}</span>
                                <button
                                    onClick={() => removeFilterRule(rule.id)}
                                    className="p-0.5 text-blue-400 hover:text-blue-600"
                                    title="Remove filter"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Kanban View */}
            {currentView?.type === 'kanban' && currentView.kanbanConfig ? (
                <KanbanView
                    data={sortedData}
                    columns={columns}
                    kanbanConfig={currentView.kanbanConfig}
                    people={people}
                    companies={companies}
                    onUpdateRecord={(record) => handleDetailUpdate(record)}
                    onAddRecord={handleAddWithInitialData}
                    onRecordClick={(record) => setSelectedRecord(record)}
                    selectedIds={selectedRecordIds}
                    onSelectionChange={setSelectedRecordIds}
                    isBulkMode={isBulkMode}
                />
            ) : (
                /* Table */
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
                                                    onDeleteAttribute={handleDeleteAttribute}
                                                    onResize={handleColumnResize}
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
                                    <th className="w-[120px] py-2.5 px-3 border-b border-gray-200 text-left bg-white relative" ref={addColumnRef}>
                                        <div
                                            onClick={() => setIsAddColumnOpen(!isAddColumnOpen)}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer relative"
                                        >
                                            <Plus size={12} /> Add column
                                            {isAddColumnOpen && (
                                                <div className="absolute top-full right-0 mt-2 z-50">
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
                                    </th>
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
                                                ) : col.accessorKey === 'title' ? (
                                                    <div
                                                        className="flex items-center px-3 py-2 h-full cursor-pointer hover:bg-gray-100"
                                                        onClick={() => setSelectedRecord(record)}
                                                    >
                                                        <span className={`font-medium truncate w-full ${record.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`} dangerouslySetInnerHTML={{ __html: record.title }} />
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
            )}

            {/* Bulk Actions Toolbar */}
            {isBulkMode && (() => {
                // Identify column types for quick actions
                const dateColumns = visibleColumns.filter(col => !col.readonly && (col.type === 'date' || col.type === 'timestamp'));
                const relationColumns = visibleColumns.filter(col => !col.readonly && col.type === 'relation');
                const singleSelectColumns = visibleColumns.filter(col => !col.readonly && (col.type === 'select' || col.type === 'status'));
                const multiSelectColumns = visibleColumns.filter(col => !col.readonly && col.type === 'multi-select');
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
                                            options={getRelationChoices(relationColumns[0])}
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
                                    {singleSelectColumns.map(col => (
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

                                    {/* Multi-select Columns */}
                                    {multiSelectColumns.map(col => (
                                        <div key={col.id} className="px-3 py-2 border-b border-gray-50">
                                            <div className="text-xs font-medium text-gray-600 mb-1.5">{col.label}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {(col.options || []).map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleBulkUpdate(col.accessorKey, [opt.id])}
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
                onEditAttribute: handleEditAttributeRaw,
                onAddProperty: () => setIsCreateAttributeOpen(true),
                onToggleVisibility: handleToggleAttribute
            })}
        </div>
    );
};

export default GenericObjectView;
