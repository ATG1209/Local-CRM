import React, { useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ArrowUp, ArrowDown, Edit2, EyeOff } from 'lucide-react';
import { ColumnDefinition } from '../types';
import { SortConfig } from '../utils/sortHelper';
import TypeIcon from './TypeIcon';

interface SortableHeaderProps {
    column: ColumnDefinition;
    activeHeaderMenu: string | null;
    setActiveHeaderMenu: (id: string | null) => void;
    setSortConfig: (config: SortConfig | null) => void;
    onEditAttribute?: (col: ColumnDefinition) => void;
    onHideColumn: (id: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    column,
    activeHeaderMenu,
    setActiveHeaderMenu,
    setSortConfig,
    onEditAttribute,
    onHideColumn
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: column.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        width: column.width,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (activeHeaderMenu !== column.id) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveHeaderMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeHeaderMenu, column.id, setActiveHeaderMenu]);

    const handleHeaderClick = (e: React.MouseEvent) => {
        // Only toggle menu if click is not on a dragging action
        if (!isDragging) {
            setActiveHeaderMenu(activeHeaderMenu === column.id ? null : column.id);
        }
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`py-2.5 px-3 text-left border-b border-gray-200 text-xs font-medium text-gray-500 border-r border-gray-100 group bg-white transition-colors cursor-pointer hover:bg-gray-50 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
            {...attributes}
            {...listeners}
            onClick={handleHeaderClick}
        >
            <div className="flex items-center gap-1.5 relative">
                <TypeIcon type={column.type} />
                <span className="truncate max-w-[150px]" title={column.label}>
                    {column.label}
                </span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <ChevronDown size={12} />
                </div>

                {/* Header Menu */}
                {activeHeaderMenu === column.id && (
                    <div
                        ref={menuRef}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100 py-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 py-1 space-y-0.5">
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                                onClick={() => { setSortConfig({ key: column.id, direction: 'asc' }); setActiveHeaderMenu(null); }}
                            >
                                <ArrowUp size={14} className="text-gray-400" /> Sort ascending
                            </div>
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                                onClick={() => { setSortConfig({ key: column.id, direction: 'desc' }); setActiveHeaderMenu(null); }}
                            >
                                <ArrowDown size={14} className="text-gray-400" /> Sort descending
                            </div>
                        </div>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <div className="px-2 py-1 space-y-0.5">
                            {onEditAttribute && (
                                <div
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                                    onClick={() => { onEditAttribute(column); setActiveHeaderMenu(null); }}
                                >
                                    <Edit2 size={14} className="text-gray-400" /> Edit Attribute
                                </div>
                            )}
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                                onClick={() => { onHideColumn(column.id); setActiveHeaderMenu(null); }}
                            >
                                <EyeOff size={14} className="text-gray-400" /> Hide from view
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </th>
    );
};

export default SortableHeader;
