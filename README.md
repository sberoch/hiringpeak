# Fullstack TypeScript Monorepo Template

A production-ready fullstack TypeScript monorepo template featuring NestJS backend, Next.js frontend, PostgreSQL database, and shadcn/ui components. Built with modern tooling and best practices for scalable web applications.

## 🚀 Features

- **🏗️ Monorepo Architecture**: Organized with Turborepo for efficient build orchestration
- **⚡ Backend API**: NestJS with JWT authentication, PostgreSQL, and Drizzle ORM
- **🎨 Modern Frontend**: Next.js 15 with React 19, Tailwind CSS, and shadcn/ui
- **📦 Package Management**: pnpm workspaces for efficient dependency management
- **🗄️ Database**: PostgreSQL with type-safe Drizzle ORM and Docker containerization
- **🔧 Developer Experience**: Hot reload, TypeScript, ESLint, Prettier, and automated testing
- **📚 API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **🔐 Authentication**: Complete JWT-based auth system with role-based access control

## 📁 Project Structure

```
├── apps/
│   ├── api/                 # NestJS backend application
│   └── web/                 # Next.js frontend application
├── packages/
│   ├── shared/              # Shared TypeScript types and utilities
│   ├── ui/                  # shadcn/ui component library
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TypeScript configurations
└── docker-compose.yml       # PostgreSQL database container
```

## 🛠️ Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database operations
- **JWT** - Authentication and authorization
- **Passport** - Authentication middleware
- **Swagger/OpenAPI** - API documentation
- **Helmet** - Security middleware

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **next-themes** - Theme switching support
- **Lucide React** - Beautiful icons

### Development Tools

- **Turborepo** - High-performance build system
- **pnpm** - Fast, efficient package manager
- **TypeScript** - Type safety across the stack
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Docker** - Database containerization

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd fullstack-template
   pnpm install
   ```

2. **Start the database**

   ```bash
   docker-compose up -d
   ```

3. **Configure environments**

   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your database credentials

   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with your web app credentials
   ```

4. **Setup database**

   ```bash
   cd apps/api
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start development servers**
   ```bash
   # From project root
   pnpm dev
   ```

The API will be available at `http://localhost:5000` and the web app at `http://localhost:3000`. Port configuration is in the `.env` files.

## 📚 Available Scripts

### Development

```bash
pnpm dev              # Start all apps in development mode
pnpm dev --filter=api # Start API only
pnpm dev --filter=web # Start web app only
```

### Building

```bash
pnpm build            # Build all packages and apps
pnpm build --filter=api
pnpm build --filter=web
```

### Code Quality

```bash
pnpm lint             # Run ESLint across all workspaces
pnpm format           # Format code with Prettier
```

### Database Operations

```bash
cd apps/api
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:reset         # Reset and reseed database
pnpm db:seed:prod     # Seed database with sample data for production
```

## 🔐 Authentication

The API includes a complete authentication system with:

- **Local Strategy**: Username/password authentication
- **JWT Strategy**: Token-based API access
- **Role-based Access Control**: User roles and permissions
- **Protected Routes**: Secure API endpoints
- **Password Hashing**: bcryptjs for secure password storage

## 🗄️ Database

Uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Schema-first**: Define schema in TypeScript
- **Type Safety**: Auto-generated types from schema
- **Migrations**: Version-controlled database changes
- **Seeding**: Sample data for development and testing

## 📖 API Documentation

Interactive API documentation is available at `http://localhost:5000/docs` when running the development server. The documentation is automatically generated from your NestJS controllers and DTOs.

## 🔧 Configuration

### Key Configuration Files

- `turbo.json` - Build pipeline configuration
- `pnpm-workspace.yaml` - Workspace package definitions
- `apps/api/drizzle.config.ts` - Database schema and migrations
- `packages/*/package.json` - Individual package configurations

## 🚀 Deployment

The project is designed for easy deployment:

1. **Build for production**

   ```bash
   pnpm build
   ```

2. **Database setup**

   ```bash
   cd apps/api
   pnpm db:migrate
   pnpm db:seed:prod
   ```

3. **Start production servers**

   ```bash
   # API
   cd apps/api && pnpm start:prod

   # Web
   cd apps/web && pnpm start
   ```
