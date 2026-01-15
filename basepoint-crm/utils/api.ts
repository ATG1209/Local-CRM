const API_BASE = 'http://localhost:3001/api';

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`);
        return res.json();
    },
    post: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    put: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
        });
        return res.json();
    }
};
