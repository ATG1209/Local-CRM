import { ColumnDefinition, FilterRule, FilterOperator } from '../types';
import { resolveColumnValue, SortLookup } from './sortHelper';

const requiresValue = (operator: FilterOperator) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
};

const isEmptyValue = (value: any) => {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

const normalizeString = (value: any) => String(value ?? '').toLowerCase();

const toDateValue = (value: any) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const matchesFilter = (
    value: any,
    column: ColumnDefinition,
    filter: FilterRule
) => {
    if (filter.operator === 'is_empty') return isEmptyValue(value);
    if (filter.operator === 'is_not_empty') return !isEmptyValue(value);

    if (requiresValue(filter.operator) && isEmptyValue(filter.value)) {
        return false; // Filter with missing value should exclude all records
    }

    switch (column.type) {
        case 'number':
        case 'currency':
        case 'rating': {
            const numValue = Number(value);
            const numFilter = Number(filter.value);
            if (Number.isNaN(numValue) || Number.isNaN(numFilter)) return false;
            if (filter.operator === 'gt') return numValue > numFilter;
            if (filter.operator === 'gte') return numValue >= numFilter;
            if (filter.operator === 'lt') return numValue < numFilter;
            if (filter.operator === 'lte') return numValue <= numFilter;
            if (filter.operator === 'is_not') return numValue !== numFilter;
            return numValue === numFilter;
        }
        case 'date':
        case 'timestamp': {
            const dateValue = toDateValue(value);
            const filterDate = toDateValue(filter.value);
            if (!dateValue || !filterDate) return false;
            if (filter.operator === 'before') return dateValue < filterDate;
            if (filter.operator === 'after') return dateValue > filterDate;
            if (filter.operator === 'on_or_before') return dateValue <= filterDate;
            if (filter.operator === 'on_or_after') return dateValue >= filterDate;
            return dateValue === filterDate;
        }
        case 'checkbox': {
            const boolValue = Boolean(value);
            const target = filter.value === 'true' || filter.value === true;
            return filter.operator === 'is_not' ? boolValue !== target : boolValue === target;
        }
        case 'select': {
            if (filter.operator === 'is_not') return value !== filter.value;
            return value === filter.value;
        }
        case 'multi-select': {
            const arrayValue = Array.isArray(value) ? value : [];
            if (filter.operator === 'not_contains') return !arrayValue.includes(filter.value);
            return arrayValue.includes(filter.value);
        }
        default: {
            const stringValue = normalizeString(value);
            const stringFilter = normalizeString(filter.value);
            if (filter.operator === 'not_contains') return !stringValue.includes(stringFilter);
            if (filter.operator === 'is') return stringValue === stringFilter;
            if (filter.operator === 'is_not') return stringValue !== stringFilter;
            return stringValue.includes(stringFilter);
        }
    }
};

export const applyFilters = <T>(
    data: T[],
    filters: FilterRule[],
    columns: ColumnDefinition[],
    lookup?: SortLookup
): T[] => {
    if (!filters || filters.length === 0) return data;

    const columnMap = new Map(columns.map(column => [column.id, column]));

    return data.filter(record => {
        return filters.every(filter => {
            const column = columnMap.get(filter.columnId);
            if (!column) return true;
            const resolvedValue = resolveColumnValue(record, column, lookup);
            return matchesFilter(resolvedValue, column, filter);
        });
    });
};
