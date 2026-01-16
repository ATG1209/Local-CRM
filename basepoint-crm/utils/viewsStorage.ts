import { SavedView } from '../types';

const STORAGE_KEY = 'local_crm_views';

interface ViewsStore {
  views: SavedView[];
}

function getStore(): ViewsStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse views from localStorage', err);
  }
  return { views: [] };
}

function saveStore(store: ViewsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save views to localStorage', err);
  }
}

export function getViewsForObject(objectId: string): SavedView[] {
  const store = getStore();
  return store.views.filter(v => v.objectId === objectId);
}

export function getViewById(viewId: string): SavedView | null {
  const store = getStore();
  return store.views.find(v => v.id === viewId) || null;
}

export function saveView(view: SavedView): SavedView {
  const store = getStore();

  // If this is the first view for this object, make it default
  const existingViews = store.views.filter(v => v.objectId === view.objectId);
  if (existingViews.length === 0) {
    view.isDefault = true;
  }

  store.views.push(view);
  saveStore(store);
  return view;
}

export function updateView(viewId: string, updates: Partial<SavedView>): SavedView | null {
  const store = getStore();
  const index = store.views.findIndex(v => v.id === viewId);

  if (index === -1) return null;

  store.views[index] = { ...store.views[index], ...updates };
  saveStore(store);
  return store.views[index];
}

export function deleteView(viewId: string): boolean {
  const store = getStore();
  const index = store.views.findIndex(v => v.id === viewId);

  if (index === -1) return false;

  const deletedView = store.views[index];
  store.views.splice(index, 1);

  // If deleted view was default, make another view default
  if (deletedView.isDefault) {
    const remainingViews = store.views.filter(v => v.objectId === deletedView.objectId);
    if (remainingViews.length > 0) {
      remainingViews[0].isDefault = true;
    }
  }

  saveStore(store);
  return true;
}

export function setDefaultView(objectId: string, viewId: string): void {
  const store = getStore();

  // Remove default from all views of this object
  store.views.forEach(v => {
    if (v.objectId === objectId) {
      v.isDefault = v.id === viewId;
    }
  });

  saveStore(store);
}

export function getDefaultView(objectId: string): SavedView | null {
  const store = getStore();
  return store.views.find(v => v.objectId === objectId && v.isDefault) || null;
}

export function generateViewId(): string {
  return `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function toggleFavorite(viewId: string): SavedView | null {
  const store = getStore();
  const index = store.views.findIndex(v => v.id === viewId);

  if (index === -1) return null;

  store.views[index] = {
    ...store.views[index],
    isFavorite: !store.views[index].isFavorite
  };

  saveStore(store);
  return store.views[index];
}

export function getAllFavoriteViews(): SavedView[] {
  const store = getStore();
  return store.views.filter(v => v.isFavorite);
}
