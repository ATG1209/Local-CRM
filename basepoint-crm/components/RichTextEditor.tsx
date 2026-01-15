
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Link as LinkIcon, List, Heading1, Heading2, Quote, CheckSquare, X } from 'lucide-react';
import { getCaretCoordinates } from '../helpers/domHelper';

interface RichTextEditorProps {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMentionTrigger?: (rect: DOMRect) => void; // Called when @ is typed
  onMentionClose?: () => void;
  singleLine?: boolean; // For Title input behavior
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  onKeyDown,
  onMentionTrigger,
  onMentionClose,
  singleLine = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync content only if drastically different to avoid cursor jumping
  // A standard contentEditable pitfall. We normally only sync from props on mount 
  // or if external change happens (reset).
  // Here we assume controlled mostly for extraction, but local updates are immediate.
  const [internalHtml, setInternalHtml] = useState(value);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML && value === '') {
      // Only force update from props if it's a reset (empty)
      editorRef.current.innerHTML = '';
      setInternalHtml('');
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setInternalHtml(html);
    onChange(html);

    // Check for @ trigger
    checkForMentionTrigger();
  };

  const checkForMentionTrigger = () => {
    if (!onMentionTrigger || !onMentionClose) return;

    const selection = window.getSelection();
    if (!selection || !selection.focusNode) return;

    // Very basic: check if last char was @
    // Robust User friendly: check if we are in a word starting with @
    // For now: Just Trigger on @ typing
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    updateToolbar();

    if (e.key === '@') {
      const rect = getCaretCoordinates();
      if (rect && onMentionTrigger) {
        onMentionTrigger(rect);
      }
    } else if (e.key === ' ' || e.key === 'Escape') {
      if (onMentionClose) onMentionClose();
    }
  };

  const handleMouseUp = () => {
    updateToolbar();
  };

  const updateToolbar = () => {
    if (singleLine) return; // No toolbar for title

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setToolbarPosition(null);
      setShowLinkInput(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position above centered
    setToolbarPosition({
      top: rect.top - 50, // 40px above
      left: rect.left + (rect.width / 2)
    });
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput(); // Sync
  };

  const handleLinkSubmit = () => {
    if (linkInputValue) {
      exec('createLink', linkInputValue);
    }
    setToolbarPosition(null);
    setShowLinkInput(false);
    setLinkInputValue('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');

    // Check if pasting URL on selection
    const selection = window.getSelection();
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(text);

    if (isUrl && selection && !selection.isCollapsed) {
      document.execCommand('createLink', false, text);
    } else {
      // Plain text paste
      document.execCommand('insertText', false, text);
    }
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    if (singleLine && e.key === 'Enter') {
      e.preventDefault();
      // Propagate submit?
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <>
      <div
        ref={editorRef}
        className={`outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 cursor-text ${className}`}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDownInternal}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        spellCheck={false}
      />

      {/* Floating Toolbar */}
      {toolbarPosition && !showLinkInput && (
        <div
          className="fixed z-50 flex items-center bg-gray-900 text-white rounded-lg shadow-xl px-1 py-1 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
        >
          <ToolbarButton icon={<Bold size={14} />} onClick={() => exec('bold')} active={document.queryCommandState('bold')} />
          <ToolbarButton icon={<Italic size={14} />} onClick={() => exec('italic')} active={document.queryCommandState('italic')} />
          <ToolbarButton icon={<Heading1 size={14} />} onClick={() => exec('formatBlock', 'KD')} active={false} /> {/* execCommand formatBlock is weird */}
          <ToolbarButton icon={<LinkIcon size={14} />} onClick={() => setShowLinkInput(true)} active={false} />
          <ToolbarButton icon={<List size={14} />} onClick={() => exec('insertUnorderedList')} active={document.queryCommandState('insertUnorderedList')} />
        </div>
      )}

      {/* Link Input Float */}
      {toolbarPosition && showLinkInput && (
        <div
          className="fixed z-50 flex items-center bg-gray-900 p-1 rounded-lg shadow-xl -translate-x-1/2"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <input
            autoFocus
            className="bg-transparent border-none text-white text-xs px-2 py-1 outline-none w-48 placeholder:text-gray-500"
            placeholder="Paste link..."
            value={linkInputValue}
            onChange={e => setLinkInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLinkSubmit()}
          />
          <button onClick={handleLinkSubmit} className="text-blue-400 hover:text-blue-300 p-1"><CheckSquare size={14} /></button>
          <button onClick={() => setShowLinkInput(false)} className="text-gray-400 hover:text-gray-300 p-1"><X size={14} /></button>
        </div>
      )}
    </>
  );
};

const ToolbarButton = ({ icon, onClick, active }: { icon: React.ReactNode, onClick: () => void, active: boolean }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${active ? 'text-blue-400' : 'text-gray-300'}`}
  >
    {icon}
  </button>
);

export default RichTextEditor;
