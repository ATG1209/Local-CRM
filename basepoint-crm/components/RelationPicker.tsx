import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Users } from 'lucide-react';
import CompanyAvatar from './CompanyAvatar';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
    icon?: React.ReactNode;
}

interface RelationPickerProps {
    value: string | string[] | null | undefined;
    onChange: (value: string[]) => void;
    onItemClick?: (id: string) => void;
    options: Option[];
    placeholder?: string;
    emptyMessage?: string;
    type?: 'person' | 'company';
    className?: string;
}

const RelationPicker: React.FC<RelationPickerProps> = ({
    value,
    onChange,
    onItemClick,
    options,
    placeholder = "Select...",
    emptyMessage = "Select as many as you like",
    type = 'person',
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
    const selectedOptions = options.filter(o => selectedIds.includes(o.id));

    const filteredOptions = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(false);
                setSearch("");
            }
        };

        if (isOpen) {
            // Add global listener when open to catch escapes anywhere
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleToggle = (optionId: string) => {
        if (selectedIds.includes(optionId)) {
            onChange(selectedIds.filter(id => id !== optionId));
        } else {
            onChange([...selectedIds, optionId]);
        }
    };

    const handleRemove = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(id => id !== optionId));
    };

    const handleItemClick = (optionId: string, e: React.MouseEvent) => {
        if (onItemClick) {
            e.stopPropagation();
            onItemClick(optionId);
        } else {
            setIsOpen(true);
        }
    };

    const renderAvatar = (option: Option) => {
        if (option.icon) return <div className="flex-shrink-0">{option.icon}</div>;
        if (type === 'company') {
            return <CompanyAvatar name={option.label} size="xs" />;
        }
        return (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {option.label.substring(0, 1).toUpperCase()}
            </div>
        );
    };

    return (
        <div className={`relative w-full h-full ${className}`} ref={containerRef}>
            {/* Trigger - shows chips or placeholder */}
            <div
                className="w-full h-full flex items-center gap-1 overflow-hidden cursor-pointer hover:bg-gray-50"
                onClick={() => setIsOpen(true)}
            >
                {selectedOptions.length > 0 ? (
                    selectedOptions.map(opt => (
                        <div
                            key={opt.id}
                            className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700 ${onItemClick ? 'hover:bg-gray-200 hover:text-blue-700 transition-colors' : ''}`}
                            onClick={(e) => handleItemClick(opt.id, e)}
                        >
                            {renderAvatar(opt)}
                            <span className="truncate max-w-[60px]">{opt.label}</span>
                        </div>
                    ))
                ) : (
                    <span className="text-sm text-gray-400">{placeholder}</span>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-0 left-0 z-[100] min-w-[280px] w-full bg-white rounded-lg shadow-xl border border-blue-500 ring-4 ring-blue-500/10 flex flex-col max-h-[360px] overflow-hidden">
                    {/* Selected items with remove buttons */}
                    {selectedOptions.length > 0 && (
                        <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
                            {selectedOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 group"
                                >
                                    {renderAvatar(opt)}
                                    <span className="truncate max-w-[100px]">{opt.label}</span>
                                    <button
                                        onClick={(e) => handleRemove(opt.id, e)}
                                        className="ml-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setSearch(""); }}
                            className="cursor-pointer hover:bg-gray-200 p-0.5 rounded text-gray-400"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Hint */}
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-50">
                        {emptyMessage}
                    </div>

                    {/* Options list */}
                    <div className="flex-1 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = selectedIds.includes(option.id);
                                return (
                                    <div
                                        key={option.id}
                                        className={`flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                        onClick={() => handleToggle(option.id)}
                                    >
                                        {renderAvatar(option)}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-medium truncate">{option.label}</span>
                                            {option.subLabel && <span className="text-[10px] text-gray-500 truncate">{option.subLabel}</span>}
                                        </div>
                                        {isSelected && <Check size={14} className="ml-auto text-blue-600 flex-shrink-0" />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-2 py-4 text-xs text-gray-400 text-center italic">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelationPicker;
