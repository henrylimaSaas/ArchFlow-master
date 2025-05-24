# ArchFlow - SaaS Platform for Architecture Offices

A comprehensive project management system designed specifically for small and medium architecture and engineering offices.

## 🏗️ Features

### Project Management
- Complete project lifecycle tracking
- Client relationship management
- Status monitoring and deadlines
- File attachment system

### Task Management
- Kanban board interface
- Task assignment to team members
- Sub-task support
- Priority levels and status tracking
- Drag-and-drop functionality

### Team Management
- User roles (Architect, Intern, Financial, Marketing, Admin)
- Task assignment system
- Team member profiles
- Permission-based access

### Financial Control
- Income, expense, and investment tracking
- Project-linked transactions
- Category-based organization
- Monthly revenue monitoring
- Financial dashboard

### Construction Calculators
- Brick calculator
- Flooring calculator
- Paint calculator
- Concrete calculator

### Client Management
- Contact information
- Project history
- Communication tracking

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for state management
- **Radix UI** + **shadcn/ui** for components
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Backend
- **Node.js** with **Express**
- **TypeScript** with ES modules
- **PostgreSQL** database
- **Drizzle ORM** for database management
- **JWT** authentication
- **bcrypt** for password hashing

### Infrastructure
- **Replit** hosting
- **PostgreSQL** database
- **Drizzle Kit** for migrations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/henrylimaSaas/ArchFlow-master.git
cd ArchFlow-master
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Configure your DATABASE_URL and JWT_SECRET
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and configurations
├── server/               # Backend Express application
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data access layer
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and validation
└── package.json         # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open database studio

### Database Schema

The application uses a multi-tenant architecture with the following main entities:

- **Offices** - Architecture firms/companies
- **Users** - Team members with role-based access
- **Clients** - Project clients
- **Projects** - Architecture projects
- **Tasks** - Project tasks with assignment capability
- **Transactions** - Financial tracking
- **Files** - Project attachments

## 🎨 Design System

The application uses a consistent design system based on:
- Green color theme (#10B981 primary)
- Radix UI primitives
- Tailwind CSS utilities
- Responsive design principles
- Accessibility-first approach

## 🔐 Authentication & Security

- JWT-based authentication
- bcrypt password hashing
- Role-based access control
- Office-level data isolation
- Input validation with Zod schemas

## 📱 Features in Detail

### Dashboard
- Project statistics
- Task overview
- Financial summary
- Quick actions

### Kanban Board
- Visual task management
- Drag-and-drop interface
- Status columns (To Do, In Progress, Completed)
- Add tasks directly from columns

### Team Roles
- **Admin**: Full system access
- **Architect**: Project and task management
- **Financial**: Financial data access
- **Marketing**: Client management
- **Intern**: Limited task access

## 🚀 Deployment

The application is configured for deployment on Replit with:
- Automatic scaling
- PostgreSQL database
- Environment variable management
- Single-port architecture (5000)

## 📄 License

This project is proprietary software developed for architecture offices.

## 🤝 Contributing

This is a private project. For access or contributions, please contact the development team.

## 📞 Support

For technical support or feature requests, please contact the development team.

---

**ArchFlow** - Streamlining architecture project management