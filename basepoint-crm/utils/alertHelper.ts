import { Company, Activity } from '../types';
import { differenceInCalendarDays, parseISO, isBefore, isToday, isTomorrow, startOfDay } from 'date-fns';

export type AlertSeverity = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export interface AlertSegment {
    icon: string; // Lucide icon name
    severity: AlertSeverity;
    text: string;
}

export interface CompanyAlert {
    segments: AlertSegment[];
}

export const computeCompanyAlert = (company: Company, activities: Activity[]): CompanyAlert => {
    const segments: AlertSegment[] = [];

    // --- 1. Meeting Segment ---
    const meetings = activities.filter(a =>
        a.linkedCompanyId === company.id &&
        a.type === 'meeting'
    );

    let meetingSegment: AlertSegment;
    const today = startOfDay(new Date());

    const upcomingMeetings = meetings.filter(m => {
        const d = m.dueDate ? new Date(m.dueDate) : null;
        return d && d >= today;
    });

    const pastMeetings = meetings.filter(m => {
        const d = m.dueDate ? new Date(m.dueDate) : null;
        return d && d < today;
    });

    if (upcomingMeetings.length === 0 && pastMeetings.length === 0) {
        meetingSegment = { icon: 'CalendarX', severity: 'danger', text: 'No meeting scheduled' };
    } else {
        // Prioritize upcoming meetings
        let targetDate: Date | null = null;

        if (upcomingMeetings.length > 0) {
            // Find earliest upcoming
            upcomingMeetings.sort((a, b) => (new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()));
            targetDate = new Date(upcomingMeetings[0].dueDate!);

            if (isToday(targetDate)) {
                meetingSegment = { icon: 'Calendar', severity: 'info', text: 'Meeting today' };
            } else if (isTomorrow(targetDate)) {
                meetingSegment = { icon: 'Calendar', severity: 'info', text: 'Meeting tomorrow' };
            } else {
                const days = differenceInCalendarDays(targetDate, today);
                meetingSegment = { icon: 'Calendar', severity: 'neutral', text: `Meeting in ${days} days` };
            }
        } else {
            // Only past meetings exist
            pastMeetings.sort((a, b) => (new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime())); // Descending
            targetDate = new Date(pastMeetings[0].dueDate!);
            const days = differenceInCalendarDays(today, targetDate);
            meetingSegment = { icon: 'CalendarClock', severity: 'warning', text: `Meeting overdue by ${days} days` };
        }
    }
    segments.push(meetingSegment);


    // --- 2. Task Segment ---
    const tasks = activities.filter(a =>
        (a.type === 'task') &&
        (a.linkedCompanyId === company.id || (a.linkedCompanyId === undefined && company.id === 'unknown')) // Simplify for now, strictly check linkedCompanyId
    ).filter(a => a.linkedCompanyId === company.id); // Re-filter to be sure

    // "Incomplete" means not completed.
    const incompleteTasks = tasks.filter(t => !t.isCompleted);

    let taskSegment: AlertSegment;

    if (incompleteTasks.length === 0) {
        if (tasks.length === 0 && activities.filter(a => a.type === 'task').length > 0) {
            // If there are tasks globally but none for this company...
            // Actually requirement says: "No task records at all" -> "No tasks planned"
            // But we are filtering by company. So if this company has no tasks.
        }
        taskSegment = { icon: 'ListX', severity: 'warning', text: 'No tasks planned' };
        // Note: The requirement says "No task records at all" -> "No tasks planned". 
        // If there are completed tasks but no incomplete ones, strictly speaking there ARE task records.
        // However, "No tasks planned" usually implies no FUTURE work.
        // Let's stick to: if no incomplete tasks -> check if *any* tasks exist? 
        // Requirement: "Else if there are no task records at all: No tasks planned" -> implies if there are confirmed completed tasks, maybe we don't show this?
        // But the first condition is "Filter incomplete tasks".
        // Let's refine based on "Determine the 'active' task": 
        // If incomplete tasks exist -> process them.
        // Else (no incomplete tasks) -> "No tasks planned"? Or "All tasks done"?
        // Requirement says: "Else if there are no task records at all: 'No tasks planned'". 
        // Implicitly: if there ARE completed tasks but no incomplete ones, what do we show?
        // Usually "No tasks planned" or "Clear". Let's use "CheckSquare" (All done) or "ListX" (No tasks). 
        // I will default to "No tasks planned" for now if no incomplete tasks exist, but maybe distinguish if we want.
        // Re-reading: "Else if there are no task records at all" is the LAST fallback. 
        // If there ARE records but all complete? technically "No incomplete tasks".
        // I will treat "All completed" same as "No tasks planned" for simple "Active" status, 
        // OR better: { icon: 'CheckSquare', severity: 'success', text: 'All tasks completed' } if tasks exist?
        // User spec strictness: "Segment output: No task records -> ...". 
        // I'll stick to the "No task records" logic strictly for the specific text, but for "All complete" I might need a fallback.
        // Let's assume if we have completed tasks but no incomplete, it's effectively "No tasks planned" for the future.
    } else {
        const withDueDate = incompleteTasks.filter(t => t.dueDate);
        const withoutDueDate = incompleteTasks.filter(t => !t.dueDate);

        if (withDueDate.length > 0) {
            // Prefer min(dueDate >= today)
            const activeTasks = withDueDate.filter(t => {
                const d = new Date(t.dueDate!);
                return d >= today || isSameDay(d, today); // isSameDay handles time stripping
            });
            // Actually 'today' from startOfDay is 00:00. d >= today covers today and future.

            // Wait, logic: "Prefer min(dueDate where dueDate >= today)"
            // "if none, use max(dueDate where dueDate < today) for overdue"

            let targetTask = null;
            const futureOrToday = withDueDate.filter(t => new Date(t.dueDate!) >= today);

            if (futureOrToday.length > 0) {
                futureOrToday.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
                targetTask = futureOrToday[0];
            } else {
                // All are overdue
                const overdue = withDueDate.filter(t => new Date(t.dueDate!) < today);
                overdue.sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime()); // Max (closest to today?)
                // Usually for overdue you want the *most* overdue? Or the *least* overdue?
                // Requirement: "max(dueDate where dueDate < today)" -> This means the LATEST past date (least overdue).
                targetTask = overdue[0];
            }

            const d = new Date(targetTask.dueDate!);

            if (isBefore(d, today)) {
                const diff = differenceInCalendarDays(today, d);
                taskSegment = { icon: 'AlertCircle', severity: 'danger', text: `Task overdue by ${diff} days` };
            } else if (isToday(d)) {
                taskSegment = { icon: 'CheckCircle', severity: 'success', text: 'Task due today' };
            } else if (isTomorrow(d)) {
                taskSegment = { icon: 'CheckCircle', severity: 'success', text: 'Task due tomorrow' };
            } else {
                const diff = differenceInCalendarDays(d, today);
                taskSegment = { icon: 'CheckCircle', severity: 'neutral', text: `Task due in ${diff} days` };
            }

        } else {
            // Incomplete exist but ALL missing due date
            taskSegment = { icon: 'Disc', severity: 'warning', text: 'Task missing due date' }; // 'dot-circle' -> Disc
        }
    }
    segments.push(taskSegment);


    // --- 3. Log Segment ---
    let logSegment: AlertSegment;
    if (!company.lastLoggedAt) {
        logSegment = { icon: 'History', severity: 'warning', text: 'Not logged -1' };
    } else {
        const lastLogged = new Date(company.lastLoggedAt);
        const days = differenceInCalendarDays(today, lastLogged);

        // Logged today (0 days ago) or future (shouldn't happen) -> 0
        const displayDays = Math.max(0, days);

        let suffix = '';
        if (displayDays <= 10) suffix = ' -3';
        else if (displayDays <= 15) suffix = ' -2';
        else suffix = ''; // > 15 days

        let severity: AlertSeverity = 'neutral';
        if (displayDays > 15) severity = 'danger';
        else if (displayDays > 10) severity = 'warning';

        logSegment = {
            icon: 'History',
            severity,
            text: `Logged ${displayDays} days ago${suffix}`
        };
    }
    segments.push(logSegment);

    return { segments };
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}
