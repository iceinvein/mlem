# MLEM 🎭

A modern, real-time meme sharing platform built with React, Convex, and TypeScript. Discover, share, and enjoy the funniest memes with a vibrant community.

## Features

### Core Functionality
- **Real-time Feed** - Browse memes with infinite scroll and virtual rendering for optimal performance
- **Category System** - Organize memes into categories (Funny, Animals, Gaming, Tech, Sports, Movies, Food, Travel)
- **User Interactions** - Like, share, and comment on memes
- **Personalized Experience** - Customize your feed with favorite categories and sorting preferences
- **Dark Mode** - Full theme support (Light, Dark, System)

### User Features
- **Authentication** - Secure sign-in with Convex Auth
- **Custom Usernames** - One-time username change capability
- **Feed Customization** - Sort by newest or most popular, filter by categories
- **Rate Limiting** - Fair usage with 5 posts per hour for regular users
- **Responsive Design** - Mobile-first UI with smooth animations

### Content Management
- **Create Memes** - Upload images with titles, categories, and tags
- **File Storage** - Integrated Convex file storage for images
- **Delete Memes** - Authors can delete their own content
- **Share Functionality** - Share memes with unique URLs

### Moderation & Administration
- **Role System** - User, Moderator, and Admin roles
- **Moderation Dashboard** - Review and manage reported content
- **Report System** - Users can report inappropriate content with multiple reason categories
- **Admin Panel** - Manage users, roles, and system-wide settings
- **Category Management** - Admins can create, update, and delete categories

## Tech Stack

### Frontend
- **React 19** - Latest React with modern hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **HeroUI** - Beautiful component library
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library
- **TanStack Virtual** - Efficient list virtualization
- **Next Themes** - Theme management

### Backend
- **Convex** - Real-time backend platform
- **Convex Auth** - Authentication system
- **File Storage** - Built-in file management

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mlem
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

4. Initialize Convex:
```bash
npx convex dev
```

5. Start the development server:
```bash
npm run dev
# or
bun run dev
```

The app will open at `http://localhost:5173`

## Project Structure

```
├── convex/                 # Backend functions and schema
│   ├── auth.config.ts     # Authentication configuration
│   ├── auth.ts            # Auth functions
│   ├── comments.ts        # Comment management
│   ├── memes.ts           # Meme CRUD operations
│   ├── reports.ts         # Content reporting
│   ├── roles.ts           # User role management
│   ├── schema.ts          # Database schema
│   └── users.ts           # User management
├── src/
│   ├── components/        # React components
│   │   ├── AdminDashboard.tsx
│   │   ├── BottomNav.tsx
│   │   ├── CategoryManagement.tsx
│   │   ├── CreateMemeModal.tsx
│   │   ├── Feed.tsx
│   │   ├── MemeCard.tsx
│   │   ├── ModerationDashboard.tsx
│   │   ├── Settings.tsx
│   │   ├── ShareModal.tsx
│   │   └── SinglePost.tsx
│   ├── providers/         # Context providers
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── style.css         # Global styles
├── public/               # Static assets
└── package.json
```

## Database Schema

### Tables
- **users** - User accounts with authentication
- **categories** - Meme categories
- **memes** - Meme posts with metadata
- **comments** - Nested comments on memes
- **userPreferences** - User feed settings
- **userInteractions** - Likes and shares
- **reports** - Content moderation reports
- **userRoles** - Role-based access control
- **userMetadata** - Additional user data

## Scripts

```bash
# Development
npm run dev              # Start frontend and backend
npm run dev:frontend     # Start Vite dev server only
npm run dev:backend      # Start Convex dev only

# Build
npm run build           # Build for production

# Code Quality
npm run lint            # Run Biome linter
npm run typecheck       # TypeScript type checking
```

## Deployment

### Netlify Deployment

This project is configured for automatic deployment on Netlify with Convex backend.

#### Setup Steps:

1. **Connect your GitHub repository to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select this repository

2. **Configure Convex Deploy Key**
   - Go to your [Convex Dashboard](https://dashboard.convex.dev)
   - Navigate to your project's Settings page
   - Click "Generate" to create a **Production** deploy key
   - Copy the generated key
   - In Netlify, go to Site configuration → Environment variables
   - Add a new variable:
     - Key: `CONVEX_DEPLOY_KEY`
     - Value: (paste your production deploy key)

3. **Deploy**
   - Netlify will automatically detect the build settings from `netlify.toml`
   - Click "Deploy site"
   - Every push to `main` will trigger automatic deployment

#### How it works:
- The build command `bunx convex deploy --cmd 'bun run build'` deploys Convex functions first using Bun
- Convex sets the `VITE_CONVEX_URL` environment variable automatically
- Vite builds the frontend with the production Convex URL using Bun's fast runtime
- The built site is published from the `dist` directory

#### Optional: Preview Deployments
To enable preview deployments for pull requests:
1. Generate a **Preview** deploy key in Convex Dashboard
2. In Netlify, edit the `CONVEX_DEPLOY_KEY` variable
3. Select "Different value for each deploy context"
4. Paste the preview key under "Deploy Previews"

This creates isolated Convex backends for each PR preview.

## Features in Detail

### Authentication
- Email-based authentication via Convex Auth
- Automatic username generation on first sign-in
- One-time username customization

### Feed System
- Infinite scroll with pagination
- Virtual rendering for performance
- Real-time updates
- Sort by newest or most popular
- Filter by categories
- Show only favorite categories option

### Moderation
- User-submitted reports with categories:
  - Spam
  - Inappropriate content
  - Harassment
  - Copyright violation
  - Misinformation
  - Other
- Moderator dashboard for reviewing reports
- Actions: Warning, Content removal, User suspension
- Report status tracking

### Admin Features
- First user can claim admin role
- Promote users to moderator/admin
- Category management (CRUD operations)
- View all users and their roles
- System-wide content oversight

## Rate Limiting
- Regular users: 5 memes per hour
- Moderators/Admins: Unlimited posts
- Automatic reset after 1 hour

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Convex](https://convex.dev)
- UI components from [HeroUI](https://heroui.com)
- Icons from [Lucide](https://lucide.dev)

---

Made with ❤️ by the MLEM team
