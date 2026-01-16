import React, { useRef, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ArrowUp, ArrowDown, Edit2, EyeOff, Trash2 } from 'lucide-react';
import { ColumnDefinition } from '../types';
import { SortConfig } from '../utils/sortHelper';
import TypeIcon from './TypeIcon';

interface SortableHeaderProps {
    column: ColumnDefinition;
    activeHeaderMenu: string | null;
    setActiveHeaderMenu: (id: string | null) => void;
    setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>;
    onEditAttribute?: (col: ColumnDefinition) => void;
    onHideColumn: (id: string) => void;
    onDeleteAttribute?: (col: ColumnDefinition) => void;
    onResize?: (id: string, width: number) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    column,
    activeHeaderMenu,
    setActiveHeaderMenu,
    setSortConfig,
    onEditAttribute,
    onHideColumn,
    onDeleteAttribute,
    onResize
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: column.id,
        disabled: isResizing
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        width: column.width || 150,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
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
        // Only toggle menu if click is not on a dragging action or resizing
        if (!isDragging && !isResizing) {
            setActiveHeaderMenu(activeHeaderMenu === column.id ? null : column.id);
        }
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        // Crucial: Stop propagation to prevent useSortable from capturing the mousedown
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        startXRef.current = e.pageX;
        startWidthRef.current = column.width || 150;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.pageX - startXRef.current;
            const newWidth = Math.max(60, startWidthRef.current + delta);
            if (onResize) {
                onResize(column.id, newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`py-2.5 px-3 text-left border-b border-gray-200 text-xs font-medium text-gray-500 border-r border-gray-100 group bg-white transition-colors touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:bg-gray-50'}`}
            {...attributes}
            {...listeners}
            onClick={handleHeaderClick}
        >
            <div className="flex items-center gap-1.5 relative h-full">
                <TypeIcon type={column.type} />
                <span className="truncate" title={column.label}>
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
                                onClick={() => { setSortConfig([{ key: column.id, direction: 'asc' }]); setActiveHeaderMenu(null); }}
                            >
                                <ArrowUp size={14} className="text-gray-400" /> Sort ascending
                            </div>
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                                onClick={() => { setSortConfig([{ key: column.id, direction: 'desc' }]); setActiveHeaderMenu(null); }}
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

                            {onDeleteAttribute && !column.isSystem && (
                                <div
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 text-red-600 rounded text-sm cursor-pointer"
                                    onClick={() => { onDeleteAttribute(column); setActiveHeaderMenu(null); }}
                                >
                                    <Trash2 size={14} /> Delete property
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group-hover:bg-blue-400/30 transition-colors z-20"
                onMouseDown={handleResizeStart}
                onClick={(e) => e.stopPropagation()}
            />
        </th>
    );
};

export default SortableHeader;
