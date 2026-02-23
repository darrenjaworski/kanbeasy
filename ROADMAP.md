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

Settings

- ✅ light/dark mode
- ✅ card compactness
  - ✅ title only
  - ✅ one line of details
  - ✅ three lines of details
- ✅ turn off warnings when deleting columns with cards

### upcoming

- ability to specify column background color
- customizable icons on the lefthand side of each todo
- tooltips on all buttons for improved discoverability and accessibility
- keyboard shortcuts
- card enhancements
  - markdown description with rendered preview
  - checklists with inline progress (e.g., "3/5")
  - labels/tags with custom colors, filterable from search
  - due dates with visual overdue indicator
  - priority levels (none/low/medium/high) with colored border indicator
  - image attachments (base64 or IndexedDB for larger storage)
  - card archive (soft-delete with browse/restore)
- card sorting UI (alphabetical, by date created, by last updated)
- column collapse/expand to save horizontal space
- column WIP limits with visual warning when exceeded
- drag to trash drop zone for card deletion
- quick add with Enter (inline input at top of column)
- limit the number of columns
- multiple boards
- view toggle (switch between kanban board and tabular/list view)
- saved filters/views (presets beyond search, e.g., "older than 7 days")
- swimlanes (horizontal grouping across columns by project or person)
- activity log (timeline of card movements, edits, deletions)
- offline PWA (service worker + manifest for standalone install)
- print/PDF view (clean print stylesheet for standups and sharing)
- responsive design for tablets and mobile devices
  - touch-friendly drag and drop
  - mobile-optimized column layout (stacked or swipeable)
  - appropriately sized tap targets and spacing
- fun & easter eggs
  - ✅ owl assistant — toggle in settings that places an owl in the corner; clicking it gives random productivity advice, programming jokes, and owl puns
  - secret card titles — typing specific card titles triggers effects (e.g., "party" makes confetti, "coffee" shows a floating coffee cup)
  - card milestone celebrations — toast/animation when hitting card count milestones (e.g., 100th card)
  - night owl mode — if the user is using the app between midnight and 5am, the owl assistant gets sleepy eyes and tips shift to "go to bed!" style messages
