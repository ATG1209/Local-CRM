import React, { useState, useRef, useEffect } from 'react';
import { LayoutList, Columns3, ChevronDown, GripVertical, EyeOff, Check, CreditCard } from 'lucide-react';
import { ColumnDefinition, KanbanConfig } from '../types';
import TypeIcon from './TypeIcon';

interface ViewSettingsMenuProps {
    columns: ColumnDefinition[];
    setColumns: (columns: ColumnDefinition[]) => void;
    onColumnsChange?: (columns: ColumnDefinition[]) => void;
    // Kanban-specific props
    viewType?: 'table' | 'kanban';
    kanbanConfig?: KanbanConfig;
    onKanbanConfigChange?: (config: KanbanConfig) => void;
}

const ViewSettingsMenu: React.FC<ViewSettingsMenuProps> = ({
    columns,
    setColumns,
    onColumnsChange,
    viewType = 'table',
    kanbanConfig,
    onKanbanConfigChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'columns' | 'card'>('columns');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const toggleColumn = (colId: string) => {
        const newCols = columns.map(c => c.id === colId ? { ...c, visible: !c.visible } : c);
        setColumns(newCols);
        if (onColumnsChange) onColumnsChange(newCols);
    };

    const toggleCardField = (colId: string) => {
        if (!kanbanConfig || !onKanbanConfigChange) return;

        const currentFields = kanbanConfig.cardFields || [];
        const newFields = currentFields.includes(colId)
            ? currentFields.filter(f => f !== colId)
            : [...currentFields, colId];

        onKanbanConfigChange({
            ...kanbanConfig,
            cardFields: newFields
        });
    };

    // Native drag handlers
    const handleDragStart = (index: number) => setDraggedColumnIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (index: number) => {
        if (draggedColumnIndex === null) return;
        const newColumns = [...columns];
        const [draggedColumn] = newColumns.splice(draggedColumnIndex, 1);
        newColumns.splice(index, 0, draggedColumn);
        setColumns(newColumns);
        if (onColumnsChange) onColumnsChange(newColumns);
        setDraggedColumnIndex(null);
    };

    // Get columns suitable for card display (exclude the groupBy column)
    const cardDisplayColumns = columns.filter(col =>
        col.id !== kanbanConfig?.groupByAttributeId && col.id !== 'name'
    );

    const isKanban = viewType === 'kanban';

    return (
        <div className="relative" ref={menuRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${isOpen ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
                <LayoutList size={14} className="text-gray-500" />
                <span>View settings</span>
                <ChevronDown size={12} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[500px]">
                    {/* Tabs for Kanban view */}
                    {isKanban && kanbanConfig && onKanbanConfigChange && (
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('columns')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === 'columns'
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Columns3 size={14} />
                                Columns
                            </button>
                            <button
                                onClick={() => setActiveTab('card')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === 'card'
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <CreditCard size={14} />
                                Card Fields
                            </button>
                        </div>
                    )}

                    {/* Header for table view or columns tab */}
                    {(!isKanban || activeTab === 'columns') && (
                        <>
                            <div className="h-12 px-4 border-b border-gray-100 bg-gray-50 flex items-center justify-center rounded-t-lg">
                                <span className="text-xs text-gray-600 font-medium select-none">
                                    Customize columns. Drag to reorder.
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-1">
                                {columns.map((col, index) => (
                                    <div
                                        key={col.id}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded group cursor-move"
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={() => handleDrop(index)}
                                    >
                                        <GripVertical size={12} className="text-gray-300 cursor-grab" />
                                        <div className="flex-1 flex items-center gap-2 text-sm text-gray-700">
                                            <TypeIcon type={col.type} />
                                            <span className={col.visible ? '' : 'text-gray-400 line-through decoration-gray-300'}>{col.label}</span>
                                        </div>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleColumn(col.id); }}
                                            className="p-1 rounded hover:bg-gray-200 cursor-pointer text-gray-400 hover:text-gray-600"
                                        >
                                            {col.visible ? <EyeOff size={12} /> : <Check size={12} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Card Fields tab for Kanban */}
                    {isKanban && activeTab === 'card' && kanbanConfig && onKanbanConfigChange && (
                        <>
                            <div className="h-12 px-4 border-b border-gray-100 bg-gray-50 flex items-center justify-center">
                                <span className="text-xs text-gray-600 font-medium select-none">
                                    Select fields to show on cards
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-1">
                                {cardDisplayColumns.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                                        No additional fields available
                                    </div>
                                ) : (
                                    cardDisplayColumns.map((col) => {
                                        const isSelected = kanbanConfig.cardFields?.includes(col.id) ?? false;
                                        return (
                                            <div
                                                key={col.id}
                                                onClick={() => toggleCardField(col.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${isSelected
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-gray-300'
                                                    }`}>
                                                    {isSelected && (
                                                        <Check size={10} className="text-white" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <TypeIcon type={col.type} />
                                                    <span className="text-sm">{col.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
                                <p className="text-[10px] text-gray-400">
                                    {kanbanConfig.cardFields?.length || 0} field{(kanbanConfig.cardFields?.length || 0) !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewSettingsMenu;
