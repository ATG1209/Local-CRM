import { Activity, Company } from '../types';

export type AlertSeverity = 'danger' | 'warning' | 'success' | 'neutral' | 'info';

export interface AlertSegment {
    icon: string; // Lucide icon name
    severity: AlertSeverity;
    text: string;
}

export const computeCompanyAlert = (
    company: Company,
    activities: Activity[]
): AlertSegment[] => {
    const linkedActivities = activities.filter(
        (a) => a.linkedCompanyId === company.id
    );

    const segments: AlertSegment[] = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Helper to normalize date to start of day for comparison
    const toStartOfDay = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    // --- 1. Meeting Segment Logic ---
    const meetings = linkedActivities.filter(
        (a) => a.type === 'meeting' && a.dueDate
    );

    const upcomingMeetings = meetings
        .filter((m) => {
            if (!m.dueDate) return false;
            const meetingDate = new Date(m.dueDate);
            return toStartOfDay(meetingDate) >= today;
        })
        .sort((a, b) => {
            const da = new Date(a.dueDate!);
            const db = new Date(b.dueDate!);
            return da.getTime() - db.getTime();
        });

    const nextMeeting = upcomingMeetings[0];

    if (!nextMeeting) {
        segments.push({
            icon: 'CalendarX2',
            severity: 'danger',
            text: 'No meeting',
        });
    } else {
        const meetingDate = new Date(nextMeeting.dueDate!);
        const diffTime = toStartOfDay(meetingDate).getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            segments.push({
                icon: 'Calendar',
                severity: 'info',
                text: 'Meeting today',
            });
        } else if (diffDays === 1) {
            segments.push({
                icon: 'Calendar',
                severity: 'info',
                text: 'Meeting tomorrow',
            });
        } else {
            segments.push({
                icon: 'Calendar',
                severity: 'info',
                text: `Meeting in ${diffDays}d`,
            });
        }
    }

    // --- 2. Task Segment Logic ---
    const tasks = linkedActivities.filter(
        (a) => a.type === 'task' && !a.isCompleted
    );

    const sortedTasks = tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const nextTask = sortedTasks[0];

    if (!nextTask) {
        if (!nextMeeting) {
            segments.push({
                icon: 'TriangleAlert',
                severity: 'danger',
                text: 'No tasks',
            });
        } else {
            segments.push({
                icon: 'CheckSquare',
                severity: 'warning',
                text: 'No task',
            });
        }
    } else {
        if (!nextTask.dueDate) {
            segments.push({
                icon: 'HelpCircle',
                severity: 'warning',
                text: 'No date',
            });
        } else {
            const taskDate = new Date(nextTask.dueDate);
            const diffTime = toStartOfDay(taskDate).getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                segments.push({
                    icon: 'CircleAlert',
                    severity: 'danger',
                    text: `${Math.abs(diffDays)}d overdue`,
                });
            } else if (diffDays === 0) {
                segments.push({
                    icon: 'CircleCheck',
                    severity: 'success',
                    text: 'Due today',
                });
            } else if (diffDays === 1) {
                segments.push({
                    icon: 'CircleCheck',
                    severity: 'success',
                    text: 'Due tomorrow',
                });
            } else {
                segments.push({
                    icon: 'Clock',
                    severity: 'neutral',
                    text: `Due in ${diffDays}d`,
                });
            }
        }
    }

    return segments;
};
