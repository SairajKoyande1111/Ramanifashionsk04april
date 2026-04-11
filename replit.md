# Ramani Fashion E-Commerce Platform

## Project Overview
Full-stack e-commerce platform for Ramani Fashion, a saree retailer. Built with Express.js backend, React/Vite frontend, MongoDB database, integrated with PhonePe payment gateway, Shiprocket shipping, and WhatsApp-based OTP authentication.

## Current State (April 11, 2026)

### Replit Migration Notes
- Project is preserved as an Express.js backend with React/Vite frontend.
- Development workflow runs `npm run dev` on port 5000 for the Replit web preview.
- Production deployment is configured to build with `npm run build` and start the bundled server from `dist/index.js`.
- Vite is served through the Express server in development with host allowances for Replit's preview proxy.

## Previous State (December 1, 2025)

### ✅ Recently Completed Features

#### 1. Color Filter Resolution
- **Issue Resolved**: Fixed color filter to work correctly at database level
- **Implementation**: MongoDB aggregation pipeline using `$filter` operator on `colorVariants` array
- **Result**: When users select a color (e.g., "Red"), only products with that color variant display - no mixing of unrelated color variants
- **Files Modified**: `server/routes.ts` (GET /api/products endpoint with aggregation pipeline)

#### 2. Admin "Update Images" Feature - FULLY IMPLEMENTED
- **Purpose**: Allows admin users to upload and update homepage media directly
- **Uploads Available**:
  - Hero banner image (full-width top banner)
  - Ramani-banner image (central branding section)
  - Promotional video
- **Features**:
  - File upload validation (format & size checking)
  - File preview before upload
  - Dimension recommendations to prevent layout issues
  - All files uploaded to `/public/media/` directory

**Files Modified**:
- `client/src/pages/admin/MediaManagement.tsx` - New admin page for media uploads
- `server/routes.ts` - Added POST `/api/admin/upload-media` endpoint with multer file handling
- `client/src/lib/queryClient.ts` - Enhanced `apiRequest()` function to support FormData uploads with optional 4th parameter `isFormData`
- `client/src/components/HeroCarousel.tsx` - Updated to load from `/media/hero-banner.png` with fallback to static import
- `client/src/pages/Home.tsx` - Updated to load from `/media/ramani-banner.png` with fallback to static import
- `client/src/components/AdminLayout.tsx` - Added "Update Images" menu item in sidebar

#### 3. Backend Media Upload Endpoint
- **Route**: POST `/api/admin/upload-media` (protected with `authenticateAdmin`)
- **Functionality**: 
  - Accepts multiple file fields (hero, banner, video)
  - Saves files to `/public/media/` with consistent naming
  - Returns success response with file paths
- **Error Handling**: File size limits (50MB), format validation, multer error handling

#### 4. Dynamic Media Loading System
- **Frontend Pattern**: All components that load media use try-fallback pattern
- **Process**:
  1. Attempt to fetch from `/media/` directory
  2. If successful, display uploaded media
  3. If fails, automatically fallback to static imports from `@assets/`
- **Benefits**: Admin uploads automatically appear on homepage without code changes or redeploy

### 📁 Project Structure

```
client/src/
├── pages/
│   ├── admin/
│   │   ├── MediaManagement.tsx (NEW - Upload admin UI)
│   │   ├── AdminDashboard.tsx
│   │   └── [other admin pages]
│   ├── Home.tsx (MODIFIED - Dynamic ramani-banner loading)
│   └── [other pages]
├── components/
│   ├── HeroCarousel.tsx (MODIFIED - Dynamic hero-banner loading)
│   ├── AdminLayout.tsx (MODIFIED - Added "Update Images" link)
│   └── [other components]
└── lib/
    ├── queryClient.ts (MODIFIED - FormData support)
    └── [utilities]

server/
├── routes.ts (MODIFIED - Color filter fix + media upload endpoint)
└── [server files]

public/
├── media/ (NEW - Media upload directory)
│   ├── hero-banner.png (uploaded by admin)
│   ├── ramani-banner.png (uploaded by admin)
│   └── promotional-video.mp4 (uploaded by admin)
```

### 🔧 Technical Details

