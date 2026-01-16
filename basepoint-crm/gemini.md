# Local CRM - Project Context & Documentation

## 1. Project Overview
**Local CRM** is a high-fidelity, React-based frontend replica of modern CRM interfaces (inspired by Attio). It prioritizes speed, keyboard accessibility, and a clean, data-dense UI.

> [!IMPORTANT]
> **LOCAL DATA ONLY**: This project deals with highly sensitive data. It must be 100% local. No data should ever be sent to an external server. The database is a local SQLite file (`server/crm.db`).

## 2. Tech Stack
- **Framework**: React 18 (Client-side)
- **Build Tool**: Vite
- **Backend**: Node.js, Express, SQLite (sqlite3)
- **Styling**: Tailwind CSS (Utility-first) + `clsx`/`tailwind-merge`
- **Icons**: Lucide React
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Charts**: Recharts
- **Utilities**: `chrono-node` (NLP Date Parsing)

## 3. Architecture & Project Structure

### Directory Block
- `components/`: Reusable UI elements and Domain-specific views.
  - `GenericObjectView.tsx`: TThe core component for all tabular/list views. Handles sorting, filtering, resizing, and "dirty state" management.
  - `*DetailPanel.tsx`: Side panels for viewing record details (Company, Person, Task).
  - `Sidebar.tsx`: Main navigation and favorites handling.
- `server/`: Lightweight Node.js server.
  - `index.js`: API endpoints and database initialization.
  - `crm.db`: SQLite database file (git-ignored usually, but ensures local persistence).
- `utils/`:
  - `schemaApi.ts`: Frontend API calls to the local server.
  - `viewsStorage.ts`: Management of saved views (stored in localStorage or DB).

### Key Architectural Patterns
- **Dirty State Management**: Views (Sorting, Filtering) have a "dirty" state. Changes are temporary until explicitly saved via the "Save View" button. This prevents accidental permanent changes to shared views.
  - Implemented in `GenericObjectView` via `hasUnsavedChanges` state and `handleSaveChanges`.
- **Backend Sync**: Data changes (creating records, updating attributes) are immediately synced to the backend `crm.db`.
- **Attributes System**: The CRM allows dynamic schema modification. Users can add/remove "Attributes" (columns) which are stored in the `attributes` table in SQLite.

## 4. Key Components

### `GenericObjectView`
The master component for rendering data tables.
- **Features**:
  - **Dynamic Columns**: Renders both system columns and user-defined attributes.
  - **Column Resizing**: Drag handles on headers to resize columns.
  - **Filter Reordering**: Drag-and-drop interface for ordering filter rules.
  - **Bulk Actions**: Select multiple rows for bulk deletion or updates.

### `RelationPicker` & `AttributePicker`
- **RelationPicker**: A "Notion-style" multi-select component. Displays selected items horizontally with a "popover" menu for adding/removing.
- **Spark Icon**: usage of the Zap icon for "link" type attributes.

### Side Panels (`*DetailPanel`)
- Consistent design across Companies, People, and Tasks.
- **Backdrop Blur**: Uses a backdrop blur effect for a premium feel.
- **Quick Actions**: Header actions for common tasks.

## 5. Recent Changes & Progress Log

### Latest Updates (Jan 2026)
- **Renaming**: Project officially renamed to "Local CRM" (from Basepoint).
- **Sidebar Selection Fix**: Fixed visual states in the sidebar to correctly reflect the active favorite view.
- **View Management**:
  - Implemented "Dirty State" logic (unsaved changes indicator).
  - Fixed "View Menu" expansion issues.
  - Added "Add Column" capability to all views (including Tasks).
- **UI/UX Polish**:
  - **Backdrop Blur** added to side panels.
  - **Notion-Style Picker** for relations.
  - **Zap Icon** for link properties.
  - **Filter Reordering** via drag-and-drop.
  - **Column Resizing** in tables.
- **Data & Schema**:
  - Added ability to **Delete Properties**.
  - Clarified "As-I-Need" user data source (system attributes).

### Pending / Known Issues
- **White Screen on Mount**: There have been reports of white screen crashes on initial mount in some environments (likely race conditions in data fetching).
- **Pluralization**: Some typos ("Companys") were fixed, but watch out for others.

## 6. Coding Guidelines
- **Tailwind**: Use arbitrary values `w-[300px]` only when necessary. Prefer standard utility classes.
- **Typing**: Strict TypeScript interfaces in `types.ts`.
- **Modals**: Use `fixed inset-0` overlays with `backdrop-blur`.
- **Animations**: Use `animate-in fade-in zoom-in-95` for consistent entry animations.

## 7. Handover Notes
If you are taking over this project:
1.  Run `npm install` in root.
2.  Start the server: `node server/index.js`.
3.  Start the client: `npm run dev`.
4.  **Database**: The `crm.db` is the source of truth. If you reset it, you lose all data and custom schema.
5.  **Critical**: Ensure the sidebar "Favorites" logic remains synced with the current view state in `GenericObjectView`.
