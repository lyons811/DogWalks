# Dog Walks 🐕

A single-user web application for planning and tracking dog walking routes in Honolulu, Hawaii. Draw custom routes on an interactive map, calculate metrics (distance, time, elevation), and save routes for future reference.

![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245?logo=react-router&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-Backend-F05032?logo=convex&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)

## ✨ Features

### Core Functionality
- 🗺️ **Interactive Map Drawing** - Click to add points, drag to reposition, right-click to delete
- 📏 **Route Metrics** - Automatic calculation of distance, estimated walk time, and elevation gain/loss
- 📊 **Elevation Profiles** - Visual charts showing grade changes along your route
- 💾 **Full CRUD Operations** - Create, view, edit, and delete routes with real-time sync
- ⚙️ **Configurable Walking Speed** - Adjust your pace (0.5-6.0 mph) to recalculate time estimates
- 🌙 **Dark Mode Only** - Clean, modern UI optimized for low-light viewing

### Technical Highlights
- Real-time database sync via Convex
- Client-side elevation lookup using USGS 10m DEM data for Oahu
- TypeScript throughout for type safety
- Responsive design with shadcn/ui components
- Optimized map rendering with Leaflet and React Leaflet

---

## 🛠️ Tech Stack

### Frontend
- **React Router v7** - Framework and routing
- **React 18** - UI library
- **TypeScript** - Type safety
- **shadcn/ui** - Component library (dark mode themed)
- **Tailwind CSS** - Utility-first styling
- **React Leaflet** - Map components
- **Recharts** - Elevation chart visualization
- **geotiff.js** - Client-side elevation data parsing

### Backend
- **Convex** - Real-time serverless database and backend functions

### Data
- **OpenStreetMap** - Map tiles (via Leaflet)
- **USGS 10m DEM** - Elevation data for Oahu, Hawaii

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd DogWalks
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Convex

