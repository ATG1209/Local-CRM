
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
        // Basic code implementation if needed, or ignore if RichTextEditor doesn't support it well yet.
        // Assuming simplistic wrapping for now or ignore.
        break;
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      const rect = getCaretCoordinates(); // Assuming this helper exists and works
      if (rect && onMentionTrigger) {
        onMentionTrigger(rect);
      }
    } else if (e.key === ' ' || e.key === 'Escape') {
      if (onMentionClose) onMentionClose();
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

  return (
    <>
      <div
        ref={editorRef}
        className={`outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 cursor-text ${className}`}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDownInternal}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        spellCheck={false}
      />

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
