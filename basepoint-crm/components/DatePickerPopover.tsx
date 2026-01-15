
import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Repeat,
    Sun,
    Coffee,
    ArrowRightCircle,
    Check,
    ArrowLeft
} from 'lucide-react';
import { parseDateString } from '../utils/taskParser';

interface DatePickerPopoverProps {
    date: Date | null;
    onChange: (date: Date | null) => void;
    onClose: () => void;
    isOpen: boolean;
    triggerRef: React.RefObject<HTMLElement>;
    align?: 'left' | 'right';
    forcedPosition?: 'top' | 'bottom';
}

type PickerView = 'calendar' | 'time';

const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
    date,
    onChange,
    onClose,
    isOpen,
    triggerRef,
    align = 'left',
    forcedPosition
}) => {
    const [pickerView, setPickerView] = useState<PickerView>('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dateInputVal, setDateInputVal] = useState('');
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const [internalDate, setInternalDate] = useState<Date | null>(date);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isDirty = (internalDate?.getTime() !== date?.getTime());

    useEffect(() => {
        if (isOpen) {
            setPickerView('calendar');
            setDateInputVal('');
            setInternalDate(date);
            setShowDiscardConfirm(false);
            // Smart positioning
            if (forcedPosition) {
                setPosition(forcedPosition);
            } else if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const PICKER_HEIGHT = 400; // Increased for footer
                if (spaceBelow < PICKER_HEIGHT && rect.top > PICKER_HEIGHT) {
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            } else {
                setPosition('bottom');
            }
        }
    }, [isOpen, triggerRef, date]);

    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowDiscardConfirm(true);
        } else {
            onClose();
        }
    };

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                handleCloseAttempt();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleCloseAttempt();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, triggerRef, isDirty]);

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateInputVal(e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const parsed = parseDateString(dateInputVal);
            if (parsed) {
                const newDate = new Date(parsed);
                // Preserve time if existing date had specific time
                if (internalDate && (internalDate.getHours() !== 0 || internalDate.getMinutes() !== 0)) {
                    newDate.setHours(internalDate.getHours());
                    newDate.setMinutes(internalDate.getMinutes());
                }
                setInternalDate(newDate);
                onChange(newDate);
                onClose();
            }
        }
    };

    const updateDate = (newDate: Date) => {
        if (internalDate) {
            // Preserve time
            newDate.setHours(internalDate.getHours());
            newDate.setMinutes(internalDate.getMinutes());
        }
        setInternalDate(new Date(newDate));
    };

    const handleApply = () => {
        onChange(internalDate);
        onClose();
    };

    const handleQuickDateSelect = (daysOffset: number) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0); // Start of day
        d.setDate(d.getDate() + daysOffset);
        if (internalDate) {
            d.setHours(internalDate.getHours());
            d.setMinutes(internalDate.getMinutes());
        }
        setInternalDate(d);
    };

    const handleWeekendSelect = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 5; // Next Saturday
        d.setDate(diff);
        setInternalDate(d);
    };

    const handleNextWeekSelect = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7; // Next Monday
        d.setDate(diff);
        setInternalDate(d);
    };

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const timeSlots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const t = new Date();
            t.setHours(i);
            t.setMinutes(j);
            timeSlots.push(t);
        }
    }

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className={`absolute z-[100] w-[280px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 ${align === 'right' ? 'right-0' : 'left-0'}`}
            style={{
                top: position === 'bottom' ? 'calc(100% + 8px)' : 'auto',
                bottom: position === 'top' ? 'calc(100% + 8px)' : 'auto'
            }}
        >
            {/* Top Input */}
            <div className="p-3 border-b border-gray-100">
                <input
                    placeholder="Type a date..."
                    className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                    autoFocus
                    value={dateInputVal}
                    onChange={handleDateInput}
                    onKeyDown={handleInputKeyDown}
                />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px]">
                {pickerView === 'calendar' ? (
                    <div className="p-2">
                        {/* Quick Options */}
                        <div className="space-y-0.5 mb-3">
                            <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer group" onClick={() => handleQuickDateSelect(0)}>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-green-600" />
                                    <span className="text-sm text-gray-700">Today</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            </div>
                            <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer group" onClick={() => handleQuickDateSelect(1)}>
                                <div className="flex items-center gap-2">
                                    <Sun size={14} className="text-yellow-600" />
                                    <span className="text-sm text-gray-700">Tomorrow</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            </div>
                            <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer group" onClick={handleWeekendSelect}>
                                <div className="flex items-center gap-2">
                                    <Coffee size={14} className="text-blue-600" />
                                    <span className="text-sm text-gray-700">This weekend</span>
                                </div>
                                <span className="text-xs text-gray-400">Sat</span>
                            </div>
                            <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer group" onClick={handleNextWeekSelect}>
                                <div className="flex items-center gap-2">
                                    <ArrowRightCircle size={14} className="text-purple-600" />
                                    <span className="text-sm text-gray-700">Next week</span>
                                </div>
                                <span className="text-xs text-gray-400">Mon</span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 mb-3 mx-2"></div>

                        {/* Calendar Header */}
                        <div className="px-2">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-800">{currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                                <div className="flex gap-1">
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                                    <span key={d} className="text-[10px] font-medium text-gray-400 uppercase">{d}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {generateCalendarDays().map((day, idx) => {
                                    if (!day) return <span key={idx} />;
                                    const isSelected = internalDate?.toDateString() === day.toDateString();
                                    const isToday = new Date().toDateString() === day.toDateString();
                                    return (
                                        <span
                                            key={idx}
                                            onClick={() => updateDate(day)}
                                            className={`
                                        h-7 w-7 flex items-center justify-center rounded cursor-pointer transition-all
                                        ${isSelected ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}
                                        ${isToday && !isSelected ? 'text-blue-600 font-semibold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full' : ''}
                                    `}
                                        >
                                            {day.getDate()}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 cursor-pointer hover:text-gray-900 px-2 py-1" onClick={() => setPickerView('calendar')}>
                            <ArrowLeft size={12} /> Back to Calendar
                        </div>
                        <div className="space-y-0.5">
                            {timeSlots.map((time, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        const newDate = internalDate ? new Date(internalDate) : new Date();
                                        newDate.setHours(time.getHours());
                                        newDate.setMinutes(time.getMinutes());
                                        setInternalDate(newDate);
                                        // Stay in time view or go back? Let's stay so they can change it, but they can click "Back"
                                    }}
                                    className="px-2 py-1.5 hover:bg-gray-100 rounded text-xs text-gray-600 cursor-pointer flex justify-between group transition-colors"
                                >
                                    <span className="group-hover:text-gray-900">{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                    {internalDate && internalDate.getHours() === time.getHours() && internalDate.getMinutes() === time.getMinutes() && <Check size={12} className="text-blue-600" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {pickerView === 'calendar' && (
                <div className="p-2 border-t border-gray-100 flex gap-2 bg-gray-50/50">
                    <button
                        onClick={(e) => { e.stopPropagation(); setPickerView('time'); }}
                        className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-white rounded text-xs font-medium text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm transition-all"
                    >
                        <Clock size={12} className="text-gray-500" />
                        {internalDate && (internalDate.getHours() !== 0 || internalDate.getMinutes() !== 0)
                            ? internalDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                            : 'Time'}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-white rounded text-xs font-medium text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm transition-all">
                        <Repeat size={12} className="text-gray-500" /> Repeat
                    </button>
                </div>
            )}

            {/* Actions Footer */}
            <div className="p-2 border-t border-gray-100 flex gap-2 bg-white">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApply();
                    }}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium text-white rounded shadow-sm transition-all ${isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
                    disabled={!isDirty}
                >
                    Update
                </button>
            </div>

            {/* Discard Confirmation Overlay */}
            {showDiscardConfirm && (
                <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Unsaved changes</h3>
                    <p className="text-xs text-gray-500 mb-6">You have selected a new date but haven't updated yet. Do you want to discard your changes?</p>
                    <div className="flex flex-col w-full gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                            Discard changes
                        </button>
                        <button
                            onClick={() => setShowDiscardConfirm(false)}
                            className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Continue editing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePickerPopover;
