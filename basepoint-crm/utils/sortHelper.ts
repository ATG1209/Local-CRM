import { ColumnType } from '../types';

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export const sortData = <T>(
    data: T[],
    sortConfig: SortConfig | null,
    columns: { id: string; type: ColumnType; accessorKey: string }[],
    lookup?: Record<string, Record<string, any>> // e.g. { companies: { "1": { name: "A" } }, people: { "1": { name: "B" } } }
): T[] => {
    if (!sortConfig) return data;

    const column = columns.find(c => c.id === sortConfig.key);
    if (!column) return data;

    return [...data].sort((a: any, b: any) => {
        let valueA = a[column.accessorKey];
        let valueB = b[column.accessorKey];

        // Handle Linked Records / Relations
        if (column.type === 'relation' || column.type === 'company' || column.type === 'person') {
            // Special handling for known relations
            if (column.id === 'record' && lookup?.companies) {
                // Linked Company in Tasks
                // valueA is companyId
                const companyA = lookup.companies.find((c: any) => c.id === valueA);
                const companyB = lookup.companies.find((c: any) => c.id === valueB);
                valueA = companyA ? companyA.name : '';
                valueB = companyB ? companyB.name : '';
            } else if (column.id === 'assignee' && lookup?.people) {
                // Assigned Person in Tasks
                const personA = lookup.people.find((p: any) => p.id === valueA);
                const personB = lookup.people.find((p: any) => p.id === valueB);
                valueA = personA ? personA.name : '';
                valueB = personB ? personB.name : '';
            } else if (column.id === 'poc' && lookup?.people) {
                // Point of Contact in Companies
                const personA = lookup.people.find((p: any) => p.id === valueA);
                const personB = lookup.people.find((p: any) => p.id === valueB);
                valueA = personA ? personA.name : '';
                valueB = personB ? personB.name : '';
            } else if (column.id === 'company' && lookup?.companies) {
                // Company in People
                const companyA = lookup.companies.find((c: any) => c.id === valueA);
                const companyB = lookup.companies.find((c: any) => c.id === valueB);
                valueA = companyA ? companyA.name : '';
                valueB = companyB ? companyB.name : '';
            }
        }

        // Handle null/undefined
        if (valueA === null || valueA === undefined) valueA = '';
        if (valueB === null || valueB === undefined) valueB = '';

        // Type-specific sorting
        if (column.type === 'date' || column.type === 'timestamp') {
            const dateA = valueA ? new Date(valueA).getTime() : 0;
            const dateB = valueB ? new Date(valueB).getTime() : 0;
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (column.type === 'number' || column.type === 'currency' || column.type === 'rating') {
            const numA = Number(valueA) || 0;
            const numB = Number(valueB) || 0;
            return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        if (column.type === 'checkbox') {
            return sortConfig.direction === 'asc'
                ? (valueA === valueB ? 0 : valueA ? -1 : 1)
                : (valueA === valueB ? 0 : valueA ? 1 : -1);
        }

        // Default string sorting
        const stringA = String(valueA).toLowerCase();
        const stringB = String(valueB).toLowerCase();

        if (stringA < stringB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (stringA > stringB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
};
