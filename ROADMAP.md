# kanbeasy

an ultra simple task organizer

## features

### shipped

- ✅ all data saved locally on device
- ✅ light/dark mode
- ✅ theme color options
  - ✅ 6 predefined themes (3 light, 3 dark)
  - ✅ centralized theme configuration
  - ✅ accent color support
- ✅ customizable columns
- ✅ ability to reorder columns with drag and drop
- ✅ drag and drop cards between columns
- ✅ draggable within a single column to sort
- ✅ minimal UI
- ✅ prefer tailwind css
- ✅ welcome text
  - ✅ when first initialized, show text to explain what kanban is, what it's good at, and how to use the application
- ✅ allow column to be resized
  - ✅ cursor to indicate resizability
  - ✅ upper limit to prevent full page column
- ✅ search cards
  - ✅ fuzzy search on card titles
  - ✅ highlight matching cards
  - ✅ display match count
- ✅ system/auto theme preference (follow OS light/dark mode)
- ✅ warn on delete column and there are cards
- ✅ initial application placeholder columns to match instructions modal on initial start
- ✅ export board data
- ✅ import board data
- ✅ column card count badges
- ✅ card timestamps (createdAt, columnHistory) to support metrics
- ✅ basic dashboard showing metrics derived from the board
  - ✅ how long a card takes to move between columns
  - ✅ time spent in each column
  - ✅ throughput and cycle time
- ✅ undo/redo for board actions
- ✅ add text labels to header icon buttons (analytics, settings) for clarity
- ✅ differentiate "Add card" button styling from cards (dashed border, muted text, "+" icon)
- ✅ hide card textarea resize handle by default, show only on hover/focus
- ✅ view toggle (switch between kanban board and read-only list view)
- ✅ card detail modal with description field and column selector
- ✅ markdown description with rendered preview (click-to-edit UX, GFM support)
- ✅ auto-select new card title text on add for quick editing
- ✅ copy and paste cards (duplicate within or across columns)
- ✅ owl assistant — toggle in settings that places an owl in the corner; clicking it gives random productivity advice, programming jokes, and owl puns
- ✅ WIP badge heat indicator — middle column card count badges progressively shift to accent color as card count rises
- ✅ auto-incrementing card numbers (`#1`, `#2`, ...) displayed on board cards, card detail modal, list view, and analytics tables
- ✅ card type field — single-select card category with colored badge; type presets (Development, Personal) and full customization in settings; combined display as `feat-42`, `fix-13`
- ✅ granular clear data controls — separate actions for clearing board, settings, or all data
- ✅ night owl mode — between 10 PM and 4 AM, the owl assistant gets sleepy eyes and tips shift to "go to bed!" style messages
- ✅ card archive (soft-delete with browse/restore)
  - ✅ auto-archive cards when deleting a column instead of permanently destroying them
- ✅ list view type column — card type displayed in list view table
- ✅ archived card analytics — archived cards included in historical metrics (cycle time, throughput, reverse time) with "(archived)" indicator in per-card tables
- ✅ UI polish pass
  - ✅ add text labels ("Board" / "List") to view mode toggle icons for clarity
  - ✅ switch default card density from "Comfortable" to "Compact" to reduce dead space
  - ✅ reorganize settings modal into collapsible sections (Appearance, Card Types, Preferences, Data)
  - ✅ collapse card type editor behind a disclosure
  - ✅ add descriptive subtitle to "Owl assistant" toggle
  - ✅ move footer credit into settings modal; remove fixed footer
  - ✅ move card density control to Appearance section
  - ✅ dynamic favicon — browser tab icon updates to reflect the active theme colors
  - ✅ move floating buttons (owl assistant, undo/redo) to bottom of page after footer removal
  - ✅ disable navigation controls (analytics, search, list view toggle, archive) when board or archive is empty
- ✅ column delete warning updated to reflect archiving behavior ("cards will be archived and can be restored later")
- ✅ default card type — allow setting a card type as the default for new cards in settings
- ✅ tooltips on all icon-only buttons for improved discoverability and accessibility
- ✅ interactive checklists in card descriptions
  - ✅ click-to-toggle checkboxes from preview mode
  - ✅ "+ Add checklist item" button for easy creation without markdown syntax
  - ✅ checklist progress bar on board cards and card detail modal
