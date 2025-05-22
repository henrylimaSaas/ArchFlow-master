# Architecture Documentation

## Overview

This is a full-stack architecture management system built with React, Express, and PostgreSQL. The application follows a monorepo structure with clear separation between client-side React frontend and server-side Express backend, sharing common types and schemas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with JSON responses
- **Middleware**: Custom logging, authentication, and error handling

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- JWT-based authentication with bcrypt password hashing
- Office registration with admin user creation
- Protected routes with middleware authentication
- Session management through HTTP-only tokens

### Data Models
- **Offices**: Multi-tenant office management
- **Users**: Role-based user system (architect, intern, financial, marketing, admin)
- **Clients**: Client relationship management
- **Projects**: Project lifecycle management with status tracking
- **Tasks**: Task management with Kanban board interface
- **Transactions**: Financial transaction tracking
- **Files**: Project file management system

### UI Component System
- Comprehensive design system based on Radix UI
- Consistent theming with CSS variables
- Responsive design with mobile-first approach
- Accessibility-focused component implementations

### Business Logic Modules
- Dashboard with statistics and overview widgets
- Project management with client relationships
- Task management with drag-and-drop Kanban boards
- Financial tracking and reporting
- Construction calculators (brick, flooring, paint, concrete)

## Data Flow

### Request Flow
1. Client makes API request through React Query
2. Express middleware handles authentication
3. Route handlers process business logic
4. Drizzle ORM handles database operations
5. Structured JSON responses returned to client

### Authentication Flow
1. User submits credentials through login form
2. Server validates against database using bcrypt
3. JWT token generated and stored in localStorage
4. Subsequent requests include Authorization header
5. Middleware validates token on protected routes

### State Management
- Server state managed by TanStack Query with automatic caching
- Local UI state managed by React hooks
- Global authentication state through custom useAuth hook
- Optimistic updates for better user experience

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- UI libraries (Radix UI, Lucide React for icons)
- Form handling (React Hook Form with Zod validation)
- HTTP client built into TanStack Query

### Backend Dependencies
- Express.js with middleware ecosystem
- Database drivers (@neondatabase/serverless, ws)
- Authentication (bcrypt, jsonwebtoken)
- Development tools (tsx for TypeScript execution)

### Development Tools
- TypeScript for type safety across the stack
- Vite for frontend bundling and development
- ESBuild for backend bundling
- Drizzle Kit for database management

## Deployment Strategy

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single deployment artifact with Express serving static files

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration for authentication
- Development vs production environment detection

### Hosting Setup
- Configured for Replit deployment with autoscale target
- PostgreSQL database provisioning required
- Single port (5000) serves both API and static frontend

### Development Workflow
- Hot module replacement for frontend development
- TypeScript compilation checking
- Database schema push for development iterations
- Concurrent development server for full-stack development