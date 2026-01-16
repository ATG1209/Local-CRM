import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CompaniesView from './components/CompaniesView';
const DealsView = React.lazy(() => import('./components/DealsView'));
const ReportsView = React.lazy(() => import('./components/ReportsView'));
const WorkflowsView = React.lazy(() => import('./components/WorkflowsView'));
import TasksView from './components/TasksView';
import PeopleView from './components/PeopleView';
const PlaceholderView = React.lazy(() => import('./components/PlaceholderView'));
import GenericObjectView from './components/GenericObjectView';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import QuickTaskModal from './components/QuickTaskModal';
import { ViewState, Company, Task, Person, SavedView } from './types';
import { api } from './utils/api';
import { fetchObjects, ObjectType } from './utils/schemaApi';
import { getAllFavoriteViews } from './utils/viewsStorage';
import ErrorBoundary from './ErrorBoundary';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('companies');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [newTaskTrigger, setNewTaskTrigger] = useState(0);

  // --- Centralized Database State ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // Custom Objects State
  const [customObjects, setCustomObjects] = useState<ObjectType[]>([]);

  // Favorites State
  const [favoriteViews, setFavoriteViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | undefined>(undefined);

  const normalizeTaskDates = (task: Task): Task => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date()
  });

  const serializeTaskForApi = (task: Task) => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt ? task.createdAt.toISOString() : new Date().toISOString()
  });

  useEffect(() => {
    const fetchData = async () => {
      console.log("App: Fetching initial data...");
      try {
        const [fetchedCompanies, fetchedTasks, fetchedPeople] = await Promise.all([
          api.get('/companies'),
          api.get('/tasks'),
          api.get('/people')
        ]);

        console.log("App: Raw data received", { fetchedCompanies, fetchedTasks, fetchedPeople });

        if (Array.isArray(fetchedCompanies)) {
          setCompanies(fetchedCompanies);
        } else {
          console.warn("App: fetchedCompanies is not an array", fetchedCompanies);
          setCompanies([]);
        }

        const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];
        if (!Array.isArray(fetchedTasks)) {
          console.warn("App: fetchedTasks is not an array", fetchedTasks);
        }

        try {
          const parsedTasks = tasksArray.map((t: any) => normalizeTaskDates(t));
          setTasks(parsedTasks);
        } catch (parseErr) {
          console.error("App: Error parsing tasks", parseErr);
          setTasks([]);
        }

        if (Array.isArray(fetchedPeople)) {
          setPeople(fetchedPeople);
        } else {
          console.warn("App: fetchedPeople is not an array", fetchedPeople);
          setPeople([]);
        }

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

  const handleAddTask = async (task: Task) => {
    const normalized = normalizeTaskDates(task);
    setTasks(prev => [normalized, ...prev]);
    try {
      await api.post('/tasks', serializeTaskForApi(normalized));
    } catch (err) { console.error(err); }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const normalized = normalizeTaskDates(updatedTask);
    setTasks(prev => prev.map(t => t.id === normalized.id ? normalized : t));
    try {
      await api.put(`/tasks/${normalized.id}`, serializeTaskForApi(normalized));
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
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

      if (e.key.toLowerCase() === 'q' && !isCommandPaletteOpen && !isQuickTaskModalOpen) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setIsQuickTaskModalOpen(true);
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
  }, [isCommandPaletteOpen, isQuickTaskModalOpen]);

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
              tasks={tasks}
              people={people}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              initialViewId={selectedViewId}
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
            <TasksView
              tasks={tasks}
              companies={companies}
              people={people}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onOpenQuickTask={() => setIsQuickTaskModalOpen(true)}
              newTaskTrigger={newTaskTrigger}
              initialViewId={selectedViewId}
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
              onAddPerson={handleAddPerson}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              initialViewId={selectedViewId}
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
              tasks={tasks}
              people={people}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              initialViewId={selectedViewId}
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
          onNavigate={(view) => { setActiveView(view); setIsCommandPaletteOpen(false); }}
          companies={companies}
          tasks={tasks}
          people={people}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <QuickTaskModal
          isOpen={isQuickTaskModalOpen}
          onClose={() => setIsQuickTaskModalOpen(false)}
          onAddTask={handleAddTask}
          companies={companies}
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