1. **Create a Convex Account** (if you don't have one):
   - Visit [convex.dev](https://www.convex.dev/)
   - Sign up for a free account

2. **Install Convex CLI** (if not already installed):
   ```bash
   npm install -g convex
   ```

3. **Initialize Convex**:
   ```bash
   npx convex dev
   ```
   - Follow the prompts to create a new Convex project or link to an existing one
   - This will create a `.env.local` file with your `VITE_CONVEX_URL`

4. **Deploy Convex Functions**:
   ```bash
   npx convex deploy
   ```

### 4. Add Elevation Data

The app requires USGS 10m DEM elevation data for Oahu. The file should be placed in `public/`:

```
public/
└── usgs_dem_10m_oahu_29e8_fb74_0930.tif
```

**Note:** The elevation data file is not included in this repository due to size. You can:
- Download it from the Hawaii Statewide GIS Portal
- Or use your own Cloud Optimized GeoTIFF (COG) for Oahu

### 5. Start the Development Server

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR at `http://localhost:5173` |
| `npm run build` | Create production build in `build/` directory |
| `npm run start` | Start production server (after building) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint to check code quality |
| `npx convex dev` | Start Convex development mode (syncs functions) |
| `npx convex deploy` | Deploy Convex functions to production |

---

## 📂 Project Structure

```
DogWalks/
├── app/
│   ├── routes/
│   │   ├── _index.tsx              # Dashboard - route list
│   │   ├── create.tsx              # Create new route page
│   │   └── route.$id.tsx           # View/edit individual route
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── RouteMap.tsx            # Read-only map display
│   │   ├── RouteDrawingMap.tsx     # Interactive map with drawing
│   │   ├── RouteList.tsx           # Dashboard route grid
│   │   ├── RouteCard.tsx           # Individual route card
│   │   ├── RouteMetrics.tsx        # Distance, time, elevation display
│   │   ├── RouteForm.tsx           # Name and notes form
│   │   ├── ElevationChart.tsx      # Elevation profile chart
│   │   └── WalkingSpeedControl.tsx # Speed configuration slider
│   │
│   ├── lib/
│   │   ├── utils.ts                # shadcn cn() helper
│   │   ├── distance.ts             # Haversine distance calculation
│   │   ├── elevation.ts            # Elevation lookup from DEM
│   │   ├── route-calculations.ts   # Metrics calculation
│   │   ├── walking-speed.ts        # localStorage walking speed hooks
│   │   ├── format.ts               # Display formatting helpers
│   │   ├── leaflet-icons.ts        # Custom map marker icons
│   │   └── convex.ts               # Convex client setup
│   │
│   ├── types/
│   │   └── routes.ts               # Shared TypeScript types
│   │
│   └── root.tsx                    # Root layout with dark mode
│
├── convex/
│   ├── schema.ts                   # Convex database schema
│   ├── routes.ts                   # Route queries and mutations
│   └── _generated/                 # Auto-generated Convex types
│
├── public/
│   └── usgs_dem_10m_oahu_29e8_fb74_0930.tif  # Elevation data
│
├── design.md                       # Full design document
└── README.md                       # This file
```

---

## ⚙️ Configuration

### Walking Speed

The default walking speed is **3.0 mph** but can be adjusted from **0.5 to 6.0 mph** using the slider on the dashboard. Settings are persisted in `localStorage`.

### Map Settings

- **Default Center:** Honolulu, Hawaii (~21.3099° N, 157.8581° W)
- **Default Zoom:** 13
- **Map Tiles:** OpenStreetMap (free, no API key required)

### Route Validation

- Minimum 2 points required to save a route
- Route name is required
- Maximum recommended points: ~1000 (for performance)

---

## 🗄️ Database Schema (Convex)

### Routes Table

```typescript
{
  name: string,                    // Route name/title
  notes?: string,                  // Optional notes
  points: {
    lat: number,
    lng: number,
    elevation?: number             // Meters
  }[],
  distance: number,                // Meters
  estimatedTime: number,           // Minutes
  elevationGain?: number,          // Meters
  elevationLoss?: number,          // Meters
  createdAt: number,               // Timestamp
  updatedAt: number,               // Timestamp
}
```

### Convex Functions

**Queries:**
- `listRoutes()` - Get all routes (sorted by newest first)
- `getRoute(id)` - Get single route by ID

**Mutations:**
- `createRoute(data)` - Create new route
- `updateRoute(id, data)` - Update existing route
- `deleteRoute(id)` - Delete route
- `seedExampleRoutes()` - Seed demo routes (auto-runs on empty DB)

---

## 🏗️ Development Workflow

### Phase 1: Project Setup ✅
- Configured shadcn/ui with dark mode
- Set up React Router v7
- Initialized Convex

### Phase 2: Dashboard & Routing ✅
- Created Convex schema
- Built dashboard with route cards
- Implemented live queries

### Phase 3: Map Integration ✅
- Integrated Leaflet and React Leaflet
- Created interactive drawing map
- Added point editing (add/drag/delete)

### Phase 4: Save & View Routes ✅
- Implemented distance/time calculations
- Created route detail page
- Added Convex mutations for saving

### Phase 5: Elevation Integration ✅
- Loaded USGS DEM data with geotiff.js
- Added elevation lookup for route points
- Built elevation profile charts

### Phase 6: Edit, Delete & Polish ✅
- Implemented edit mode on detail page
- Added delete flow with confirmation
- Created walking speed configuration
- Polished UI/UX and error handling

---

## 🔧 Troubleshooting

### Convex Connection Issues

If you see `VITE_CONVEX_URL is not defined`:
1. Ensure you've run `npx convex dev`
2. Check that `.env.local` exists and contains `VITE_CONVEX_URL`
3. Restart your dev server after creating `.env.local`

### Elevation Data Not Loading

If elevation values are missing:
1. Verify `usgs_dem_10m_oahu_29e8_fb74_0930.tif` exists in `public/`
2. Check browser console for fetch errors
3. Ensure the file is a valid GeoTIFF with proper georeferencing

### Map Not Displaying

If the map doesn't render:
1. Check browser console for Leaflet errors
2. Ensure you have an internet connection (for OSM tiles)
3. Try clearing browser cache

---

## 🚢 Deployment

### Building for Production

```bash
npm run build
```

This creates optimized builds in the `build/` directory:
- `build/client/` - Static assets
- `build/server/` - Server-side code

### Deploy to Convex

```bash
npx convex deploy 
```

Update your production environment variables with the production Convex URL.

### Recommended Platforms

- **Vercel** (React Router SSR-ready)
- **Netlify**
- **Cloudflare Pages**
- **Railway**
- **Fly.io**

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **React Router** - Modern full-stack React framework
- **Convex** - Real-time serverless backend
- **shadcn/ui** - Beautiful component library
- **Leaflet** - Open-source mapping library
- **OpenStreetMap** - Free map data
- **USGS** - Elevation data for Hawaii

---

Built with ❤️ for dog walkers in Honolulu 🌺
