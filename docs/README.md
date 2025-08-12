# Pacelane - AI Content Assistant

## 📝 Project Overview

Pacelane is an AI-powered content creation assistant designed for executives and founders. It helps create high-quality, personalized content for professional platforms like LinkedIn by leveraging user insights, goals, and inspirations.

## 🚀 Features

- **AI-Powered Content Generation**: Create engaging LinkedIn posts and content using advanced AI
- **Personal Insights Integration**: Leverage your professional background and expertise
- **Inspiration Management**: Save and analyze content from industry leaders
- **Content Strategy**: Align content with your business goals and messaging
- **Knowledge Base**: Upload and reference your own materials and documents
- **Analytics Dashboard**: Track content performance and engagement

## 🛠️ Technology Stack

This project is built with modern web technologies:

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage + Google Cloud Storage
- **AI Integration**: OpenAI GPT models
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm (recommended: [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Local Development

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd pacelane-app
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Configure your Supabase project credentials
   - Add any required API keys

4. **Start development server**
   ```sh
   npm run dev
   ```

5. **Build for production**
   ```sh
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── api/                    # Frontend API layer
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── ...                # Feature components
├── design-system/          # Design system components & tokens
│   ├── components/        # Design system components
│   ├── tokens/           # Design tokens (colors, typography, etc.)
│   └── styles/           # Style utilities
├── hooks/                 # Custom React hooks
├── pages/                # Page components
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── integrations/         # External service integrations
```

## 🎨 Design System

Pacelane includes a comprehensive design system with:

- **Design Tokens**: Colors, typography, spacing, shadows
- **Component Library**: Pre-built, accessible components
- **Theme Support**: Light/dark mode compatibility
- **Motion**: Smooth animations and transitions

See the [design system documentation](.cursorrules) for detailed usage guidelines.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Deployment

The application can be deployed to various platforms:

- **Vercel**: Connected via GitHub integration
- **Netlify**: Deploy from Git repository
- **Custom hosting**: Build and serve the `dist` folder

## 📚 Documentation

- [Local Development Setup](LOCAL_DEVELOPMENT_SETUP.md)
- [Refactoring Progress](REFACTORING_PROGRESS.md)
- [WhatsApp Integration](WHATSAPP_INTEGRATION_IMPLEMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the development team or open an issue in the repository.