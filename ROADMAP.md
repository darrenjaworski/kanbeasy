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

Settings

- ✅ light/dark mode
- ✅ card compactness
  - ✅ title only
  - ✅ one line of details
  - ✅ three lines of details

### upcoming

- ✅ system/auto theme preference (follow OS light/dark mode)
- ability to specify column background color
- customizable icons on the lefthand side of each todo
- ✅ warn on delete column and there are cards
- ✅ initial application placeholder columns to match instructions modal on initial start
- keyboard shortcuts
- card enhancements
  - markdown description with rendered preview
  - checklists with inline progress (e.g., "3/5")
  - labels/tags with custom colors, filterable from search
  - due dates with visual overdue indicator
  - priority levels (none/low/medium/high) with colored border indicator
  - image attachments (base64 or IndexedDB for larger storage)
  - timestamps (createdAt, columnHistory) to support metrics
- undo/redo
- export/import board data
- column card count badges
- multiple boards
- basic dashboard showing metrics derived from the board
  - how long a card takes to move between columns
  - time spent in each column
  - throughput and cycle time

settings

- ✅ turn off warnings when deleting columns with cards
