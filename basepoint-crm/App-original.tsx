import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CompaniesView from './components/CompaniesView';
import DealsView from './components/DealsView';
import ReportsView from './components/ReportsView';
import WorkflowsView from './components/WorkflowsView';
import TasksView from './components/TasksView';
import PeopleView from './components/PeopleView';
import PlaceholderView from './components/PlaceholderView';
import GenericObjectView from './components/GenericObjectView';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import QuickTaskModal from './components/QuickTaskModal';
import { ViewState, Company, Task, Person } from './types';
import { api } from './utils/api';
import { fetchObjects, ObjectType } from './utils/schemaApi';

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

  useEffect(() => {
    const fetchData = async () => {
      console.log("App: Fetching initial data...");
      try {
        const [fetchedCompanies, fetchedTasks, fetchedPeople] = await Promise.all([
          api.get('/companies'),
          api.get('/tasks'),
          api.get('/people')
        ]);

        // Also fetch custom objects
        loadObjects();

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
          const parsedTasks = tasksArray.map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
          }));
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
  }, []);

  const loadObjects = async () => {
    try {
      const objs = await fetchObjects();
      setCustomObjects(objs);
    } catch (err) {
      console.error("Failed to load objects", err);
    }
  };

  // --- Database Actions ---
  const handleAddCompany = async (company: Company) => {
    // Optimistic update
    setCompanies(prev => [company, ...prev]);
    try {
      await api.post('/companies', company);
    } catch (err) {
      console.error("Failed to add company", err);
      // Revert if needed, implementation omitted for brevity
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
    setTasks(prev => [task, ...prev]);
    try {
      await api.post('/tasks', task);
    } catch (err) { console.error(err); }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    try {
      await api.put(`/tasks/${updatedTask.id}`, updatedTask);
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
      // Command K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // 'Q' for Quick Task (Global)
      if (e.key.toLowerCase() === 'q' && !isCommandPaletteOpen && !isQuickTaskModalOpen) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setIsQuickTaskModalOpen(true);
        }
      }

      // 'Escape' to close global modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          e.preventDefault();
        } else if (isQuickTaskModalOpen) {
          // QuickTaskModal handles its own internal Escape logic
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isQuickTaskModalOpen]);

  // Determine if active view is a custom object
  const customObject = customObjects.find(o => o.id === activeView);

  const renderContent = () => {
    if (customObject) {
      return (
        <GenericObjectView
          key={customObject.id}
          objectId={customObject.id}
          slug={customObject.slug}
          objectName={customObject.name}
        />
      );
    }

    switch (activeView) {
      case 'companies':
        return (
          <CompaniesView
            companies={companies}
            tasks={tasks}
            people={people}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        );
      case 'deals':
        return <DealsView />;
      case 'reports':
        return <ReportsView />;
      case 'workflows':
        return <WorkflowsView />;
      case 'tasks':
        return (
          <TasksView
            tasks={tasks}
            companies={companies}
            people={people}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenQuickTask={() => setIsQuickTaskModalOpen(true)}
            newTaskTrigger={newTaskTrigger}
          />
        );
      case 'people':
        return (
          <PeopleView
            people={people}
            companies={companies}
            onAddPerson={handleAddPerson}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
          />
        );
      case 'notifications':
      case 'emails':
      case 'sequences':
      case 'workspaces':
      case 'partnerships':
        return <PlaceholderView title={activeView.charAt(0).toUpperCase() + activeView.slice(1)} />;
      default:
        // Default to companies if no match? Or Placeholder?
        // Let's default to Companies as before
        return (
          <CompaniesView
            companies={companies}
            tasks={tasks}
            people={people}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden">
      <Sidebar
        activeView={activeView}
        onChangeView={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        customObjects={customObjects}
        onObjectCreated={loadObjects}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {!customObject && activeView !== 'workflows' && activeView !== 'reports' && activeView !== 'deals' && activeView !== 'companies' && activeView !== 'tasks' && activeView !== 'people' && (
          <TopBar activeView={activeView} />
        )}
        {/* Hide TopBar for Custom Objects since GenericObjectView has its own header? 
            GenericObjectView HAS a header. So hide TopBar if customObject is true. 
            Or verify TopBar design. TopBar usually shows breadcrumbs.
            GenericObjectView has "All Projects" header.
        */}

        {renderContent()}
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => { setActiveView(view); setIsCommandPaletteOpen(false); }}
        companies={companies}
        tasks={tasks}
        people={people}
      />

      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        onAddTask={handleAddTask}
        companies={companies}
      />
    </div>
  );
};

export default App;
