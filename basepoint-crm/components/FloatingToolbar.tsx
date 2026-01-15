
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bold, Italic, Strikethrough, Link as LinkIcon, X, Check, Code } from 'lucide-react';

interface FloatingToolbarProps {
    containerRef: React.RefObject<HTMLElement>;
    onFormatApply: (format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link', value?: string) => void;
    linkOnly?: boolean; // For title field - only show link button
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ containerRef, onFormatApply, linkOnly = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const linkInputRef = useRef<HTMLInputElement>(null);

    const updatePosition = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !containerRef.current) {
            if (!showLinkInput) {
                setIsVisible(false);
            }
            return;
        }

        // Check if selection is within our container
        const range = selection.getRangeAt(0);
        if (!containerRef.current.contains(range.commonAncestorContainer)) {
            if (!showLinkInput) {
                setIsVisible(false);
            }
            return;
        }

        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Position above the selection, centered
        setPosition({
            top: rect.top - containerRect.top - 48,
            left: rect.left - containerRect.left + (rect.width / 2) - (linkOnly ? 40 : 80)
        });
        setIsVisible(true);
    }, [containerRef, showLinkInput, linkOnly]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (!showLinkInput) {
                setTimeout(updatePosition, 10);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [updatePosition, showLinkInput]);

    useEffect(() => {
        if (showLinkInput && linkInputRef.current) {
            linkInputRef.current.focus();
        }
    }, [showLinkInput]);

    const handleFormat = (format: 'bold' | 'italic' | 'strikethrough' | 'code') => {
        onFormatApply(format);
    };

    const handleLinkClick = () => {
        // Save the current selection before showing input
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedSelection(selection.getRangeAt(0).cloneRange());
        }
        setShowLinkInput(true);
    };

    const handleLinkApply = () => {
        if (linkUrl.trim() && savedSelection) {
            // Restore selection
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedSelection);
            }

            // Apply link
            onFormatApply('link', linkUrl.trim());
        }
        setLinkUrl('');
        setShowLinkInput(false);
        setSavedSelection(null);
        setIsVisible(false);
    };

    const handleLinkCancel = () => {
        setLinkUrl('');
        setShowLinkInput(false);
        setSavedSelection(null);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={toolbarRef}
            className="absolute z-[200] flex items-center bg-gray-900 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.top, left: Math.max(0, position.left) }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
            {!showLinkInput ? (
                <div className="flex items-center px-1 py-1 gap-0.5">
                    {!linkOnly && (
                        <>
                            <button
                                onClick={() => handleFormat('bold')}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Bold"
                            >
                                <Bold size={14} />
                            </button>
                            <button
                                onClick={() => handleFormat('italic')}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Italic"
                            >
                                <Italic size={14} />
                            </button>
                            <button
                                onClick={() => handleFormat('strikethrough')}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Strikethrough"
                            >
                                <Strikethrough size={14} />
                            </button>
                            <button
                                onClick={() => handleFormat('code')}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Inline Code"
                            >
                                <Code size={14} />
                            </button>
                            <div className="w-px h-4 bg-gray-700 mx-1" />
                        </>
                    )}
                    <button
                        onClick={handleLinkClick}
                        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-700 transition-colors text-xs"
                        title="Add Link"
                    >
                        <LinkIcon size={14} />
                        <span>Link</span>
                    </button>
                </div>
            ) : (
                <div className="flex items-center px-2 py-1.5 gap-1">
                    <input
                        ref={linkInputRef}
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLinkApply();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                handleLinkCancel();
                            }
                        }}
                        placeholder="Paste link..."
                        className="bg-transparent border-none text-white text-xs outline-none w-44 placeholder:text-gray-500"
                    />
                    <button
                        onClick={handleLinkApply}
                        className="p-1.5 rounded hover:bg-gray-700 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Apply Link"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={handleLinkCancel}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
                        title="Cancel"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FloatingToolbar;
