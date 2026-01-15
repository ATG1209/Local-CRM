# Basepoint CRM - Developer Handover Documentation

## 1. Architecture Overview

Basepoint CRM is a Single Page Application (SPA) built with React. It currently runs entirely client-side with an in-memory "database" managed in the root component state.

### Directory Structure
```
/
├── components/         # UI Components (Views, Modals, Reusable Widgets)
├── utils/              # Helper logic (NLP parsing)
├── constants.tsx       # Mock Data (Seed data for Companies, Tasks, People)
├── types.ts            # TypeScript Interfaces (Data Models)
├── App.tsx             # Main Controller & State Holder
└── index.tsx           # Entry Point
```

## 2. Data Model & State Management

The application uses a **centralized state pattern** in `App.tsx`. This file acts as the "Single Source of Truth".

### Core Entities (`types.ts`)
1.  **Companies**: The central business entities.
2.  **People**: Contacts associated with companies.
3.  **Tasks**: Action items linked to companies or people.
4.  **Deals**: Pipeline opportunities (currently isolated in `DealsView`).

### How Data Links Together
Data linking is handled via ID references:
*   **Tasks** have a `linkedCompanyId` property that matches a `Company.id`.
*   **People** have a `companyId` property.
*   **Companies** have a `pointOfContactId` property linking back to a Person.

### Data Flow
1.  **Initialization**: `App.tsx` loads mock data from `constants.tsx` into `useState` hooks (`companies`, `tasks`, `people`).
2.  **Props Passing**: These state arrays and their setter functions (e.g., `onUpdateTask`) are passed down to child views (e.g., `TasksView`, `CompaniesView`).
3.  **Updates**: When a child component (like `TaskDetailPanel`) modifies data, it calls the passed handler, which updates the central state in `App.tsx`, causing a re-render of all dependent views. This ensures that if you change a Company name in the Company View, it updates in the Task View immediately.

## 3. Component Deep Dive

### A. Navigation & Routing
*   **Sidebar**: Controls the global `activeView` state in `App.tsx`.
*   **Custom Router**: We do not use `react-router`. `App.tsx` has a `renderContent()` switch statement that mounts/unmounts views based on `activeView`.

### B. The "Quick Task" System (`QuickTaskModal.tsx`)
This is the most complex UI component. It features:
1.  **Natural Language Processing (NLP)**:
    *   Uses `utils/taskParser.ts` (powered by `chrono-node`).
    *   Detects dates ("tomorrow at 2pm") and mentions ("@Vercel").
2.  **Highlighting Engine**:
    *   Input is a transparent `textarea`.
    *   Behind it is a `div` rendering the same text but with HTML spans wrapping the detected dates/mentions to apply colors.
    *   **Crucial**: Font settings, padding, and scrolling must be perfectly synchronized between the textarea and the background div.

### C. Smart Date Picker (`DatePickerPopover.tsx`)
A reusable component used in Quick Task, Tables, and Detail Panels.
*   **Smart Positioning**: Detects screen edges using `getBoundingClientRect`. If there isn't 350px of space below, it opens upwards.
*   **NLP Input**: Contains a text input at the top that accepts natural language (e.g., "Next Monday").

### D. Data Views (`CompaniesView`, `TasksView`, `PeopleView`)
These are dynamic tables based on a `ColumnDefinition` configuration.
*   **Dynamic Rendering**: Columns are not hardcoded. The table iterates over `visibleColumns` and uses a switch statement (`renderCellContent`) to decide how to render the data based on `column.type` (text, date, status, person, etc.).
*   **Drag & Drop**: Columns can be reordered using the HTML5 Drag and Drop API updating the `columns` state array.

### E. Detail Panels (`TaskDetailPanel`, `PersonDetailPanel`)
*   These slide in from the right (`fixed inset-y-0 right-0`).
*   They accept a selected object (Task or Person) and allow direct editing.
*   **Hyperlink Logic**: The description textareas have a custom `onPaste` handler. If you select text and paste a URL, it automatically formats it as Markdown: `[selected text](pasted_url)`.

## 4. Key Logic & Utilities

### `utils/taskParser.ts`
*   **`parseTaskInput`**: Main function.
    *   Splits text into tokens.
    *   Maps shorthands (tmr -> tomorrow).
    *   Runs `chrono` parser.
    *   Matches `@` symbols against the provided `companies` array to find links.
    *   Returns highlighting ranges and the "clean" title (text without the date string).

### `components/SearchableSelect.tsx`
*   A custom replacement for the native `<select>`.
*   Supports searching/filtering options.
*   Used for assigning Users, Companies, and Statuses.

## 5. How to Extend

### Adding a new Module
1.  Create `components/NewModuleView.tsx`.
2.  Add a new `ViewState` type in `types.ts`.
3.  Add the route in `App.tsx` switch statement.
4.  Add the navigation item in `Sidebar.tsx`.

### Connecting a Backend
1.  Replace the `useState` initialization in `App.tsx` with `useEffect` data fetching.
2.  Replace the `handleAdd...` / `handleUpdate...` functions in `App.tsx` with API calls.
3.  The rest of the UI components won't need changing as they rely on the props, not the implementation details of the storage.

## 6. Known Constraints
*   **Markdown Rendering**: While we support creating Markdown links on paste, we currently render them as raw text in the `textarea`. A full Markdown preview mode is not yet implemented.
*   **Mobile Responsiveness**: The app is optimized for Desktop/Tablet. Mobile views are partial.
