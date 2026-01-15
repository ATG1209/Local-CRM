import React, { useState, useRef, useEffect } from 'react';
import { LayoutList, ChevronDown, GripVertical, EyeOff, Check } from 'lucide-react';
import { ColumnDefinition } from '../types';
import TypeIcon from './TypeIcon';

interface ViewSettingsMenuProps {
    columns: ColumnDefinition[];
    setColumns: (columns: ColumnDefinition[]) => void;
    onColumnsChange?: (columns: ColumnDefinition[]) => void;
}

const ViewSettingsMenu: React.FC<ViewSettingsMenuProps> = ({
    columns,
    setColumns,
    onColumnsChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleColumn = (colId: string) => {
        const newCols = columns.map(c => c.id === colId ? { ...c, visible: !c.visible } : c);
        setColumns(newCols);
        if (onColumnsChange) onColumnsChange(newCols);
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
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[500px]">
                    <div className="py-5 px-4 border-b border-gray-100 flex items-center justify-center">
                        <p className="text-xs text-gray-600">Customize columns. Drag to reorder.</p>
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
                </div>
            )}
        </div>
    );
};

export default ViewSettingsMenu;
