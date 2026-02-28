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
- ✅ ticket type field — single-select card category with colored badge; type presets (Development, Personal) and full customization in settings; combined display as `feat-42`, `fix-13`
- ✅ granular clear data controls — separate actions for clearing board, settings, or all data
- ✅ night owl mode — between 10 PM and 4 AM, the owl assistant gets sleepy eyes and tips shift to "go to bed!" style messages
- ✅ card archive (soft-delete with browse/restore)
- ✅ list view type column — ticket type displayed in list view table
- ✅ archived card analytics — archived cards included in historical metrics (cycle time, throughput, reverse time) with "(archived)" indicator in per-card tables
- ✅ UI polish pass
  - ✅ add text labels ("Board" / "List") to view mode toggle icons for clarity
  - ✅ switch default card density from "Comfortable" to "Compact" to reduce dead space
  - ✅ reorganize settings modal into collapsible sections (Appearance, Ticket Types, Preferences, Data)
  - ✅ collapse ticket type editor behind a disclosure
  - ✅ add descriptive subtitle to "Owl assistant" toggle
  - ✅ move footer credit into settings modal; remove fixed footer
  - ✅ move card density control to Appearance section

Settings

- ✅ light/dark mode
- ✅ card compactness
  - ✅ title only
  - ✅ one line of details
  - ✅ three lines of details
- ✅ turn off warnings when deleting columns with cards

### known bugs

(none)

### upcoming

- revisit "warn before deleting columns with cards" — columns now archive cards instead of permanently deleting them, so the warning may be unnecessary or should be reworded
- dynamic favicon — update the browser tab icon to reflect the active theme accent color
- ability to specify column background color
- customizable icons on the lefthand side of each todo
- tooltips on all buttons for improved discoverability and accessibility
- keyboard shortcuts
- card enhancements
  - checklists with inline progress (e.g., "3/5")
  - labels/tags with custom colors, filterable from search
  - due dates with visual overdue indicator
  - priority levels (none/low/medium/high) with colored border indicator
  - image attachments (base64 or IndexedDB for larger storage)
  - pinned cards — stick important cards to the top of a column
  - compact vs expanded toggle — per-card override of global density setting
  - aging indicator — visual fade or badge showing how long a card has sat idle
- card sorting UI (alphabetical, by date created, by last updated)
- column collapse/expand to save horizontal space
- column WIP limits with visual warning when exceeded
- drag to trash drop zone for card deletion
- quick add with Enter (inline input at top of column)
- limit the number of columns
- multiple boards
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
  - secret card titles — typing specific card titles triggers effects (e.g., "party" makes confetti, "coffee" shows a floating coffee cup)
  - card milestone celebrations — toast/animation when hitting card count milestones (e.g., 100th card)
