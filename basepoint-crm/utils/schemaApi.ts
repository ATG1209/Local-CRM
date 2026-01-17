// API helper for flexible schema endpoints

const API_BASE = 'http://localhost:3001/api';

export interface ObjectType {
    id: string;
    name: string;
    singularName?: string;
    description?: string;
    slug: string;
    icon: string;
    isSystem: boolean;
    createdAt?: string;
}

export interface Attribute {
    id: string;
    objectId: string;
    name: string;
    type: string;
    config: any;
    isSystem: boolean;
    position: number;
    createdAt?: string;
}

export interface RecordRelation {
    id: string;
    sourceRecordId: string;
    targetRecordId: string;
    attributeId: string;
    createdAt?: string;
}

// Objects
export const fetchObjects = async (): Promise<ObjectType[]> => {
    const res = await fetch(`${API_BASE}/objects`);
    if (!res.ok) throw new Error('Failed to fetch objects');
    return res.json();
};

export const createObject = async (data: Partial<ObjectType>): Promise<ObjectType> => {
    const res = await fetch(`${API_BASE}/objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create object');
    return res.json();
};

// Attributes
export const fetchAttributes = async (objectId: string): Promise<Attribute[]> => {
    const res = await fetch(`${API_BASE}/objects/${objectId}/attributes`);
    if (!res.ok) throw new Error('Failed to fetch attributes');
    return res.json();
};

export const createAttribute = async (objectId: string, data: Partial<Attribute>): Promise<Attribute> => {
    const res = await fetch(`${API_BASE}/objects/${objectId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create attribute');
    return res.json();
};

export const updateAttribute = async (id: string, data: Partial<Attribute>): Promise<void> => {
    const res = await fetch(`${API_BASE}/attributes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update attribute');
};

export const deleteAttribute = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/attributes/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attribute');
};

// Relations
export const createRelation = async (data: Partial<RecordRelation>): Promise<RecordRelation> => {
    const res = await fetch(`${API_BASE}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create relation');
    return res.json();
};

export const fetchRelations = async (sourceRecordId: string, attributeId: string): Promise<RecordRelation[]> => {
    const res = await fetch(`${API_BASE}/relations/${sourceRecordId}/${attributeId}`);
    if (!res.ok) throw new Error('Failed to fetch relations');
    return res.json();
};

export const deleteRelation = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/relations/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete relation');
};

export const fetchRecords = async (slug: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch records');
    return res.json();
};

export const createRecord = async (slug: string, data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create record');
    return res.json();
};

export const updateRecord = async (slug: string, id: string, data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/${slug}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update record');
    return res.json();
};

export const deleteRecord = async (slug: string, id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${slug}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete record');
};
