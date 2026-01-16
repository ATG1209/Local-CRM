import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  rectIntersection
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { ColumnDefinition, KanbanConfig, Person, Company, AttributeOption } from '../types';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';

interface KanbanViewProps {
  data: any[];
  columns: ColumnDefinition[];
  kanbanConfig: KanbanConfig;
  people?: Person[];
  companies?: Company[];
  onUpdateRecord: (record: any) => void;
  onAddRecord?: (initialData?: Partial<any>) => void;
  onRecordClick: (record: any) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  isBulkMode: boolean;
}

interface KanbanColumnProps {
  columnId: string;
  title: string;
  color: string;
  records: any[];
  columns: ColumnDefinition[];
  kanbanConfig: KanbanConfig;
  people?: Person[];
  companies?: Company[];
  onRecordClick: (record: any) => void;
  onAddRecord?: (initialData?: Partial<any>) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  isBulkMode: boolean;
  groupByAccessorKey: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnId,
  title,
  color,
  records,
  columns,
  kanbanConfig,
  people,
  companies,
  onRecordClick,
  onAddRecord,
  selectedIds,
  onSelectionChange,
  isBulkMode,
  groupByAccessorKey
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const handleToggleSelect = (recordId: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(recordId)) {
      newIds.delete(recordId);
    } else {
      newIds.add(recordId);
    }
    onSelectionChange(newIds);
  };

  return (
    <div className="w-[300px] flex flex-col h-full flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between py-3 mb-1 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
          <span className="font-semibold text-sm text-gray-800">{title}</span>
          <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px] font-medium">
            {records.length}
          </span>
        </div>
        {onAddRecord && (
          <button
            onClick={() => onAddRecord({ [groupByAccessorKey]: columnId })}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px] rounded-lg transition-all duration-150 p-3 ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400 shadow-inner' : 'border-2 border-transparent'
        }`}
      >
        <SortableContext items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {records.map(record => (
            <KanbanCard
              key={record.id}
              record={record}
              columns={columns}
              cardFields={kanbanConfig.cardFields}
              isSelected={selectedIds.has(record.id)}
              isBulkMode={isBulkMode}
              onClick={() => onRecordClick(record)}
              onSelect={() => handleToggleSelect(record.id)}
              people={people}
              companies={companies}
            />
          ))}
        </SortableContext>

        {records.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            {isOver ? 'Drop here' : 'No records'}
          </div>
        )}
      </div>

      {/* Column Footer - Sum if configured */}
      {kanbanConfig.showColumnSums && (
        <div className="pt-2 text-[10px] text-gray-400 text-right uppercase tracking-wider font-medium">
          {(() => {
            const sumCol = columns.find(c => c.id === kanbanConfig.showColumnSums);
            if (!sumCol) return null;
            const sum = records.reduce((acc, r) => {
              const val = r[sumCol.accessorKey];
              return acc + (typeof val === 'number' ? val : parseFloat(val) || 0);
            }, 0);
            return `${sumCol.type === 'currency' ? 'USD $' : ''}${sum.toLocaleString(undefined, { minimumFractionDigits: 2 })} sum`;
          })()}
        </div>
      )}
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({
  data,
  columns,
  kanbanConfig,
  people = [],
  companies = [],
  onUpdateRecord,
  onAddRecord,
  onRecordClick,
  selectedIds,
  onSelectionChange,
  isBulkMode
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Even lower distance for easier dragging
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Find the grouping column
  const groupByColumn = columns.find(col => col.id === kanbanConfig.groupByAttributeId);

  // Get the options for columns (from the grouping attribute)
  const kanbanColumns: AttributeOption[] = useMemo(() => {
    if (!groupByColumn?.options) {
      // Fallback: extract unique values from data
      const uniqueValues = new Set<string>();
      data.forEach(record => {
        const value = record[groupByColumn?.accessorKey || ''];
        if (value) uniqueValues.add(String(value));
      });
      return Array.from(uniqueValues).map(val => ({
        id: val,
        label: val,
        color: 'bg-gray-500'
      }));
    }
    return groupByColumn.options;
  }, [groupByColumn, data]);

  // Group data by the kanban column value
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};

    // Initialize empty arrays for each column
    kanbanColumns.forEach(col => {
      groups[col.id] = [];
    });

    // Add "No Status" column for items without a value
    groups['__none__'] = [];

    // Group the data
    data.forEach(record => {
      const value = record[groupByColumn?.accessorKey || ''];
      if (!value) {
        groups['__none__'].push(record);
      } else {
        const columnId = kanbanColumns.find(c => c.id === value || c.label === value)?.id;
        if (columnId && groups[columnId]) {
          groups[columnId].push(record);
        } else {
          groups['__none__'].push(record);
        }
      }
    });

    return groups;
  }, [data, kanbanColumns, groupByColumn]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const cardId = active.id as string;
    const targetColumnId = over.id as string;

    // Find the record
    const record = data.find(r => r.id === cardId);
    if (!record || !groupByColumn) return;

    // Check if dropped on a column (not another card)
    const isColumn = kanbanColumns.some(c => c.id === targetColumnId) || targetColumnId === '__none__';
    if (!isColumn) return;

    // Get current value
    const currentValue = record[groupByColumn.accessorKey];
    const currentColumnId = kanbanColumns.find(c => c.id === currentValue || c.label === currentValue)?.id || '__none__';

    // If dropped on same column, do nothing
    if (currentColumnId === targetColumnId) return;

    // Update the record with new status
    const newValue = targetColumnId === '__none__' ? null : targetColumnId;
    onUpdateRecord({
      ...record,
      [groupByColumn.accessorKey]: newValue
    });
  };

  const activeRecord = activeId ? data.find(r => r.id === activeId) : null;

  // Color mapping for common color values
  const getColorClass = (color: string): string => {
    // If it's already a Tailwind class, use it
    if (color.startsWith('bg-')) return color;

    // Map common color names to Tailwind classes
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'indigo': 'bg-indigo-500',
      'cyan': 'bg-cyan-500',
      'orange': 'bg-orange-500',
      'gray': 'bg-gray-500'
    };

    return colorMap[color.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/50">
        <div className="h-full flex px-4 pb-4 pt-2 gap-4 min-w-max">
          {/* Render each Kanban column */}
          {kanbanColumns.map(column => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.label}
              color={getColorClass(column.color)}
              records={groupedData[column.id] || []}
              columns={columns}
              kanbanConfig={kanbanConfig}
              people={people}
              companies={companies}
              onRecordClick={onRecordClick}
              onAddRecord={onAddRecord}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              isBulkMode={isBulkMode}
              groupByAccessorKey={groupByColumn?.accessorKey || ''}
            />
          ))}

          {/* No Status column (if there are items without a status) */}
          {groupedData['__none__']?.length > 0 && (
            <KanbanColumn
              columnId="__none__"
              title="No Status"
              color="bg-gray-400"
              records={groupedData['__none__']}
              columns={columns}
              kanbanConfig={kanbanConfig}
              people={people}
              companies={companies}
              onRecordClick={onRecordClick}
              onAddRecord={onAddRecord}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              isBulkMode={isBulkMode}
              groupByAccessorKey={groupByColumn?.accessorKey || ''}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeRecord && (
          <div className="opacity-90">
            <KanbanCard
              record={activeRecord}
              columns={columns}
              cardFields={kanbanConfig.cardFields}
              isSelected={false}
              isBulkMode={false}
              onClick={() => {}}
              onSelect={() => {}}
              people={people}
              companies={companies}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;
