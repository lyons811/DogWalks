# Dog Walks - Design Document

## Project Overview

**Dog Walks** is a simple, single-user web application for planning and tracking dog walking routes in Honolulu, Hawaii. The app allows you to create routes by drawing on an interactive map, calculate route metrics (distance, estimated walk time, elevation changes), and save routes to a database for future reference.

### Core Goals
- Draw custom walking routes on an interactive map
- Calculate and display route distance, estimated walk time, and elevation profile
- Save, view, edit, and delete routes
- Simple, clean UI with dark mode only
- No authentication required (single user)

---

## Tech Stack

### Frontend
- **React Router v7** - Framework and routing (pre-scaffolded)
- **React 18+** - UI library
- **TypeScript** - Type safety
- **shadcn/ui** - Component library (dark mode only)
- **Tailwind CSS** - Styling (comes with shadcn/ui)
- **React Leaflet** - Map component library
- **OpenStreetMap** - Free map tile provider (no API key needed)
- **Leaflet Draw** or custom drawing - For route creation on map
- **geotiff.js** - For reading elevation data in browser

### Backend
- **Convex** - Real-time database and backend functions
  - No need for API setup
  - Real-time updates if needed later
  - Simple queries and mutations

### Data Sources
- **OpenStreetMap** - Free map tiles via Leaflet
- **USGS 10m DEM for Oahu** - Elevation data (download from Hawaii GIS portal or PacIOOS)

---

## File Structure

```
DogWalks/
├── app/
│   ├── routes/
│   │   ├── _index.tsx              # Dashboard - list all routes
│   │   ├── create.tsx              # Create new route page
│   │   └── route.$id.tsx           # View/edit individual route
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   │
│   │   ├── RouteMap.tsx            # Map component with Leaflet
│   │   ├── RouteDrawingMap.tsx     # Map with drawing capability
│   │   ├── RouteList.tsx           # List of saved routes (dashboard)
│   │   ├── RouteCard.tsx           # Individual route card component
│   │   ├── RouteMetrics.tsx        # Display distance, time, elevation
│   │   ├── RouteForm.tsx           # Form for route name/notes
│   │   └── ElevationChart.tsx      # Visual elevation profile chart
│   │
│   ├── lib/
│   │   ├── utils.ts                # shadcn utils (cn helper)
│   │   ├── distance.ts             # Haversine formula for lat/lng distance
│   │   ├── elevation.ts            # Elevation lookup from DEM data
│   │   ├── route-calculations.ts   # Calculate metrics (distance, time, elevation gain/loss)
│   │   └── convex.ts               # Convex client setup
│   │
│   └── root.tsx                    # Root layout (dark mode setup)
│
├── convex/
│   ├── schema.ts                   # Convex schema definitions
│   ├── routes.ts                   # Queries and mutations for routes
│   └── ...
│
├── public/
│   └── elevation/                  # Processed elevation data files
│       └── oahu-10m.tif            # or processed JSON/binary format
│
├── components.json                 # shadcn/ui config
├── tailwind.config.ts
├── react-router.config.ts
└── package.json
```

---

## Database Schema (Convex)

