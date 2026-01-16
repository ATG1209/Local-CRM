# Local CRM - Project Context & Guidelines

## 1. Project Overview
Local CRM is a high-fidelity, React-based frontend replica of modern CRM interfaces (specifically inspired by Attio). It focuses on speed, keyboard accessibility, and a clean, data-dense UI.

> [!IMPORTANT]
> **LOCAL DATA ONLY**: This project deals with highly sensitive data. It must be 100% local. No data should ever be sent to an external server. The database is a local SQLite file.


## 2. Tech Stack
- **Framework**: React 19 (Client-side)
- **Backend**: Node.js, Express, SQLite
- **Styling**: Tailwind CSS (Utility-first)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Utilities**: `chrono-node` (NLP Date Parsing)

## 3. Coding Guidelines

### General
- **Structure**: Flat component structure where possible. Reusable UI elements go in `components/`.
- **State Management**: Centralized in `App.tsx` and synced with the local backend via `utils/api.ts`.
- **TypeScript**: Strict typing using interfaces defined in `types.ts`.
- **Server Deployment**: Always ensure the backend server is deployed and running after making any logic or database changes.

### Styling (Tailwind)
- Use arbitrary values `w-[300px]` only when precise pixel perfection is required to match the reference design.
- Use `inter` font family.
- Custom scrollbars are defined in `index.html`.

### UI Patterns
- **Modals/Popovers**: Use `fixed inset-0` overlays with `backdrop-blur`.
- **Animations**: Use `animate-in fade-in zoom-in-95` for snappy entry animations.
- **Inputs**: Remove default outlines (`outline-none`) and use custom focus rings or borders.
- **Tables**: specific column definitions found in View components (`CompaniesView`, `TasksView`).

### Detail Panel Standards
- **Width**: Standard width is `520px` for all detail panels.
- **Header**: Compact header with icon, title, and quick attributes.
- **Properties Section**:
  - Uses `RelationPicker` for multi-select relations (e.g. "Point of Contact").
  - **Visibility**: Hovering a property row shows:
    - Settings icon (left of action group)
    - Hide eye-off icon (right of action group)
  - **Action Column**: Right-aligned, fixed width column for action icons.
  - **Hidden Properties**: Collapsible section at the bottom for hidden fields.

## 4. Key Components

### `QuickTaskModal`
- Uses a "dual-layer" technique: A transparent `textarea` sits perfectly on top of a `div` that renders the highlighted text (colors for dates/mentions).
- NLP parsing logic resides in `utils/taskParser.ts`.

### `DatePickerPopover`
- Smart positioning (flips top/bottom based on viewport space).
- Supports NLP text input (e.g., "next friday").

## 5. Future Development
- **Hyperlinks**: Textareas support "Paste URL over text" to create Markdown links `[text](url)`.
- **Data Persistence**: Implemented. Uses a local SQLite database (`server/crm.db`) via an Express API.
