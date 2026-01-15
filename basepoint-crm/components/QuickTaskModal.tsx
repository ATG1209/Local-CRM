
import React, { useState, useEffect, useRef } from 'react';
import { Company, Task, ParsedTask } from '../types';
import { parseTaskInput } from '../utils/taskParser';
import DatePickerPopover from './DatePickerPopover';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
import FloatingToolbar from './FloatingToolbar';
import { getCaretCoordinates } from '../utils/textareaHelper';
import {
  Calendar,
  X
} from 'lucide-react';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  companies: Company[];
}

const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  companies
}) => {
  // --- State ---
  const [titleValue, setTitleValue] = useState('');
  const [descHtml, setDescHtml] = useState('');

  // NPL Parsing (Title only)
  const [parsed, setParsed] = useState<ParsedTask | null>(null);

  // Pickers
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [manualDate, setManualDate] = useState<Date | null>(null);
  const [manualCompanyId, setManualCompanyId] = useState<string | null>(null);

  // @ Mentions in Title
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });

  // Refs
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const titleOverlayRef = useRef<HTMLDivElement>(null);
  const descEditorRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLDivElement>(null);

  // --- Reset on Open ---
  useEffect(() => {
    if (isOpen) {
      setTitleValue('');
      setDescHtml('');
      setParsed(null);
      setManualDate(null);
      setManualCompanyId(null);
      setIsDatePickerOpen(false);
      setShowMentionPicker(false);
      setMentionFilter('');
      // Clear description editor
      if (descEditorRef.current) {
        descEditorRef.current.innerHTML = '';
      }
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // --- Escape Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isDatePickerOpen) return setIsDatePickerOpen(false);
        if (showMentionPicker) return setShowMentionPicker(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDatePickerOpen, showMentionPicker, onClose]);

  // --- Parsing ---
  useEffect(() => {
    if (titleValue.trim()) {
      const result = parseTaskInput(titleValue, companies);
      setParsed(result);
    } else {
      setParsed(null);
    }
  }, [titleValue, companies]);

  // --- Derived Values ---
  const effectiveDate = manualDate || parsed?.dueDate;
  const effectiveCompanyId = manualCompanyId || parsed?.linkedCompany?.id;

  // --- @ Trigger Detection ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTitleValue(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\w]*)$/);

    if (atMatch) {
      const query = atMatch[1] || '';
      if (titleInputRef.current) {
        const coords = getCaretCoordinates(titleInputRef.current, cursorPos);
        setMentionPos({ top: coords.top + coords.height, left: coords.left });
      }
      setShowMentionPicker(true);
      setMentionFilter(query);
    } else {
      setShowMentionPicker(false);
      setMentionFilter('');
    }

    if (titleOverlayRef.current) {
      titleOverlayRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleMentionSelect = (company: Company) => {
    const cursorPos = titleInputRef.current?.selectionStart || titleValue.length;
    const textBeforeCursor = titleValue.slice(0, cursorPos);
    const textAfterCursor = titleValue.slice(cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const newTitle = textBeforeCursor.substring(0, atIndex) + textAfterCursor;
      setTitleValue(newTitle);
    }

    setManualCompanyId(company.id);
    setShowMentionPicker(false);
    setMentionFilter('');
    titleInputRef.current?.focus();
  };

  // --- Description Formatting ---
  const handleDescInput = () => {
    if (descEditorRef.current) {
      setDescHtml(descEditorRef.current.innerHTML);
    }
  };

  const handleDescPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    const isUrl = /^(https?:\/\/)[^\s]+$/.test(text.trim());

    if (isUrl && selection && !selection.isCollapsed) {
      document.execCommand('createLink', false, text.trim());
    } else {
      document.execCommand('insertText', false, text);
    }
  };

  const handleDescFormatApply = (format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link', value?: string) => {
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false);
        break;
      case 'code':
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const code = document.createElement('code');
          code.className = 'bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono';
          range.surroundContents(code);
        }
        break;
      case 'link':
        if (value) {
          document.execCommand('createLink', false, value);
        }
        break;
    }
    handleDescInput();
    descEditorRef.current?.focus();
  };

  // --- Title Link Apply (wraps selected text in anchor, stores in title) ---
  const handleTitleFormatApply = (format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link', value?: string) => {
    if (format !== 'link' || !value) return;

    // For textarea, we need to wrap selected text in anchor tag
    const input = titleInputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end) return; // No selection

    const selectedText = titleValue.substring(start, end);
    const beforeText = titleValue.substring(0, start);
    const afterText = titleValue.substring(end);

    // Create hyperlink markdown-style or HTML-style
    // For display, we'll use HTML in the overlay and store a simple linked text
    // Actually for a textarea, we can't really show styled links.
    // Let's store it as [text](url) markdown style for now
    const linkedText = `[${selectedText}](${value})`;

    setTitleValue(beforeText + linkedText + afterText);
  };

  // --- Handlers ---
  const handleSubmit = () => {
    if (!titleValue.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: parsed ? parsed.cleanTitle : titleValue,
      description: descHtml,
      isCompleted: false,
      dueDate: effectiveDate || null,
      linkedCompanyId: effectiveCompanyId || undefined,
      assignedTo: 'you',
      createdBy: 'you',
      createdAt: new Date()
    };

    onAddTask(newTask);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showMentionPicker) {
        const filtered = companies.filter(c => c.name.toLowerCase().includes(mentionFilter.toLowerCase()));
        if (filtered.length > 0) handleMentionSelect(filtered[0]);
      } else if (titleValue.trim()) {
        handleSubmit();
      }
    }
  };

  // --- Highlighted Title Rendering ---
  const renderHighlightedTitle = () => {
    if (!parsed || !titleValue) return <span className="text-gray-900">{titleValue || ' '}</span>;

    const ranges = parsed.highlightRanges.sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    ranges.forEach((range, i) => {
      if (range.start > lastIndex) {
        elements.push(<span key={`text-${i}`} className="text-gray-900">{titleValue.slice(lastIndex, range.start)}</span>);
      }

      const content = titleValue.slice(range.start, range.end);
      const isDate = range.type === 'date';

      elements.push(
        <span
          key={`highlight-${i}`}
          className={`${isDate ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'} rounded-sm`}
        >
          {content}
        </span>
      );
      lastIndex = range.end;
    });

    if (lastIndex < titleValue.length) {
      elements.push(<span key="text-end" className="text-gray-900">{titleValue.slice(lastIndex)}</span>);
    }

    return <>{elements}</>;
  };

  // --- Date Display with Time ---
  const formatDateWithTime = (date: Date) => {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || parsed?.hasTime;
    if (hasTime) {
      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${dateStr} ${timeStr}`;
    }
    return dateStr;
  };

  // --- Render ---
  if (!isOpen) return null;

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const typographyStyle = {
    fontFamily: '"Inter", sans-serif',
    fontSize: '20px',
    lineHeight: '30px',
    fontWeight: 600,
    letterSpacing: '0px',
    padding: '4px 0px',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-visible animate-in fade-in zoom-in-95 duration-200 relative flex flex-col">

        {/* Header Area: Title + Close Button */}
        <div className="flex justify-between items-start px-5 pt-5 pb-1 relative">
          <div className="flex-1 mr-4 relative" ref={titleContainerRef}>

            {/* Title Toolbar - Link Only */}
            <FloatingToolbar
              containerRef={titleContainerRef as React.RefObject<HTMLElement>}
              onFormatApply={handleTitleFormatApply}
              linkOnly={true}
            />

            <div className="relative min-h-[38px] w-full">
              <div
                ref={titleOverlayRef}
                className="absolute inset-0 pointer-events-none z-0 overflow-hidden text-gray-900"
                style={{ ...typographyStyle, color: 'transparent' }}
                aria-hidden="true"
              >
                {renderHighlightedTitle()}
              </div>

              <textarea
                ref={titleInputRef}
                className="w-full bg-transparent border-0 outline-none resize-none overflow-hidden relative z-10 text-transparent caret-gray-900"
                style={typographyStyle}
                placeholder="Task name (type @ to link company)"
                value={titleValue}
                onChange={handleTitleChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                rows={1}
              />

              {showMentionPicker && (
                <div
                  className="absolute z-[150] bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-64 animate-in fade-in zoom-in-95 duration-75 flex flex-col max-h-48 overflow-y-auto"
                  style={{
                    top: mentionPos.top,
                    left: mentionPos.left
                  }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-50 mb-1">
                    Link to Company
                  </div>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => handleMentionSelect(company)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-blue-50 text-left transition-colors group"
                      >
                        <CompanyAvatar name={company.name} size="xs" />
                        <span className="text-sm text-gray-700 font-medium group-hover:text-blue-700">{company.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400 italic">No companies found</div>
                  )}
                </div>
              )}
            </div>

          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Description Input with Floating Toolbar */}
        <div className="px-5 py-2 min-h-[80px] relative">
          <FloatingToolbar
            containerRef={descEditorRef as React.RefObject<HTMLElement>}
            onFormatApply={handleDescFormatApply}
          />
          <div
            ref={descEditorRef}
            contentEditable
            onInput={handleDescInput}
            onPaste={handleDescPaste}
            className="w-full min-h-[60px] py-2 px-0 bg-transparent border-0 outline-none text-sm text-gray-600 leading-relaxed [&_a]:text-blue-600 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
            data-placeholder="Description (select text for formatting)"
            spellCheck={false}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 w-full" />

        {/* Actions Footer */}
        <div className="px-4 py-3 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">

            <div className="relative" ref={dateTriggerRef}>
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${effectiveDate
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Calendar size={14} className={effectiveDate ? 'text-blue-600' : 'text-gray-500'} />
                {effectiveDate ? formatDateWithTime(effectiveDate) : 'Due date'}
              </button>

              <DatePickerPopover
                isOpen={isDatePickerOpen}
                date={effectiveDate || null}
                onChange={(d) => { setManualDate(d); setIsDatePickerOpen(false); }}
                onClose={() => setIsDatePickerOpen(false)}
                triggerRef={dateTriggerRef}
              />
            </div>

            <div className="w-[180px]">
              <SearchableSelect
                value={effectiveCompanyId}
                onChange={setManualCompanyId}
                options={companies.map(c => ({ id: c.id, label: c.name, icon: <CompanyAvatar name={c.name} size="xs" /> }))}
                placeholder="Linked to..."
                className="border border-gray-200 rounded-lg h-[30px] text-xs bg-white hover:bg-gray-50 shadow-sm"
              />
            </div>

          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!titleValue.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add task
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuickTaskModal;
