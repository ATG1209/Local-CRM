// Use environment variable or fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(errorData.error || `HTTP ${res.status}`, res.status);
    }
    return res.json();
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`);
        return handleResponse(res);
    },
    post: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    put: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
        });
        return handleResponse(res);
    }
};

export { ApiError };
