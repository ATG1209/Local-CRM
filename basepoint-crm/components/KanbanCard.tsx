import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnDefinition, Person, Company } from '../types';
import CompanyAvatar from './CompanyAvatar';
import { Calendar, User, Building2, Mail, Phone, Link as LinkIcon, DollarSign, Star, CheckSquare, Square } from 'lucide-react';

interface KanbanCardProps {
  record: any;
  columns: ColumnDefinition[];
  cardFields?: string[]; // Which fields to display (if undefined, show default set)
  isSelected: boolean;
  isBulkMode: boolean;
  onClick: () => void;
  onSelect: () => void;
  people?: Person[];
  companies?: Company[];
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  record,
  columns,
  cardFields,
  isSelected,
  isBulkMode,
  onClick,
  onSelect,
  people = [],
  companies = []
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Get the title field (first text field or 'name')
  const titleColumn = columns.find(col => col.id === 'name' || col.accessorKey === 'name') ||
    columns.find(col => col.type === 'text' && col.visible);
  const title = titleColumn ? getNestedValue(record, titleColumn.accessorKey) : record.name || record.id;

  // Get fields to display
  const displayColumns = cardFields
    ? columns.filter(col => cardFields.includes(col.id) && col.id !== titleColumn?.id)
    : columns.filter(col => col.visible && col.id !== titleColumn?.id).slice(0, 4);

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  const renderFieldValue = (column: ColumnDefinition, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-300">-</span>;
    }

    switch (column.type) {
      case 'date':
      case 'timestamp':
        const date = new Date(value);
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={10} />
            {date.toLocaleDateString()}
          </span>
        );

      case 'currency':
        const num = typeof value === 'number' ? value : parseFloat(value);
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <DollarSign size={10} />
            {num.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );

      case 'number':
        return <span className="text-xs text-gray-600">{value}</span>;

      case 'rating':
        return (
          <span className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
              />
            ))}
          </span>
        );

      case 'checkbox':
        return value ? (
          <span className="text-green-600 text-xs flex items-center gap-1">
            <CheckSquare size={12} /> Yes
          </span>
        ) : (
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <Square size={12} /> No
          </span>
        );

      case 'select':
      case 'status':
        const option = column.options?.find(o => o.id === value || o.label === value);
        if (option) {
          return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${option.color || 'bg-gray-100 text-gray-600'}`}>
              {option.label}
            </span>
          );
        }
        return <span className="text-xs text-gray-500">{value}</span>;

      case 'multi-select':
        const values = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {values.slice(0, 3).map((v, i) => {
              const opt = column.options?.find(o => o.id === v || o.label === v);
              return (
                <span
                  key={i}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${opt?.color || 'bg-gray-100 text-gray-600'}`}
                >
                  {opt?.label || v}
                </span>
              );
            })}
            {values.length > 3 && (
              <span className="text-[10px] text-gray-400">+{values.length - 3}</span>
            )}
          </div>
        );

      case 'person':
        const person = people.find(p => p.id === value);
        if (person) {
          return (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              {person.avatar ? (
                <img src={person.avatar} className="w-4 h-4 rounded-full" alt="" />
              ) : (
                <User size={12} className="text-gray-400" />
              )}
              {person.name}
            </span>
          );
        }
        return <span className="text-xs text-gray-400">{value}</span>;

      case 'company':
      case 'relation':
        const company = companies.find(c => c.id === value);
        if (company) {
          return (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <CompanyAvatar name={company.name} size="xs" />
              {company.name}
            </span>
          );
        }
        return <span className="text-xs text-gray-400">{value}</span>;

      case 'email':
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
            <Mail size={10} />
            {value}
          </span>
        );

      case 'phone':
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Phone size={10} />
            {value}
          </span>
        );

      case 'url':
        return (
          <span className="flex items-center gap-1 text-xs text-blue-500 truncate">
            <LinkIcon size={10} />
            {value.replace(/^https?:\/\//, '').slice(0, 20)}
          </span>
        );

      default:
        return <span className="text-xs text-gray-600 line-clamp-1">{String(value)}</span>;
    }
  };

  // Handle click - only trigger onClick if not dragging
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we were dragging
    if (isDragging) return;
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing relative ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
      } ${isDragging ? 'shadow-lg opacity-90 rotate-2 scale-105' : ''}`}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {isBulkMode && (
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 hover:border-blue-400'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Card Header - Title */}
      <div className="flex items-start gap-2 mb-2">
        <CompanyAvatar name={title || 'Record'} size="xs" />
        <span className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">{title || 'Untitled'}</span>
      </div>

      {/* Card Fields */}
      {displayColumns.length > 0 && (
        <div className="space-y-1.5">
          {displayColumns.map(column => {
            const value = getNestedValue(record, column.accessorKey);
            return (
              <div key={column.id} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide w-16 flex-shrink-0 truncate">
                  {column.label}
                </span>
                {renderFieldValue(column, value)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