#### Color Filter Implementation
```typescript
// MongoDB aggregation with $filter operator
$addFields: {
  colorVariants: {
    $filter: {
      input: "$colorVariants",
      as: "variant",
      cond: { $in: ["$$variant.displayColor", selectedColors] }
    }
  }
}
```

#### File Upload Handler Pattern
```typescript
// Backend (server/routes.ts)
app.post("/api/admin/upload-media", authenticateAdmin, (req, res) => {
  upload.fields([
    { name: 'hero', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ])(req, res, (err) => { ... })
})

// Frontend (client/src/lib/queryClient.ts)
export async function apiRequest(
  url: string,
  method: string,
  data?: unknown,
  isFormData?: boolean  // NEW parameter
): Promise<any> { ... }
```

#### Dynamic Media Loading Pattern
```typescript
// Component pattern used in HeroCarousel and Home
const [heroImage, setHeroImage] = useState(staticImport);

useEffect(() => {
  fetch("/media/hero-banner.png")
    .then((res) => {
      if (res.ok) setHeroImage("/media/hero-banner.png");
    })
    .catch(() => setHeroImage(staticImport));
}, []);
```

### 📊 Admin Panel Features
- Product Management
- Order Management
- Inventory Management
- Review Management
- Settings (Shipping charges, free shipping threshold)
- **NEW: Media Management** (Update Images) ← Recently added

### 🎨 Current Design
- Responsive mobile-first design
- Dark/light mode support
- Tailwind CSS + Shadcn UI components
- Framer Motion animations
- Color-coded product variants system

### 🔐 Security
- Admin authentication with JWT tokens stored in localStorage
- Protected routes with `authenticateAdmin` middleware
- File upload validation and multer error handling
- FormData sent with Authorization header

### 📱 Tested Features
- Homepage loads correctly with hero carousel
- Color filtering works at database level
- Admin can access Media Management page
- API endpoints respond correctly
- No TypeScript/LSP errors

### 🚀 Deployment Config
- Frontend: Port 5000 (Vite dev server with allowedHosts configured)
- Backend: Express.js on port 5000 (served via Vite proxy)
- Database: MongoDB (Neon-backed for production)
- File uploads: `/public/media/` directory

## Known Limitations & Future Enhancements

### Potential Improvements
1. Add video preview in Media Management
2. Add image cropping/resizing before upload
3. Implement media gallery history/versions
4. Add bulk product update feature
5. Enhanced admin analytics dashboard
6. WhatsApp integration for order notifications

### Database
- Using MongoDB with Mongoose ODM
- Indexes configured for category, color, and other frequently filtered fields
- Product variants system with colorVariants array structure

## Maintenance Notes

### Adding New Admin Features
1. Create page in `client/src/pages/admin/`
2. Add link in `client/src/components/AdminLayout.tsx`
3. Add protected route in `client/src/App.tsx`
4. For file uploads, use the pattern in MediaManagement.tsx

### Modifying Media Uploads
- Files saved to `/public/media/` with consistent naming
- Modify file names in backend `/api/admin/upload-media` endpoint
- Update corresponding component loading logic in frontend

### Color Filter Updates
- MongoDB aggregation in `GET /api/products` endpoint
- Modify `$filter` condition to change filtering logic
- Test with `/api/products?color=Red,Blue` query param

## User Access

### Admin Login
- Access via `/admin/login`
- Username/password authentication
- JWT token stored in localStorage under 'adminToken'
- Admin routes protected with `authenticateAdmin` middleware

### Customer Access
- Public product browsing with filters (category, color, price, etc.)
- Shopping cart and wishlist
- User authentication with mobile + OTP
- Order history and tracking
- WhatsApp integration for communication

## Recent Debugging Notes
- April 11, 2026: Section tags for New Arrival, Trending, and Bestseller now apply through color variants for apparel products instead of product-level flags. Product listing filters only display the specific tagged variants, and color sidebar options use each displayed card's `displayColor`. Admin color variants can now use typed custom color names alongside the dropdown.
- Fixed hook call order issue in Home.tsx by using proper `useEffect` instead of `useState`
- Ensured FormData doesn't set Content-Type header (browser does it automatically with boundary)
- Created `/public/media/` directory structure for uploads
- All LSP errors resolved as of December 1, 2025

---
**Last Updated**: December 1, 2025
**Status**: Production Ready with New Admin Media Management Feature
