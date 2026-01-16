import { ColumnType, SortRule } from '../types';

export type SortConfig = SortRule[];

export interface SortLookup {
    companies?: { id: string; name: string }[];
    people?: { id: string; name: string }[];
}

const getNestedValue = (record: any, accessorKey: string) => {
    if (!accessorKey) return undefined;
    return accessorKey.split('.').reduce((acc, key) => acc?.[key], record as any);
};

export const resolveColumnValue = (
    record: any,
    column: { id: string; type: ColumnType; accessorKey: string },
    lookup?: SortLookup
) => {
    let value = getNestedValue(record, column.accessorKey);

    if (column.type !== 'relation' && column.type !== 'company' && column.type !== 'person') {
        return value;
    }

    const companyKeys = new Set(['linkedCompanyId', 'companyId']);
    const personKeys = new Set(['pointOfContactId', 'assignedTo', 'createdBy']);

    const resolveCompany = (id: string) => lookup?.companies?.find(c => c.id === id)?.name || '';
    const resolvePerson = (id: string) => lookup?.people?.find(p => p.id === id)?.name || '';

    const isCompany = companyKeys.has(column.accessorKey) || ['record', 'company'].includes(column.id);
    const isPerson = personKeys.has(column.accessorKey) || ['assignee', 'poc'].includes(column.id);

    if (!isCompany && !isPerson) return value;

    const values = Array.isArray(value) ? value : [value];
    const resolved = values
        .filter(v => v !== null && v !== undefined)
        .map(v => (isCompany ? resolveCompany(String(v)) : resolvePerson(String(v))))
        .filter(label => label !== '');

    if (Array.isArray(value)) {
        return resolved.join(', ');
    }

    return resolved[0] || '';
};

const compareValues = (
    valueA: any,
    valueB: any,
    column: { type: ColumnType },
    direction: 'asc' | 'desc'
) => {
    if (valueA === null || valueA === undefined) valueA = '';
    if (valueB === null || valueB === undefined) valueB = '';

    if (column.type === 'date' || column.type === 'timestamp') {
        const dateA = valueA ? new Date(valueA).getTime() : 0;
        const dateB = valueB ? new Date(valueB).getTime() : 0;
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (column.type === 'number' || column.type === 'currency' || column.type === 'rating') {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return direction === 'asc' ? numA - numB : numB - numA;
    }

    if (column.type === 'checkbox') {
        return direction === 'asc'
            ? (valueA === valueB ? 0 : valueA ? -1 : 1)
            : (valueA === valueB ? 0 : valueA ? 1 : -1);
    }

    const stringA = String(valueA).toLowerCase();
    const stringB = String(valueB).toLowerCase();

    if (stringA < stringB) return direction === 'asc' ? -1 : 1;
    if (stringA > stringB) return direction === 'asc' ? 1 : -1;
    return 0;
};

export const sortData = <T>(
    data: T[],
    sortConfig: SortConfig | null,
    columns: { id: string; type: ColumnType; accessorKey: string }[],
    lookup?: SortLookup
): T[] => {
    if (!sortConfig || sortConfig.length === 0) return data;

    const columnMap = new Map(columns.map(column => [column.id, column]));
    const activeSorts = sortConfig.filter(rule => columnMap.has(rule.key));

    if (activeSorts.length === 0) return data;

    return [...data].sort((a: any, b: any) => {
        for (const rule of activeSorts) {
            const column = columnMap.get(rule.key);
            if (!column) continue;

            const valueA = resolveColumnValue(a, column, lookup);
            const valueB = resolveColumnValue(b, column, lookup);
            const result = compareValues(valueA, valueB, column, rule.direction);

            if (result !== 0) return result;
        }

        return 0;
    });
};
