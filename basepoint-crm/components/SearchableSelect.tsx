
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  dropdownPosition?: 'top' | 'bottom';
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  dropdownPosition = 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.id === value);
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
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {isOpen ? (
        <div
          className={`absolute ${dropdownPosition === 'top' ? 'bottom-0' : 'top-0'} left-0 z-[100] min-w-[260px] w-full bg-white rounded-lg shadow-xl border border-blue-500 ring-4 ring-blue-500/10 flex flex-col overflow-hidden`}
          style={{
            [dropdownPosition === 'top' ? 'marginBottom' : 'marginTop']: '-4px',
            marginLeft: '-4px',
            width: 'calc(100% + 8px)'
          }}
        >
          <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <Search size={14} className="text-blue-500 mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="cursor-pointer hover:bg-gray-200 p-0.5 rounded text-gray-400"
            >
              <X size={14} />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5 bg-white">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center gap-2.5 px-2 py-2 text-sm rounded-md cursor-pointer transition-colors ${option.id === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex-shrink-0 text-gray-500">
                    {option.icon}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">{option.label}</span>
                    {option.subLabel && <span className="text-[10px] text-gray-500 truncate">{option.subLabel}</span>}
                  </div>
                  {option.id === value && <Check size={14} className="ml-auto text-blue-600 flex-shrink-0" />}
                </div>
              ))
            ) : (
              <div className="px-2 py-4 text-xs text-gray-400 text-center italic">No results found</div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-between pr-2 cursor-pointer hover:bg-gray-50 group min-h-[28px]"
          onClick={() => setIsOpen(true)}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex-shrink-0 opacity-70">
                {selectedOption.icon}
              </div>
              <span className="text-sm text-gray-900 truncate font-medium">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 truncate">{placeholder}</span>
          )}
          <ChevronDown size={12} className="text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
