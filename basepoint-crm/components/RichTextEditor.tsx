
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Link as LinkIcon, List, Heading1, Heading2, Quote, CheckSquare, X } from 'lucide-react';
import FloatingToolbar from './FloatingToolbar';
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
  const [isFocused, setIsFocused] = useState(false);

  // Sync content only if drastically different to avoid cursor jumping
  // A standard contentEditable pitfall. We normally only sync from props on mount 
  // or if external change happens (reset).
  // Here we assume controlled mostly for extraction, but local updates are immediate.
  const [internalHtml, setInternalHtml] = useState(value);
  const [linkTooltip, setLinkTooltip] = useState<{ url: string; top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== editorRef.current.innerHTML && (!isFocused || value === '')) {
      editorRef.current.innerHTML = value || '';
      setInternalHtml(value || '');
    }
  }, [value, isFocused]);

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

  const checkForLink = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setLinkTooltip(null);
      return;
    }

    let node = selection.anchorNode;
    // If text node, verify parent
    if (node && node.nodeType === 3) {
      node = node.parentNode;
    }

    const link = (node as HTMLElement)?.closest('a');
    if (link) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // Adjust for editor position if needed, but fixed/absolute usually works relative to viewport or parent
      // using fixed for simplicity relative to viewport
      setLinkTooltip({
        url: link.href,
        top: rect.bottom + 5,
        left: rect.left
      });
    } else {
      setLinkTooltip(null);
    }
  };



  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput(); // Sync
  };

  const handleFormatApply = (format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link' | 'list', value?: string) => {
    switch (format) {
      case 'bold':
        exec('bold');
        break;
      case 'italic':
        exec('italic');
        break;
      case 'strikethrough':
        exec('strikeThrough');
        break;
      case 'list':
        exec('insertUnorderedList');
        break;
      case 'link':
        if (value) exec('createLink', value);
        break;
      case 'code':
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const wrapper = document.createElement('code');
          wrapper.className = 'bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono';
          try {
            const content = range.extractContents();
            wrapper.appendChild(content);
            range.insertNode(wrapper);
            handleInput(); // Sync
          } catch (e) {
            console.warn('Cannot apply code format');
          }
        }
        break;
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    checkForLink();
    if (e.key === '@') {
      const rect = getCaretCoordinates(); // Assuming this helper exists and works
      if (rect && onMentionTrigger) {
        onMentionTrigger(rect);
      }
    } else if (e.key === ' ' || e.key === 'Escape') {
      if (onMentionClose) onMentionClose();
      if (e.key === 'Escape') setLinkTooltip(null);
    }
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

  const handleClick = (e: React.MouseEvent) => {
    checkForLink();
    if (e.metaKey || e.ctrlKey) {
      // Keep Cmd+Click as a backup
      let target = e.target as Node;
      if (target.nodeType === 3) target = target.parentNode as Node;
      const link = (target as HTMLElement).closest('a');
      if (link) {
        e.preventDefault();
        window.open(link.href, '_blank');
      }
    }
  };

  return (
    <>
      <div
        ref={editorRef}
        className={`outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 cursor-text prose prose-sm max-w-none ${className}`}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDownInternal}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        spellCheck={false}
      />

      {linkTooltip && (
        <div
          className="fixed z-[9999] bg-white border border-gray-200 shadow-lg rounded-md px-2 py-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-75"
          style={{ top: linkTooltip.top, left: linkTooltip.left }}
        >
          <a
            href={linkTooltip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline max-w-[200px] truncate"
          >
            {linkTooltip.url}
          </a>
          <button
            onClick={() => window.open(linkTooltip.url, '_blank')}
            className="text-gray-400 hover:text-gray-600"
          >
            <LinkIcon size={12} />
          </button>
        </div>
      )}

      {/* Floating Toolbar */}
      {!singleLine && (
        <FloatingToolbar
          containerRef={editorRef}
          onFormatApply={handleFormatApply}
        />
      )}
    </>
  );
};



export default RichTextEditor;
