# Development Guide

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm**: Version 8+ (comes with Node.js)
- **Git**: Version 2.30+
- **Supabase CLI**: For local development and deployment
- **Google Cloud Platform**: Account for GCS integration

### Environment Setup
```bash
# Install Node.js with nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Supabase CLI
npm install -g supabase

# Verify installations
node --version    # Should be 18.x.x
npm --version     # Should be 8.x.x
supabase --version # Should be latest
```

## 🏗️ Project Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd pacelane-app
```

### 2. Install Dependencies
```bash
# Install project dependencies
npm install

# Install development dependencies
npm install --save-dev @types/node @types/react @types/react-dom
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# Required variables:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GCS_PROJECT_ID=your_gcs_project_id
VITE_GCS_BUCKET_PREFIX=your_bucket_prefix
```

### 4. Supabase Setup
```bash
# Start local Supabase instance
supabase start

# This will start:
# - PostgreSQL database on port 54322
# - Supabase API on port 54321
# - Studio on port 54323

# Apply migrations
supabase db reset

# Deploy edge functions locally
supabase functions serve
```

### 5. Start Development Server
```bash
# Start Vite development server
npm run dev

# The app will be available at http://localhost:5173
```

## 🏛️ Project Structure

### Directory Organization
```
pacelane-app/
├── src/                          # Source code
│   ├── pages/                    # Page components
│   ├── components/               # Feature-specific components
│   ├── design-system/            # Design system
│   │   ├── components/           # Reusable UI components
│   │   ├── tokens/               # Design tokens
│   │   ├── styles/               # Style utilities
│   │   └── utils/                # Design system utilities
│   ├── services/                 # Business logic services
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/             # External service integrations
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── supabase/                     # Backend configuration
│   ├── functions/                # Edge functions
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase configuration
├── public/                       # Static assets
├── docs/                         # Documentation
├── scripts/                      # Build and deployment scripts
└── configuration files           # Various config files
```

### Key File Locations
- **Main App**: `src/App.tsx` - Application routing and layout
- **Design System**: `src/design-system/` - UI components and tokens
- **Services**: `src/services/` - Business logic layer
- **Edge Functions**: `supabase/functions/` - Backend logic
- **Types**: `src/types/` - TypeScript definitions
- **Configuration**: Root level config files

## 🎨 Design System Development

### Component Development Rules

#### 1. Import Patterns
**ALWAYS use the `@/` alias for imports. NEVER use `src/` prefix or relative paths.**

```typescript
// ✅ CORRECT - Always use @/ alias
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { Button } from '@/design-system/components/Button';

// ❌ WRONG - Never use src/ prefix or relative paths
import { useTheme } from 'src/services/theme-context';
import { spacing } from '../design-system/tokens/spacing';
```

#### 2. Component Structure
```typescript
import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

interface MyComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const { colors } = useTheme();
  
  const containerStyles = {
    backgroundColor: colors.bg.card.default,
    color: colors.text.default,
    padding: spacing.spacing[16],
    borderRadius: cornerRadius.borderRadius.md,
    boxShadow: variant === 'elevated' 
      ? getShadow('regular.modalMd', colors, { withBorder: true })
      : getShadow('regular.card', colors, { withBorder: true }),
  };
  
  return (
    <div style={containerStyles} className={className}>
      {children}
    </div>
  );
};

export default MyComponent;
```

#### 3. Design Token Usage
```typescript
// ✅ Use design tokens for all styling
const styles = {
  padding: spacing.spacing[16],
  borderRadius: cornerRadius.borderRadius.md,
  color: colors.text.default,
  backgroundColor: colors.bg.card.default,
  boxShadow: shadows.regular.card,
};

// ❌ Never hardcode values
const styles = {
  padding: '16px',
  borderRadius: '8px',
  color: '#000000',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};
```

#### 4. Button Component Usage
**ALWAYS use the Button component for ANY button needs. NEVER create custom buttons.**

```typescript
import Button from '@/design-system/components/Button';
import { Plus, MoreHorizontal } from 'lucide-react';

// ✅ Use Button component
<Button 
  label="Create Post"
  style="primary"
  size="lg"
  onClick={handleCreate}
  leadIcon={<Plus size={16} />}
/>

// ❌ Never create custom buttons
<button 
  style={{ backgroundColor: '#007bff', color: 'white' }}
  onClick={handleCreate}
>
  Create Post
