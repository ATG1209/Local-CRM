
import React, { useState } from 'react';
import { Activity, ActivityType, ACTIVITY_TYPE_CONFIGS, Company, Person } from '../types';
import { CheckSquare, Phone, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react';
import CompanyAvatar from './CompanyAvatar';
import { getActivityColors } from '../utils/colorHelpers';

interface ActivityTimelineProps {
  activities: Activity[];
  companies: Company[];
  people: Person[];
  showCompanyLinks?: boolean; // Show company when viewing person
  showPersonLinks?: boolean;  // Show person when viewing company
  onOpenActivity?: (activity: Activity) => void;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  companies,
  people,
  showCompanyLinks = false,
  showPersonLinks = false,
  onOpenActivity
}) => {
  // Icon mapper
  const iconMap = {
    CheckSquare,
    Phone,
    Calendar: CalendarIcon
  };

  // Split into pending and history
  const pendingActivities = activities
    .filter(a => !a.isCompleted)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const historyActivities = activities
    .filter(a => a.isCompleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get linked company
  const getLinkedCompany = (companyId?: string) => {
    if (!companyId) return null;
    return companies.find(c => c.id === companyId);
  };

  // Get linked person
  const getLinkedPerson = (personId?: string) => {
    if (!personId) return null;
    return people.find(p => p.id === personId);
  };

  const renderActivityItem = (activity: Activity, isLast: boolean) => {
    const config = ACTIVITY_TYPE_CONFIGS[activity.type] || {
      label: activity.type.charAt(0).toUpperCase() + activity.type.slice(1),
      icon: 'CheckSquare',
      color: 'gray'
    };
    const Icon = iconMap[config.icon as keyof typeof iconMap] || CheckSquare;
    const colors = getActivityColors(activity.type);
    const linkedCompany = getLinkedCompany(activity.linkedCompanyId);
    const linkedPerson = getLinkedPerson(activity.linkedPersonId);

    return (
      <div key={activity.id} className="relative flex gap-3 group/item">
        {/* Timeline dot and line */}
        <div className="flex flex-col items-center pt-1">
          <div className={`w-8 h-8 rounded-full ${colors.bg100} flex items-center justify-center flex-shrink-0 z-10 border ${colors.border200}`}>
            <Icon size={16} className={colors.text600} />
          </div>
          {!isLast && (
            <div className="w-0.5 bg-gray-100 flex-1 mt-1" style={{ minHeight: '20px' }} />
          )}
        </div>

        {/* Activity Content */}
        <div className="flex-1 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${colors.text600}`}>
                  {config.label}
                </span>
                <button
                  onClick={() => onOpenActivity?.(activity)}
                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate max-w-[400px]"
                >
                  {activity.title}
                </button>
                {activity.isCompleted && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                    Done
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 overflow-hidden">
                <span>{formatDate(activity.createdAt)}</span>
                {activity.dueDate && (
                  <>
                    <span>•</span>
                    <span className={!activity.isCompleted && new Date(activity.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                      Due: {formatDate(activity.dueDate)}
                    </span>
                  </>
                )}
                {showCompanyLinks && linkedCompany && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <CompanyAvatar name={linkedCompany.name} size="xs" />
                      <span className="truncate max-w-[100px]">{linkedCompany.name}</span>
                    </div>
                  </>
                )}
                {showPersonLinks && linkedPerson && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{linkedPerson.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
              {onOpenActivity && (
                <button
                  onClick={() => onOpenActivity(activity)}
                  className="p-1 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors uppercase"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="px-5 space-y-8 mt-2">
        {/* Pending Activities Section */}
        {pendingActivities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px bg-blue-100 flex-1"></div>
              <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] whitespace-nowrap">
                Pending Actions ({pendingActivities.length})
              </h4>
              <div className="h-px bg-blue-100 flex-1"></div>
            </div>
            <div className="space-y-1">
              {pendingActivities.map((activity, index) =>
                renderActivityItem(activity, index === pendingActivities.length - 1)
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px bg-gray-100 flex-1"></div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
              Activity History
            </h4>
            <div className="h-px bg-gray-100 flex-1"></div>
          </div>
          {historyActivities.length > 0 ? (
            <div className="space-y-1">
              {historyActivities.map((activity, index) =>
                renderActivityItem(activity, index === historyActivities.length - 1)
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <div className="text-gray-400 text-xs italic">
                No completed records yet.
              </div>
            </div>
          )}
        </div>

        {activities.length === 0 && (
          <div className="py-12 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
            <CheckSquare size={24} className="mx-auto text-gray-300 mb-2" />
            <div className="text-gray-400 text-sm font-medium">
              No activity records found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
