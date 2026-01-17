import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CompaniesView from './components/CompaniesView';
const DealsView = React.lazy(() => import('./components/DealsView'));
const ReportsView = React.lazy(() => import('./components/ReportsView'));
const WorkflowsView = React.lazy(() => import('./components/WorkflowsView'));
import ActivitiesView from './components/ActivitiesView';
import PeopleView from './components/PeopleView';
const PlaceholderView = React.lazy(() => import('./components/PlaceholderView'));
import GenericObjectView from './components/GenericObjectView';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import QuickActivityModal from './components/QuickActivityModal';
import { ViewState, Company, Activity, Person, SavedView } from './types';
import { api } from './utils/api';
import { fetchObjects, ObjectType } from './utils/schemaApi';
import { getAllFavoriteViews } from './utils/viewsStorage';
import ErrorBoundary from './ErrorBoundary';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('companies');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickActivityModalOpen, setIsQuickActivityModalOpen] = useState(false);
  const [newActivityTrigger, setNewActivityTrigger] = useState(0);

  // --- Centralized Database State ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // Custom Objects State
  const [customObjects, setCustomObjects] = useState<ObjectType[]>([]);

  // Favorites State
  const [favoriteViews, setFavoriteViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | undefined>(undefined);
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);

  const normalizeActivityDates = (activity: Activity): Activity => ({
    ...activity,
    dueDate: activity.dueDate ? new Date(activity.dueDate) : null,
    createdAt: activity.createdAt ? new Date(activity.createdAt) : new Date()
  });

  const serializeActivityForApi = (activity: Activity) => ({
    ...activity,
    dueDate: activity.dueDate ? activity.dueDate.toISOString() : null,
    createdAt: activity.createdAt ? activity.createdAt.toISOString() : new Date().toISOString()
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedCompanies, fetchedActivities, fetchedPeople] = await Promise.all([
          api.get('/companies'),
          api.get('/activities'),
          api.get('/people')
        ]);

        setCompanies(Array.isArray(fetchedCompanies) ? fetchedCompanies : []);

        const activitiesArray = Array.isArray(fetchedActivities) ? fetchedActivities : [];

        try {
          const parsedActivities = activitiesArray.map((a: any) => normalizeActivityDates(a));
          setActivities(parsedActivities);
        } catch (parseErr) {
          console.error("App: Error parsing activities", parseErr);
          setActivities([]);
        }

        setPeople(Array.isArray(fetchedPeople) ? fetchedPeople : []);

      } catch (err) {
        console.error("App: Failed to load data from API:", err);
      }
    };
    fetchData();

    // Load objects separately
    loadObjects();
  }, []);

  const loadObjects = async () => {
    try {
      const objs = await fetchObjects();
      setCustomObjects(objs);
    } catch (err) {
      console.error("Failed to load objects", err);
    }
  };

  // Load favorite views
  const loadFavorites = useCallback(() => {
    const favorites = getAllFavoriteViews();
    setFavoriteViews(favorites);
  }, []);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle favorite view click from sidebar
  const handleFavoriteViewClick = useCallback((view: SavedView) => {
    // Map objectId to ViewState
    const viewStateMap: Record<string, ViewState> = {
      'obj_companies': 'companies',
      'obj_people': 'people',
      'obj_tasks': 'tasks'
    };

    const targetViewState = viewStateMap[view.objectId] || view.objectId as ViewState;
    setSelectedViewId(view.id);
    setActiveView(targetViewState);
  }, []);

  // Reset selectedViewId when activeView changes manually (not via favorite click)
  const handleViewChange = useCallback((view: ViewState) => {
    setSelectedViewId(undefined);
    setSelectedRecordId(undefined);
    setActiveView(view);
  }, []);

  // --- Database Actions ---
  const handleAddCompany = async (company: Company) => {
    setCompanies(prev => [company, ...prev]);
    try {
      await api.post('/companies', company);
    } catch (err) {
      console.error("Failed to add company", err);
    }
  };

  const handleUpdateCompany = async (updatedCompany: Company) => {
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
    try {
      await api.put(`/companies/${updatedCompany.id}`, updatedCompany);
    } catch (err) { console.error(err); }
  };

  const handleDeleteCompany = async (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    try {
      await api.delete(`/companies/${id}`);
    } catch (err) { console.error(err); }
  };

  const handleAddActivity = async (activity: Activity) => {
    const normalized = normalizeActivityDates(activity);
    setActivities(prev => [normalized, ...prev]);
    try {
      await api.post('/activities', serializeActivityForApi(normalized));
    } catch (err) { console.error(err); }
  };

  const handleUpdateActivity = async (updatedActivity: Activity) => {
    const normalized = normalizeActivityDates(updatedActivity);
    setActivities(prev => prev.map(a => a.id === normalized.id ? normalized : a));
    try {
      await api.put(`/activities/${normalized.id}`, serializeActivityForApi(normalized));
    } catch (err) { console.error(err); }
  };

  const handleDeleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await api.delete(`/activities/${id}`);
    } catch (err) { console.error(err); }
  };

  const handleAddPerson = async (person: Person) => {
    setPeople(prev => [person, ...prev]);
    try {
      await api.post('/people', person);
    } catch (err) { console.error(err); }
  };

  const handleUpdatePerson = async (updatedPerson: Person) => {
    setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
    try {
      await api.put(`/people/${updatedPerson.id}`, updatedPerson);
    } catch (err) { console.error(err); }
  };

  const handleDeletePerson = async (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    try {
      await api.delete(`/people/${id}`);
    } catch (err) { console.error(err); }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      if (e.key.toLowerCase() === 'q' && !isCommandPaletteOpen && !isQuickActivityModalOpen) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setIsQuickActivityModalOpen(true);
        }
      }

      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isQuickActivityModalOpen]);

  const customObject = customObjects.find(o => o.id === activeView);

  const renderContent = () => {
    if (customObject) {
      return (
        <ErrorBoundary>
          <GenericObjectView
            key={customObject.id}
            objectId={customObject.id}
            slug={customObject.slug}
            objectName={customObject.name}
          />
        </ErrorBoundary>
      );
    }

    switch (activeView) {
      case 'companies':
        return (
          <ErrorBoundary>
            <CompaniesView
              companies={companies}
              activities={activities}
              people={people}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              initialViewId={selectedViewId}
              initialRecordId={selectedRecordId}
              onViewFavoriteChange={loadFavorites}
            />
          </ErrorBoundary>
        );
      case 'deals':
        return (
          <ErrorBoundary>
            <DealsView />
          </ErrorBoundary>
        );
      case 'reports':
        return (
          <ErrorBoundary>
            <ReportsView />
          </ErrorBoundary>
        );
      case 'workflows':
        return (
          <ErrorBoundary>
            <WorkflowsView />
          </ErrorBoundary>
        );
      case 'tasks':
        return (
          <ErrorBoundary>
            <ActivitiesView
              activities={activities}
              companies={companies}
              people={people}
              onAddActivity={handleAddActivity}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onOpenQuickActivity={() => setIsQuickActivityModalOpen(true)}
              newActivityTrigger={newActivityTrigger}
              initialViewId={selectedViewId}
              initialRecordId={selectedRecordId}
              onViewFavoriteChange={loadFavorites}
            />
          </ErrorBoundary>
        );
      case 'people':
        return (
          <ErrorBoundary>
            <PeopleView
              people={people}
              companies={companies}
              activities={activities}
              onAddPerson={handleAddPerson}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              initialViewId={selectedViewId}
              initialRecordId={selectedRecordId}
              onViewFavoriteChange={loadFavorites}
            />
          </ErrorBoundary>
        );
      case 'notifications':
      case 'emails':
      case 'sequences':
      case 'workspaces':
      case 'partnerships':
        return (
          <ErrorBoundary>
            <PlaceholderView title={activeView.charAt(0).toUpperCase() + activeView.slice(1)} />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <CompaniesView
              companies={companies}
              activities={activities}
              people={people}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              initialViewId={selectedViewId}
              initialRecordId={selectedRecordId}
              onViewFavoriteChange={loadFavorites}
            />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden">
      <Sidebar
        activeView={activeView}
        onChangeView={handleViewChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        customObjects={customObjects}
        onObjectCreated={loadObjects}
        favoriteViews={favoriteViews}
        onFavoriteViewClick={handleFavoriteViewClick}
        activeFavoriteViewId={selectedViewId}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {!customObject && activeView !== 'workflows' && activeView !== 'reports' && activeView !== 'deals' && activeView !== 'companies' && activeView !== 'tasks' && activeView !== 'people' && (
          <TopBar activeView={activeView} />
        )}

        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">Loading view…</div>}>
          {renderContent()}
        </Suspense>
      </div>

      <ErrorBoundary>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(view, recordId) => {
            setSelectedRecordId(recordId);
            setActiveView(view);
            setIsCommandPaletteOpen(false);
          }}
          companies={companies}
          activities={activities}
          people={people}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <QuickActivityModal
          isOpen={isQuickActivityModalOpen}
          onClose={() => setIsQuickActivityModalOpen(false)}
          onAddActivity={handleAddActivity}
          companies={companies}
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