</button>
```

#### 5. Icon Usage
**ALWAYS use Lucide React icons. NEVER create custom SVG icons.**

```typescript
import { Plus, MoreHorizontal, Search, Settings } from 'lucide-react';

// ✅ Use Lucide icons
<Button 
  leadIcon={<Plus size={16} />}
  label="Add Item"
/>

// ❌ Never create custom SVG icons
const CustomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8" fill="currentColor" />
  </svg>
);
```

### Theme Integration
```typescript
// Always use useTheme hook for theme-aware components
const { colors, currentTheme, toggleTheme } = useTheme();

// Theme-aware styling
const themeStyles = {
  backgroundColor: colors.bg.default,
  color: colors.text.default,
  borderColor: colors.border.default,
};

// Theme switching
<button onClick={toggleTheme}>
  Switch to {currentTheme === 'light' ? 'dark' : 'light'} mode
</button>
```

## 🔧 Service Layer Development

### Service Development Rules

#### 1. Service Structure
```typescript
export class MyService {
  // Static methods for stateless operations
  static async operation(data: OperationData): Promise<ApiResponse<Result>> {
    try {
      // Input validation
      const validation = this.validateInput(data);
      if (!validation.valid) {
        return { error: validation.errors.join(', ') };
      }

      // Business logic
      const result = await this.processOperation(data);
      
      return { data: result };
    } catch (error: any) {
      // Error handling
      console.error('Service operation failed:', error);
      return { 
        error: error.message || 'Operation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  // Private helper methods
  private static validateInput(data: OperationData): ValidationResult {
    const errors: string[] = [];
    
    if (!data.requiredField) {
      errors.push('Required field is missing');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static async processOperation(data: OperationData): Promise<Result> {
    // Implementation logic
    return await externalApiCall(data);
  }
}
```

#### 2. Error Handling
```typescript
// Comprehensive error handling
try {
  const result = await externalService.operation(data);
  return { data: result };
} catch (error: any) {
  // Log error for debugging
  console.error('Service operation failed:', error);
  
  // Return structured error response
  return { 
    error: error.message || 'Operation failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}
```

#### 3. API Integration
```typescript
// Supabase integration
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) {
  throw new Error(`Database error: ${error.message}`);
}

return data;

// Edge function calls
const { data, error } = await supabase.functions.invoke('function-name', {
  body: requestData,
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

if (error) {
  throw new Error(`Edge function error: ${error.message}`);
}

return data;
```

## 🗄️ Database Development

### Migration Development
```bash
# Create new migration
supabase migration new add_new_table

# Apply migrations locally
supabase db reset

# Push migrations to production
supabase db push
```

### Migration Structure
```sql
-- Example migration: add_new_table.sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access own data" ON new_table
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_new_table_user_id ON new_table(user_id);
CREATE INDEX idx_new_table_created_at ON new_table(created_at);
```

### RLS Policy Development
```sql
-- Basic RLS policy
CREATE POLICY "Users can access own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Complex RLS policy with conditions
CREATE POLICY "Users can access shared data" ON table_name
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM shared_access 
      WHERE table_id = table_name.id 
      AND shared_with = auth.uid()
    )
  );
```

## 🔧 Edge Function Development

### Function Development Rules

#### 1. Function Structure
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Parse request
    const requestData = await req.json();
    
    // Business logic
    const result = await processRequest(requestData, authHeader);
    
    return new Response(
      JSON.stringify({ data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
```

#### 2. Authentication Handling
```typescript
// Validate JWT token
const validateToken = async (authHeader: string) => {
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  return user;
};
```

#### 3. Error Handling
```typescript
// Structured error handling
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  return {
    error: error.message || 'An error occurred',
    context,
    timestamp: new Date().toISOString(),
  };
};
```

### Function Testing
```bash
# Test function locally
supabase functions serve my-function

# Test with curl
curl -X POST http://localhost:54321/functions/v1/my-function \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# Deploy to production
supabase functions deploy my-function
```

## 🧪 Testing

### Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/services/theme-context';
import MyComponent from './MyComponent';

// Test component with theme context
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithTheme(<MyComponent>Test content</MyComponent>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <MyComponent onClick={handleClick}>Click me</MyComponent>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Service Testing
```typescript
import { ContentService } from '@/services/contentService';

// Mock external dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('ContentService', () => {
  it('should load user knowledge files', async () => {
    const mockFiles = [{ id: '1', name: 'test.pdf' }];
    mockSupabase.functions.invoke.mockResolvedValue({ data: mockFiles });
    
    const result = await ContentService.loadUserKnowledgeFiles('user123');
    
    expect(result.data).toEqual(mockFiles);
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'knowledge-base-storage',
      expect.objectContaining({
        body: { userId: 'user123', action: 'list' },
      })
    );
  });
});
```

## 🚀 Performance Optimization

### Frontend Optimization
```typescript
// Code splitting
const ContentEditor = lazy(() => import('./pages/ContentEditor'));

// Memoization
const MemoizedComponent = memo(ExpensiveComponent);

// Virtual scrolling for large lists
const VirtualList = ({ items, itemHeight, containerHeight }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  
  // Virtual scrolling implementation
  // Only render visible items
};
```

### Backend Optimization
```typescript
// Database query optimization
const optimizedQuery = await supabase
  .from('table_name')
  .select('id, name, created_at')  // Select only needed columns
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);  // Limit results

// Edge function optimization
const processBatch = async (items: any[]) => {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResult = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResult);
  }
  
  return results;
};
```

## 🔍 Debugging & Monitoring

### Development Debugging
```typescript
// Structured logging
const logOperation = (operation: string, data: any, result: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Operation:', {
      operation,
      data,
      result,
      timestamp: new Date().toISOString(),
    });
  }
};

// Performance measurement
const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  
  console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
  return result;
};
```

### Error Tracking
```typescript
// Comprehensive error reporting
import { ErrorReportingService } from '@/services/errorReportingService';

try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  ErrorReportingService.captureError(error, {
    context: 'MyComponent.handleClick',
    userId: currentUser?.id,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
  
  throw error;
}
```

## 🔄 Development Workflow

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes following coding standards
# - Use design system components
# - Follow service layer patterns
# - Implement proper error handling
# - Add comprehensive tests

# 3. Test locally
npm run test
npm run build
supabase functions serve

# 4. Commit changes
git add .
git commit -m "feat: add new feature with comprehensive testing"

# 5. Push and create PR
git push origin feature/new-feature
# Create Pull Request on GitHub
```

### Code Review Checklist
- [ ] Follows design system patterns
- [ ] Uses proper import paths (`@/` alias)
- [ ] Implements comprehensive error handling
- [ ] Includes proper TypeScript types
- [ ] Has adequate test coverage
- [ ] Follows naming conventions
- [ ] Includes proper documentation
- [ ] No hardcoded values (uses design tokens)
- [ ] Proper use of Button component (no custom buttons)
- [ ] Uses Lucide React icons (no custom SVG)

### Deployment Process
```bash
# 1. Deploy edge functions
supabase functions deploy

# 2. Deploy database changes
supabase db push

# 3. Deploy frontend (automatic via Vercel)
# Frontend deploys automatically when PR is merged to main

# 4. Verify deployment
# Check edge functions are working
# Verify database changes are applied
# Test frontend functionality
```

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Service for managing user content and knowledge base files.
 * Handles file uploads, content processing, and AI integration.
 */
export class ContentService {
  /**
   * Load all knowledge files for a user from GCS via edge function.
   * 
   * @param userId - The user's ID to load files for
   * @returns Promise with knowledge files list or error
   * 
   * @example
   * ```typescript
   * const files = await ContentService.loadUserKnowledgeFiles('user123');
   * if (files.data) {
   *   console.log('Loaded', files.data.length, 'files');
   * }
   * ```
   */
  static async loadUserKnowledgeFiles(userId: string): Promise<ApiResponse<KnowledgeFile[]>> {
    // Implementation
  }
}
```

### Component Documentation
```typescript
/**
 * A reusable card component that displays content with optional elevation.
 * Automatically adapts to light/dark themes using design system tokens.
 * 
 * @example
 * ```tsx
 * <ContentCard elevated>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </ContentCard>
 * ```
 */
interface ContentCardProps {
  /** Whether the card should have elevated shadow */
  elevated?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
}
```

## 🔗 Related Documentation

- [Design System](./../design-system/README.md) - UI components and styling
- [Service Layer](./../services/README.md) - Business logic and API integration
- [Supabase & Backend](./../supabase/README.md) - Backend architecture and edge functions
- [Architecture Overview](./../architecture/README.md) - Overall system design

---

*Last updated: December 2024*
*Development Guide version: 2.0*
*Coding Standards: Comprehensive patterns*
*Testing: Full coverage requirements*