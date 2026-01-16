import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SavedView } from '../types';
import { pluralize } from '../utils/attributeHelpers';
import {
  ChevronDown,
  LayoutList,
  Columns3,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Star,
  RotateCcw
} from 'lucide-react';

interface ViewSelectorProps {
  objectName: string;
  currentView: SavedView | null;
  views: SavedView[];
  onViewChange: (view: SavedView) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
  onRenameView: (viewId: string, newName: string) => void;
  onResetView?: (viewId: string) => void;
  onToggleFavorite?: (viewId: string) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({
  objectName,
  currentView,
  views,
  onViewChange,
  onCreateView,
  onDeleteView,
  onRenameView,
  onResetView,
  onToggleFavorite
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenuViewId, setContextMenuViewId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the main view selector dropdown
      const isOutsideMain = containerRef.current && !containerRef.current.contains(event.target as Node);

      // We also need to check if the click is on the portal menu, but typically 
      // specific menu item clicks handle their own closing.
      // However, clicking completely outside both should close everything.
      // For now, if we click outside the main container, we close the main dropdown.
      if (isOutsideMain) {
        // Only close main dropdown if likely intended. 
        // Note: The portal menu is technically "outside" the container ref.
        // So clicking the menu would trigger this if we aren't careful.
        // But the menu items have e.stopPropagation().

        // Simpler approach: let the menu items close themselves, 
        // and global click closes things if they aren't handled.
        // But we need to distinguish between clicking the Menu and clicking the Page.

        // Actually, existing logic:
        // if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        //   setIsOpen(false); ...
        // }
        // requires update because the Portal is outside containerRef.

        // Let's add a check for the menu element if possible, or just rely on the fact that
        // clicking the menu items runs their handlers.
        // We will assign an ID or ref to the portal menu to check against.
      }
    };

    const handleGlobalClick = (event: MouseEvent) => {
      // If clicking outside container, close main dropdown
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Check if we are clicking inside the context menu
        const menuEl = document.getElementById('view-context-menu');
        if (menuEl && menuEl.contains(event.target as Node)) {
          return;
        }

        setIsOpen(false);
        setSearchTerm('');
        setContextMenuViewId(null);
        setEditingViewId(null);
      } else {
        // Clicked inside container.
        // If we have an open context menu, close it unless we clicked the trigger
        // The trigger has e.stopPropagation, so this listener might not even catch it if verified.
        // But 'mousedown' on document captures everything usually.

        // Actually, if we click inside the main dropdown but NOT on the 'more' button or the menu,
        // we probably want to keep the main dropdown open but close the context menu?
        // Existing behavior: clicking inside doesn't close main dropdown (good).

        // To auto-close the context menu when clicking elsewhere in the dropdown:
        const menuEl = document.getElementById('view-context-menu');
        if (menuEl && !menuEl.contains(event.target as Node)) {
          // If the click target wasn't the trigger button...
          // Ideally we identify the trigger button.
          // But simplified: just let the user toggle it off or click outside.
          // We'll trust the explicit setContextMenuViewId(null) calls for now.
          // But better UX: close context menu on any click that isn't inside it.
          setContextMenuViewId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (editingViewId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingViewId]);

  const filteredViews = views.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (view: SavedView) => {
    setEditingViewId(view.id);
    setEditName(view.name);
    setContextMenuViewId(null);
  };

  const handleSaveRename = () => {
    if (editingViewId && editName.trim()) {
      onRenameView(editingViewId, editName.trim());
    }
    setEditingViewId(null);
    setEditName('');
  };

  const handleCancelRename = () => {
    setEditingViewId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const getViewIcon = (type: 'table' | 'kanban') => {
    return type === 'kanban' ? (
      <Columns3 size={14} className="text-orange-500" />
    ) : (
      <LayoutList size={14} className="text-green-500" />
    );
  };

  const displayName = currentView?.name || `All ${pluralize(objectName)}`;
  const displayIcon = currentView ? getViewIcon(currentView.type) : <LayoutList size={14} className="text-green-500" />;

  const activeContextMenuView = views.find(v => v.id === contextMenuViewId);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isOpen
          ? 'bg-gray-100 text-gray-900'
          : 'hover:bg-gray-50 text-gray-700'
          }`}
      >
        {displayIcon}
        <span>{displayName}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search views..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Views List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredViews.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">
                No views found
              </div>
            ) : (
              filteredViews.map(view => (
                <div
                  key={view.id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${currentView?.id === view.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  onClick={() => {
                    if (editingViewId !== view.id) {
                      onViewChange(view);
                      setIsOpen(false);
                    }
                  }}
                >
                  {getViewIcon(view.type)}

                  {editingViewId === view.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 text-sm px-1 py-0.5 border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveRename(); }}
                        className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelRename(); }}
                        className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate">{view.name}</span>
                      {view.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                          Default
                        </span>
                      )}
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(view.id);
                          }}
                          className={`p-1 rounded transition-all ${view.isFavorite
                            ? 'text-yellow-500 opacity-100'
                            : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-500'
                            }`}
                          title={view.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star size={14} className={view.isFavorite ? 'fill-yellow-500' : ''} />
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            // Position menu aligned with the right of the button, but shifted left by menu width (w-32=128px)
                            // or just slightly left.
                            // Let's try to align top-left of menu to bottom-left of button, 
                            // but ensuring it doesn't go off screen?
                            // Logic: right-0 usually means right edge aligns with right edge of container.
                            // e.currentTarget is the button.

                            // Align right edge of menu to right edge of button
                            setMenuPosition({
                              top: rect.bottom,
                              left: rect.right - 128 // 128px is w-32
                            });
                            setContextMenuViewId(contextMenuViewId === view.id ? null : view.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
                        >
                          <MoreHorizontal size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create New View */}
          <div className="border-t border-gray-100 p-1">
            <button
              onClick={() => {
                onCreateView();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Plus size={14} />
              Create new view
            </button>
          </div>
        </div>
      )}

      {/* Portal for Context Menu */}
      {contextMenuViewId && activeContextMenuView && menuPosition && createPortal(
        <div
          id="view-context-menu"
          className="fixed w-32 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] py-1"
          style={{
            top: menuPosition.top,
            left: menuPosition.left
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartRename(activeContextMenuView);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={12} />
            Rename
          </button>
          {!activeContextMenuView.isDefault ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteView(activeContextMenuView.id);
                setContextMenuViewId(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={12} />
              Delete
            </button>
          ) : onResetView ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetView(activeContextMenuView.id);
                setContextMenuViewId(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ViewSelector;
