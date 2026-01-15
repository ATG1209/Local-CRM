
import { Company, Person, Task } from '../types';

export const downloadCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const value = row[fieldName];
      // Handle strings with commas or newlines, and objects
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (typeof value === 'object' && value !== null) {
         if (value instanceof Date) return `"${value.toISOString()}"`;
         return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
