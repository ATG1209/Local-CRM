import React, { useState } from 'react';
import { X, Database, Type, FileText } from 'lucide-react';
import { createObject } from '../utils/schemaApi';

interface CreateDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newObject: any) => void;
}

const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({ isOpen, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [singularName, setSingularName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name || !singularName) return;

        setIsSubmitting(true);
        try {
            const newObj = await createObject({
                name,
                singularName,
                description,
                icon: 'database' // Default icon for now
            });
            onCreated(newObj);
            onClose();
            // Reset form
            setName('');
            setSingularName('');
            setDescription('');
        } catch (err) {
            console.error("Failed to create database", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] flex flex-col overflow-hidden border border-gray-200">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                            <Database size={18} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Create new database</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Database Name (Plural)</label>
                        <div className="relative">
                            <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="e.g. Projects"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">This will be the name shown in the sidebar.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Singular Name</label>
                        <div className="relative">
                            <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="e.g. Project"
                                value={singularName}
                                onChange={(e) => setSingularName(e.target.value)}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Used for "New Project" buttons, etc.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="relative">
                            <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-24"
                                placeholder="What is this database storing?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name || !singularName || isSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Database'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreateDatabaseModal;