### Routes Table

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  routes: defineTable({
    name: v.string(),                    // Route name/title
    notes: v.optional(v.string()),       // Optional notes
    points: v.array(                     // Array of lat/lng points
      v.object({
        lat: v.float64(),
        lng: v.float64(),
        elevation: v.optional(v.float64()), // Elevation at this point (meters)
      })
    ),
    distance: v.float64(),               // Total distance in meters
    estimatedTime: v.float64(),          // Estimated time in minutes
    elevationGain: v.optional(v.float64()),  // Total elevation gain in meters
    elevationLoss: v.optional(v.float64()),  // Total elevation loss in meters
    createdAt: v.float64(),              // Timestamp
    updatedAt: v.float64(),              // Timestamp
  }),
});
```

### Convex Functions

**Queries:**
- `listRoutes()` - Get all routes (for dashboard)
- `getRoute(id)` - Get single route by ID
- `getRouteStats()` - Get aggregate stats (total routes, total distance, etc.)

**Mutations:**
- `createRoute(data)` - Create new route
- `updateRoute(id, data)` - Update existing route
- `deleteRoute(id)` - Delete route

---

## Key Features & Components

### 1. Dashboard Page (`app/routes/_index.tsx`)
- **Purpose:** Landing page showing all saved routes
- **Components:**
  - `RouteList` - Grid or list of route cards
  - `RouteCard` - Shows route name, distance, estimated time, date created
  - Button to navigate to "Create Route" page
- **State:**
  - Empty state: "No routes yet" message with CTA to create first route
  - Populated state: Grid of route cards
  - Each card clickable → navigates to route detail page

### 2. Create Route Page (`app/routes/create.tsx`)
- **Purpose:** Draw a new route on the map and save it
- **Components:**
  - `RouteDrawingMap` - Leaflet map with drawing controls
  - `RouteForm` - Input for name and notes
  - `RouteMetrics` - Real-time display of distance, time, elevation as you draw
  - Save button (disabled until route has at least 2 points)
- **Flow:**
  1. User clicks on map to add points (builds route path)
  2. Metrics calculate in real-time as points are added
  3. User fills in name and optional notes
  4. Click "Save Route" → creates route in Convex
  5. Redirect to dashboard or route detail page

### 3. Route Detail Page (`app/routes/route.$id.tsx`)
- **Purpose:** View and edit existing route
- **Components:**
  - `RouteMap` - Display route on map (read-only by default)
  - `RouteMetrics` - Show calculated metrics
  - `RouteForm` - Editable name and notes
  - `ElevationChart` - Visual chart of elevation profile
  - Edit mode toggle button
  - Delete button
- **Modes:**
  - **View mode:** Route displayed on map, metrics shown, can't edit points
  - **Edit mode:** Can modify route points, recalculates metrics, can save changes
- **Flow:**
  - Load route from Convex by ID
  - Display on map with metrics
  - Edit button → enable point editing
  - Save changes → update route in Convex
  - Delete button → confirm modal → delete from Convex → redirect to dashboard

### 4. Map Components

**RouteMap.tsx (View-only)**
- Displays a route on the map using Leaflet
- Shows route path as polyline
- Markers at start/end points
- No editing capability
- Props: `points`, `zoom`, `center`

**RouteDrawingMap.tsx (Interactive)**
- All features of RouteMap
- Click to add points to route
- Drag to reposition points
- Click point to remove it
- Visual feedback for active drawing
- Emits events when route changes
- Props: `initialPoints`, `onChange`, `onPointsChange`

### 5. Metrics Calculation

**Distance Calculation:**
- Use Haversine formula to calculate distance between consecutive lat/lng points
- Sum all segments to get total distance
- Convert to miles or kilometers (default miles)

**Time Estimation:**
- Configurable walking speed (default: 3 mph)
- Settings stored in localStorage or component state
- Formula: `time = distance / speed`
- Display in minutes or hours:minutes format

**Elevation Calculation:**
- Lookup elevation for each point from DEM data
- Calculate cumulative gain and loss between consecutive points
- Store with route for quick display
- Generate elevation profile data for charting

---

## Elevation Data Strategy

### Data Source
- **USGS 10-meter DEM for Oahu**
- Download from: Hawaii Statewide GIS Portal (planning.hawaii.gov/gis) or PacIOOS

### Processing Steps
1. **Download:** Get GeoTIFF file covering Oahu
2. **Process:**
   - Option A: Convert to smaller tile format (Cloud Optimized GeoTIFF - COG)
   - Option B: Convert to simplified JSON grid for browser (lower resolution but faster)
   - Option C: Use geotiff.js to read GeoTIFF directly in browser
3. **Store:** Place processed files in `public/elevation/` folder
4. **Integration:** Create elevation lookup utility that:
   - Takes lat/lng coordinates
   - Queries DEM data at that location
   - Returns elevation in meters
   - Handles edge cases (out of bounds, water, etc.)

### Implementation Notes
- **Recommended approach:** Use geotiff.js to load a Cloud Optimized GeoTIFF
- Lazy load elevation data only when needed (drawing routes)
- Cache elevation lookups to avoid repeated calculations
- Consider decimating route points for elevation lookup (don't need elevation for every pixel)
- Fallback: If point is out of bounds or in ocean, return 0 or null

---

## Development Phases

### Phase 1: Project Setup & Foundations ✅ COMPLETED
**Goal:** Configure shadcn/ui, dark mode, basic layout structure

**Tasks:**
- ✅ Install and configure shadcn/ui with dark mode
- ✅ Update root layout for dark mode (remove light mode toggle)
- ✅ Install necessary dependencies (react-leaflet, leaflet, convex, etc.)
- ✅ Set up Convex project and connect to app
- ✅ Configure Tailwind CSS for dark mode only
- ✅ Create basic page layouts (dashboard, create, detail)

**Deliverables:**
- ✅ Dark mode themed app shell
- ✅ Navigation structure in place
- ✅ Convex connected and ready

**Completion Notes:**
- Installed react-leaflet, leaflet, @types/leaflet, geotiff, recharts
- Added shadcn/ui components: card, input, textarea, label, button
- Configured dark mode by adding `className="dark"` to root `<html>` element
- Created three route files: `_index.tsx` (dashboard), `create.tsx`, `route.$id.tsx`
- Updated `routes.ts` with proper routing configuration

---

### Phase 2: Dashboard & Basic Routing ✅ COMPLETED
**Goal:** Create dashboard page with route listing

**Tasks:**
- ✅ Implement Convex schema for routes
- ✅ Create `listRoutes` query in Convex
- ✅ Build `RouteList` component for dashboard
- ✅ Build `RouteCard` component
- ✅ Handle empty state ("No routes yet")
- ✅ Add "Create Route" navigation button
- ✅ Style with shadcn/ui cards and layout

**Deliverables:**
- ✅ Functional dashboard showing routes (or empty state)
- ✅ Navigation to create page works
- ✅ Routes fetched from Convex in real-time

**Completion Notes:**
- Added `convex/schema.ts` with routes table definition and indexed createdAt field
- Implemented `listRoutes` query and `seedExampleRoutes` mutation in `convex/routes.ts`
- Wrapped app with `ConvexProvider` (`app/root.tsx`) and created shared client (`app/lib/convex.ts`)
- Dashboard loader now seeds demo routes when empty and hydrates via `useQuery` (`app/routes/_index.tsx`)
- Built reusable `RouteCard` and `RouteList` components with formatted metrics (`app/components`)
- Added shared TypeScript types for route summaries (`app/types/routes.ts`)

---

### Phase 3: Map Integration & Route Drawing ✅ COMPLETED
**Goal:** Interactive map with route drawing capability

**Tasks:**
- ✅ Install and configure react-leaflet
- ✅ Create basic `RouteMap` component with OpenStreetMap tiles
- ✅ Build `RouteDrawingMap` with click-to-add-points functionality
- ✅ Implement point editing (drag, delete)
- ✅ Add visual styling for route polyline
- ✅ Add start/end markers
- ✅ Create "Create Route" page with map
- ✅ Implement route point state management

**Deliverables:**
- ✅ Working map on create page
- ✅ Can draw routes by clicking
- ✅ Can edit points by dragging
- ✅ Route path displays correctly
- ✅ Points stored in local state

**Completion Notes:**
- Added `RouteMap` with dynamic Leaflet loading, dark theme styling, and tile configuration.
- Built `RouteDrawingMap` to support add/drag/remove points with numbered start/end markers and instructional overlay.
- Integrated the drawing experience into `app/routes/create.tsx` with local state, clear/reset action, and live placeholder metrics.
- Extended `app/app.css` for Leaflet dark mode controls and custom marker visuals.
- Updated lint/typecheck compliance, replacing imperative map fitting with declarative bounds props.

---

### Phase 4: Save & View Routes
**Goal:** Persist routes to Convex and view them

**Tasks:**
- Create `RouteForm` component (name, notes inputs)
- Implement distance calculation (Haversine formula)
- Implement time estimation (configurable speed)
- Create `RouteMetrics` component
- Implement `createRoute` mutation in Convex
- Connect create page to save route
- Build route detail page (`route.$id.tsx`)
- Implement `getRoute` query in Convex
- Display route on detail page with read-only map
- Show route metrics on detail page

**Deliverables:**
- Can create and save routes
- Routes appear on dashboard after creation
- Can view individual route details
- Distance and time calculated correctly

---

### Phase 5: Elevation Integration
**Goal:** Add elevation data and elevation profiles

**Tasks:**
- Download USGS Oahu DEM data
- Process DEM into usable format (GeoTIFF with geotiff.js recommended)
- Place elevation data in public folder
- Create elevation lookup utility
- Integrate elevation lookup when adding route points
- Calculate elevation gain and loss
- Build `ElevationChart` component (simple line chart)
- Add elevation metrics to `RouteMetrics`
- Update Convex schema to store elevation data with points
- Display elevation chart on route detail page

**Deliverables:**
- Elevation data available in app
- Routes capture elevation at each point
- Elevation gain/loss calculated
- Visual elevation profile chart displays

---

### Phase 6: Edit, Delete & Polish
**Goal:** Full CRUD operations and UI refinement

**Tasks:**
- Add edit mode to route detail page
- Enable point editing on detail page map
- Implement `updateRoute` mutation in Convex
- Add save changes button (only in edit mode)
- Implement `deleteRoute` mutation in Convex
- Add delete button with confirmation modal
- Add walking speed configuration (localStorage or settings)
- Polish UI/UX (transitions, loading states, error handling)
- Add timestamps display (created date)
- Implement route sorting on dashboard (newest first)
- Optimize performance (memoization, lazy loading)
- Add helpful tooltips and instructions

**Deliverables:**
- Can edit existing routes
- Can delete routes with confirmation
- Walking speed configurable
- Clean, polished UI
- All features working smoothly
- Error states handled gracefully

---

## Additional Considerations

### Walking Speed Configuration
- Store in localStorage: `walkingSpeed` (default 3 mph)
- Provide UI control (slider or input) on dashboard or settings area
- Recalculate time estimate when speed changes
- Display current speed setting in metrics display

### Distance Units
- Default: miles (imperial)
- Could add toggle for kilometers if desired
- Apply conversion factor in display layer only

### Map Centering
- Default center: Honolulu coordinates (~21.3099° N, 157.8581° W)
- Default zoom level: ~12 (shows city)
- When viewing route: auto-fit bounds to route points

### Route Validation
- Minimum 2 points required to save route
- Maximum points? (consider performance, maybe 500-1000 points max)
- Prevent saving routes with no name

### Error Handling
- Convex connection errors
- Elevation data not loading
- Invalid route data
- User-friendly error messages with shadcn/ui Toast or Alert components

### Performance Optimization
- Debounce map interactions
- Memoize distance/elevation calculations
- Lazy load elevation data
- Virtualize route list if many routes (unlikely for single user)
- Use React.memo for map components

### Future Enhancements (Out of Scope)
- Export routes to GPX
- Import routes from GPX
- Multiple users with auth
- Route sharing
- Photos attached to routes
- Weather integration
- Route recommendations
- Mobile app version

---

## Success Criteria

The app is complete when:
1. ✅ User can draw a route on a map by clicking points
2. ✅ Route distance is calculated and displayed
3. ✅ Estimated walk time is shown (based on configurable speed)
4. ✅ Elevation gain/loss is calculated and displayed
5. ✅ Elevation profile chart is shown
6. ✅ Routes can be saved with name and notes
7. ✅ Dashboard shows all saved routes
8. ✅ Routes can be viewed individually
9. ✅ Routes can be edited (points, name, notes)
10. ✅ Routes can be deleted
11. ✅ UI is clean, dark mode themed, and uses shadcn/ui components
12. ✅ All data persists in Convex database

---

## Getting Started (for Implementation)

1. **Phase 1:** Begin with shadcn/ui setup and dark mode configuration
2. **Phase 2:** Build out the Convex schema and dashboard with mock data
3. **Phase 3:** Integrate Leaflet and get basic map rendering working
4. **Phase 4:** Implement route drawing and saving
5. **Phase 5:** Add elevation data integration
6. **Phase 6:** Complete CRUD operations and polish

Each phase builds on the previous, allowing for incremental testing and validation. Focus on getting each phase working fully before moving to the next.
