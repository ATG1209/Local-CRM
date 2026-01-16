
import React, { useState } from 'react';
import { Activity, ActivityType, ACTIVITY_TYPE_CONFIGS, Company, Person } from '../types';
import { CheckSquare, Mail, Phone, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react';
import CompanyAvatar from './CompanyAvatar';

interface ActivityTimelineProps {
  activities: Activity[];
  companies: Company[];
  people: Person[];
  showCompanyLinks?: boolean; // Show company when viewing person
  showPersonLinks?: boolean;  // Show person when viewing company
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  companies,
  people,
  showCompanyLinks = false,
  showPersonLinks = false
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Icon mapper
  const iconMap = {
    CheckSquare,
    Mail,
    Phone,
    Calendar: CalendarIcon
  };

  // Filter activities
  const filteredActivities = selectedFilter === 'all'
    ? activities
    : activities.filter(a => a.type === selectedFilter);

  // Sort by createdAt descending (newest first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Toggle expansion
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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

  // Empty state
  if (sortedActivities.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <div className="text-gray-400 text-sm">
          {selectedFilter === 'all' ? 'No activities yet.' : `No ${selectedFilter}s yet.`}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filter Buttons */}
      <div className="px-5 pb-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        {Object.values(ACTIVITY_TYPE_CONFIGS).map(config => (
          <button
            key={config.type}
            onClick={() => setSelectedFilter(config.type)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedFilter === config.type
                ? `bg-${config.color}-100 text-${config.color}-700`
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="px-5 py-4 space-y-3">
        {sortedActivities.map((activity, index) => {
          const config = ACTIVITY_TYPE_CONFIGS[activity.type];
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const isExpanded = expandedIds.has(activity.id);
          const linkedCompany = getLinkedCompany(activity.linkedCompanyId);
          const linkedPerson = getLinkedPerson(activity.linkedPersonId);
          const isLast = index === sortedActivities.length - 1;

          return (
            <div key={activity.id} className="relative flex gap-3">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-8 h-8 rounded-full bg-${config.color}-100 flex items-center justify-center flex-shrink-0 z-10`}>
                  <Icon size={16} className={`text-${config.color}-600`} />
                </div>
                {!isLast && (
                  <div className="w-0.5 bg-gray-200 flex-1 mt-1" style={{ minHeight: '20px' }} />
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 pb-2">
                <button
                  onClick={() => toggleExpanded(activity.id)}
                  className="w-full text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold text-${config.color}-700`}>
                          {config.label}:
                        </span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                          {activity.title}
                        </span>
                        {activity.isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            Done
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{formatDate(activity.createdAt)}</span>
                        {activity.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {formatDate(activity.dueDate)}</span>
                          </>
                        )}
                        {showCompanyLinks && linkedCompany && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <CompanyAvatar name={linkedCompany.name} size="xs" />
                              <span>{linkedCompany.name}</span>
                            </div>
                          </>
                        )}
                        {showPersonLinks && linkedPerson && (
                          <>
                            <span>•</span>
                            <span>{linkedPerson.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                    {activity.description && (
                      <div className="text-sm text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: activity.description }} />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Assigned to:</span> {activity.assignedTo === 'you' ? 'You' : activity.assignedTo}
                      </div>
                      <div>
                        <span className="font-medium">Created by:</span> {activity.createdBy === 'you' ? 'You' : activity.createdBy}
                      </div>
                    </div>
                    {!showCompanyLinks && linkedCompany && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-medium">Company:</span>
                        <div className="flex items-center gap-1">
                          <CompanyAvatar name={linkedCompany.name} size="xs" />
                          <span className="text-gray-700">{linkedCompany.name}</span>
                        </div>
                      </div>
                    )}
                    {!showPersonLinks && linkedPerson && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-medium">Person:</span>
                        <span className="text-gray-700">{linkedPerson.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
