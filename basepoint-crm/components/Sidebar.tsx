import React, { useState } from 'react';
import {
  Bell,
  CheckSquare,
  BarChart2,
  Workflow,
  Send,
  Layout,
  Briefcase,
  Users,
  Grid,
  ChevronDown,
  Command,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Database,
  LayoutList,
  Columns3,
  Star
} from 'lucide-react';
import { ViewState, SavedView } from '../types';
import { ObjectType } from '../utils/schemaApi';
import CreateDatabaseModal from './CreateDatabaseModal';

interface SidebarProps {
  activeView: ViewState;
  onChangeView: (view: ViewState) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  customObjects: ObjectType[];
  onObjectCreated: () => void;
  favoriteViews?: SavedView[];
  onFavoriteViewClick?: (view: SavedView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onChangeView,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  customObjects,
  onObjectCreated,
  favoriteViews = [],
  onFavoriteViewClick
}) => {
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false);

  // Filter out system objects as they are hardcoded in the list
  const displayedCustomObjects = customObjects.filter(o => !['obj_companies', 'obj_people', 'obj_tasks', 'obj_deals'].includes(o.id));

  const navItemClass = (isActive: boolean) =>
    `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${isActive
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const handleDbCreated = (newObj: ObjectType) => {
    onObjectCreated();
    onChangeView(newObj.id as ViewState);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ease-in-out relative`}>
      <CreateDatabaseModal
        isOpen={isCreateDbOpen}
        onClose={() => setIsCreateDbOpen(false)}
        onCreated={handleDbCreated}
      />

      {/* Header */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-gray-100 transition-all`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded overflow-hidden">
            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 border-2 border-white rounded-full"></div>
            </div>
            <span className="font-semibold text-gray-800 text-sm truncate">Local CRM</span>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </div>
        )}
        <div
          onClick={onToggleCollapse}
          className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

        {/* Quick Actions */}
        <div className="space-y-1">
          <div
            onClick={onOpenCommandPalette}
            className={`flex items-center gap-2 ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-1.5 text-gray-500 text-sm hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-all`}
            title="Quick actions (Cmd+K)"
          >
            {isCollapsed ? (
              <Search size={16} />
            ) : (
              <>
                <Command size={14} />
                <span className="flex-1 truncate">Quick actions</span>
                <div className="flex gap-1">
                  <span className="bg-gray-100 px-1.5 rounded text-[10px] border border-gray-200">⌘K</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Nav */}
        <div className="space-y-0.5">
          <div className={navItemClass(activeView === 'notifications')} onClick={() => onChangeView('notifications')} title="Notifications">
            <Bell size={16} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed && "Notifications"}
          </div>
          {/* Emails removed as requested */}
          <div className={navItemClass(activeView === 'reports')} onClick={() => onChangeView('reports')} title="Reports">
            <BarChart2 size={16} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed && "Reports"}
          </div>
          <div className={navItemClass(activeView === 'workflows')} onClick={() => onChangeView('workflows')} title="Workflows">
            <Workflow size={16} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed && "Workflows"}
          </div>
          <div className={navItemClass(activeView === 'sequences')} onClick={() => onChangeView('sequences')} title="Sequences">
            <Send size={16} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed && "Sequences"}
          </div>
        </div>

        {/* Favorite Views */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center px-2 text-xs font-medium text-gray-500 mb-2">
              <Star size={12} className="mr-1" />
              <span className="flex-1 truncate">Favorites</span>
            </div>
          )}
          <div className="space-y-0.5">
            {favoriteViews.length === 0 ? (
              !isCollapsed && (
                <div className="px-2 py-2 text-xs text-gray-400 italic">
                  Star views to add them here
                </div>
              )
            ) : (
              favoriteViews.map(view => {
                const objectIconColor = view.objectId === 'obj_companies' ? 'text-blue-500' :
                  view.objectId === 'obj_people' ? 'text-sky-500' :
                    view.objectId === 'obj_tasks' ? 'text-emerald-500' : 'text-purple-500';
                const ViewIcon = view.type === 'kanban' ? Columns3 : LayoutList;

                return (
                  <div
                    key={view.id}
                    className={navItemClass(false)}
                    onClick={() => onFavoriteViewClick?.(view)}
                    title={view.name}
                  >
                    <ViewIcon size={16} className={`${objectIconColor} ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span className="truncate">{view.name}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Records (Databases) */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 text-xs font-medium text-gray-500 mb-2 group">
              <div className="flex items-center gap-1">
                <span>Databases</span>
                <ChevronDown size={12} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsCreateDbOpen(true); }}
                className="opacity-0 group-hover:opacity-100 hover:bg-gray-100 p-0.5 rounded transition-all text-gray-600"
                title="Create new database"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
          <div className="space-y-0.5">
            <div className={navItemClass(activeView === 'companies')} onClick={() => onChangeView('companies')} title="Companies">
              <Briefcase size={16} className={`text-blue-500 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "Companies"}
            </div>
            <div className={navItemClass(activeView === 'people')} onClick={() => onChangeView('people')} title="People">
              <Users size={16} className={`text-sky-500 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "People"}
            </div>
            <div className={navItemClass(activeView === 'tasks')} onClick={() => onChangeView('tasks')} title="Tasks">
              <CheckSquare size={16} className={`text-emerald-500 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "Tasks"}
            </div>

            {/* Custom Objects */}
            {displayedCustomObjects.map(obj => (
              <div
                key={obj.id}
                className={navItemClass(activeView === obj.id as ViewState)}
                onClick={() => onChangeView(obj.id as ViewState)}
                title={obj.name}
              >
                <Database size={16} className={`text-purple-500 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && obj.name}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