- ✅ calendar view — visualize cards with due dates on a monthly/weekly calendar
- ✅ simplified header buttons — compact header setting to hide text labels on header buttons
- ✅ due date badge on board cards — color-coded urgency indicator (red for overdue, amber for due soon, muted for further out)
- ✅ search highlighting on calendar view — highlight matching cards and show match count badge on busy days
- ✅ command palette (`Cmd+K` / `Ctrl+K`) with quick actions for adding cards, columns, switching views, and opening modals
- ✅ keyboard shortcuts toggle in Settings > Preferences (defaults to off)
- ✅ search card descriptions in addition to titles
- ✅ card detail modal field reorder — Title and Description appear first, above Column/Type/Due date
- ✅ tooltips on disabled view toggle buttons explaining why they are unavailable
- ✅ migrate to IndexedDB instead of localStorage — unified async storage backend with generous quota, enabling image attachments, multiple boards, and larger data without hitting the ~5 MB localStorage ceiling
- ✅ storage usage and persistence status display in Settings > Data

Settings

- ✅ light/dark mode
- ✅ card compactness
  - ✅ title only
  - ✅ one line of details
  - ✅ three lines of details
- ✅ turn off warnings when deleting columns with cards

### known bugs

- ~~copy/paste card does not preserve card type~~ (fixed)

### upcoming

- ability to specify column background color
- customizable icons on the lefthand side of each card
- keyboard shortcuts
  - ✅ cmd + k for command palette / quick actions
  - arrow key navigation between cards and columns
  - Enter to open card detail, Escape to close modals
- card enhancements
  - ✅ checklists/subtasks with inline progress (e.g., "3/5")
    - ✅ add checklist items within a card
    - ✅ toggle completion with checkbox
    - ✅ progress bar displayed on board card
    - reorder checklist items within a card
  - labels/tags with custom colors, filterable from search
- search enhancements
  - search by card type (filter cards by their assigned type)
  - ✅ search card descriptions in addition to titles
  - ✅ search highlighting on calendar view — highlight matching cards similar to board and list views
- due dates with reminders
  - ✅ date picker in card detail modal
  - ✅ visual overdue indicator (red badge/border) on board cards
  - ✅ upcoming due date badge (e.g., "due tomorrow") on board cards
  - optional browser notification reminders
- priority levels (none/low/medium/high)
  - colored border or badge indicator on board cards
  - priority selector in card detail modal
  - sortable/filterable by priority
- image attachments (base64 or IndexedDB for larger storage)
- pinned cards — stick important cards to the top of a column
- compact vs expanded toggle — per-card override of global density setting
- aging indicator — visual fade or badge showing how long a card has sat idle
- due date analytics — add due date metrics to the analytics modal (e.g., overdue count, on-time completion rate, average days until due)
- card view editor — customize which fields are displayed on board cards, their order, and how they render
  - field picker (toggle visibility of title, description preview, card type, due date, checklist progress, card number, timestamps, etc.)
  - drag-to-reorder field layout
  - display mode per field (e.g., badge vs inline text, icon-only vs label)
  - per-board or global preset support
- sortable table columns — click a column header to sort ascending, click again for descending, click again to reset (list view, analytics tables, archive table)
- card sorting UI (alphabetical, by date created, by last updated)
- lock columns — toggle in settings to prevent drag-and-drop reordering of columns while still allowing card movement
- column collapse/expand to save horizontal space
- column WIP limits with visual warning when exceeded
- drag to trash drop zone for card deletion
- quick add with Enter (inline input at top of column)
- limit the number of columns
- multiple boards
- saved filters/views (presets beyond search, e.g., "older than 7 days")
- swimlanes (horizontal grouping across columns by project or person)
- activity log (timeline of card movements, edits, deletions)
- localStorage usage warning — alert the user when approaching the browser's storage limit
- offline PWA (service worker + manifest for standalone install)
- print/PDF view (clean print stylesheet for standups and sharing)
- responsive design for tablets and mobile devices
  - touch-friendly drag and drop
  - mobile-optimized column layout (stacked or swipeable)
  - appropriately sized tap targets and spacing
- codebase health
  - ✅ add unit tests for `useBoardMutations.ts` — core CRUD logic (434 LOC) has no direct unit test coverage
  - ✅ add isolated unit tests for major components (`Board.tsx`, `Column.tsx`, `CardList.tsx`)
  - ✅ enable type-aware ESLint rules (`parserOptions.project`) to catch unsafe promises, optional chaining, and type-unsafe comparisons
  - ✅ consistent use of `tc` class helper — replace inline Tailwind class strings with centralized theme tokens (e.g., `CardList.tsx`)
- fun & easter eggs
  - secret card titles — typing specific card titles triggers effects (e.g., "party" makes confetti, "coffee" shows a floating coffee cup)
  - card milestone celebrations — toast/animation when hitting card count milestones (e.g., 100th card)
