# Pacelane - AI Content Assistant

## 📝 Project Overview

Pacelane is an AI-powered content creation assistant designed for executives and founders. It helps create high-quality, personalized content for professional platforms like LinkedIn by leveraging user insights, goals, and inspirations.

## 🚀 Core Features

- **AI-Powered Content Generation**: Create engaging LinkedIn posts and content using advanced AI
- **Personal Insights Integration**: Leverage your professional background and expertise
- **Inspiration Management**: Save and analyze content from industry leaders
- **Content Strategy**: Align content with your business goals and messaging
- **Knowledge Base**: Upload and reference your own materials and documents
- **Analytics Dashboard**: Track content performance and engagement
- **WhatsApp Notifications**: Automated content delivery and engagement tracking

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript, Vite
- **Design System**: Custom design tokens, components, and theming
- **Styling**: Tailwind CSS with design system integration
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with RLS
- **Storage**: Google Cloud Storage + Supabase Storage
- **AI Integration**: OpenAI GPT models, Vertex AI, Read AI
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Deployment**: Vercel

## 📚 Documentation Structure

### 🏗️ [Architecture Overview](./architecture/README.md)
- System architecture and design patterns
- Database schema and relationships
- API design principles

### 🔧 [Supabase & Backend](./supabase/README.md)
- **Edge Functions**: Complete documentation of all 25+ functions
- **Database**: Schema, RLS policies, and migrations
- **Authentication**: User management and security
- **Storage**: GCS integration and file management

### 🎨 [Design System](./design-system/README.md)
- **Design Tokens**: Colors, typography, spacing, shadows
- **Components**: Reusable UI components and patterns
- **Theming**: Light/dark mode and customization
- **Usage Guidelines**: Best practices and examples

### 🔌 [Service Layer](./services/README.md)
- **Business Logic**: Content, user, and AI services
- **API Integration**: External service connections
- **Data Management**: CRUD operations and state handling
- **Error Handling**: Comprehensive error management

### 🚀 [Development Guide](./development/README.md)
- Local development setup
- Code standards and patterns
- Testing and deployment
- Contributing guidelines

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase CLI
- Google Cloud Platform account

### Local Development
```bash
# Clone and setup
git clone <repository-url>
cd pacelane-app
npm install

# Environment setup
cp .env.example .env.local
# Configure Supabase and GCP credentials

# Start development
npm run dev
```

### Supabase Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Deploy edge functions
supabase functions deploy
```

## 🔍 Key Components

### Design System
- **25+ Design Tokens**: Comprehensive color, typography, and spacing systems
- **Theme-Aware Components**: Automatic light/dark mode support
- **Motion & Accessibility**: Smooth animations and ARIA compliance

### Edge Functions
- **Knowledge Base Storage**: GCS integration with file processing
- **AI Processing**: Content generation and analysis
- **WhatsApp Integration**: Automated notifications and engagement
- **User Management**: Profile and preference handling

### Service Architecture
- **Layered Architecture**: Clear separation of concerns
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management and reporting
- **Performance**: Optimized queries and caching

## 📖 Getting Started

1. **Start Here**: Read the [Architecture Overview](./architecture/README.md)
2. **Backend**: Review [Supabase Documentation](./supabase/README.md)
3. **Frontend**: Explore [Design System](./design-system/README.md)
4. **Development**: Follow [Development Guide](./development/README.md)

## 🤝 Contributing

1. Review the [Development Guide](./development/README.md)
2. Follow the established patterns and design system
3. Ensure all changes are documented
4. Test thoroughly before submitting

## 📄 License

This project is proprietary software. All rights reserved.

---

*Last updated: December 2024*
*Documentation version: 2.0*