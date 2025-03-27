# Feedback Portal Project Presentation

## Project Overview

### What is the Feedback Portal?
- A comprehensive web application built with Next.js 15
- Designed to collect, manage, and analyze client feedback
- Integrated with Hailey HR API for employee data management
- Features a secure dashboard with analytics and reporting

### Key Features
- Client survey system with unique links
- Employee data synchronization and analytics
- Authentication restricted to company emails
- Interactive dashboard with visualizations
- Secure API key management

---

## Technical Architecture

### Frontend
- Next.js 15 with App Router
- React server and client components
- Tailwind CSS for responsive design
- TypeScript for type safety

### Backend
- Next.js API routes and server actions
- PostgreSQL database
- Prisma ORM for database operations
- NextAuth.js for authentication

### External Integrations
- Hailey HR API for employee data
- Google OAuth for authentication

---

## Prisma Database Integration

### Why Prisma?
- Type-safe database access with auto-generated client
- Schema-first approach with migrations
- Simplified query building with intuitive API
- Support for PostgreSQL, MySQL, SQLite, and more

### Implementation
```typescript
// prisma.ts - Global client configuration
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances during hot reloading
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
```

### Database Operations
- Server-side operations with server actions
- Type-safe queries with auto-completion
- Transaction support for complex operations
- Automatic connection pooling and optimization

---

## Client Feedback System

### Smart Code Generation
- Unique codes for each client survey link
- Format: `[prefix]-[random]-[timestamp]`
- Trackable without being guessable
- QR code generation for easy sharing

### Client Recognition System
```typescript
// Client recognition without login
export function SurveyForm({ uniqueCode, clientName, companyName }) {
  useEffect(() => {
    // Store client info in localStorage
    localStorage.setItem('clientInfo', JSON.stringify({
      name: clientName,
      company: companyName,
      lastAccess: new Date().toISOString()
    }));
  }, [clientName, companyName]);
  
  // Rest of component...
}
```

### Personalized Experience
- Clients see their name without filling in forms
- Welcome back messaging based on localStorage
- Remembers partial submissions for later completion
- Adaptive form based on previous responses

### Link Generation Process
1. Admin creates new survey link with client details
2. System generates unique code and stores in database
3. Link is shared via email or QR code
4. Client accesses survey with personalized greeting
5. Responses are tracked and linked to the unique code

---

## Authentication System

### NextAuth Implementation
```typescript
// Key configuration in [...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(new PrismaClient()),
  providers: [GoogleProvider({...})],
  callbacks: {
    async signIn({ user }) {
      return user.email?.endsWith('@kumpan.se') ?? false;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
```

### Google Authentication Deep Dive
- OAuth 2.0 flow with PKCE for enhanced security
- Silent refresh of tokens for seamless experience
- Custom sign-in page with branded experience
- Session management with JWT or database strategy

### Step-by-Step NextAuth Implementation

#### 1. Setting Up Project Dependencies
```bash
# Install NextAuth and required packages
pnpm add next-auth @auth/prisma-adapter
pnpm add -D @types/next-auth
```

#### 2. Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set application type to "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-production-domain.com/api/auth/callback/google` (production)
8. Copy the generated Client ID and Client Secret

#### 3. Environment Variables Setup
```
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 4. Prisma Schema Configuration
```prisma
// prisma/schema.prisma
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

#### 5. Create Auth API Route
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow @kumpan.se email addresses
      return user.email?.endsWith('@kumpan.se') ?? false;
    },
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 6. Create Auth Context Provider
```typescript
// src/components/providers/SessionProvider.tsx
'use client';

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

#### 7. Add Provider to Layout
```typescript
// src/app/layout.tsx
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

#### 8. Create Protected Routes with Middleware
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define paths that require authentication
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(
    (prefix) => path.startsWith(prefix)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### 9. Create Custom Sign-in Page
```typescript
// src/app/auth/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Feedback Portal</h1>
          <p className="mt-2 text-gray-600">Sign in with your Kumpan email</p>
        </div>
        
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

#### 10. Create Error Page
```typescript
// src/app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication.';
  
  if (error === 'AccessDenied') {
    errorMessage = 'Access denied. Only @kumpan.se email addresses are allowed.';
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-4 text-gray-700">{errorMessage}</p>
          <div className="mt-8">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 11. Using Authentication in Components
```typescript
// Example of using authentication in a client component
'use client';

import { useSession, signOut } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <p>Signed in as {session?.user?.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

#### 12. Server-Side Authentication Check
```typescript
// Example of checking authentication in a Server Component
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {session.user?.name}</p>
    </div>
  );
}
```

### Implementation Guide for Others
1. Register application in Google Cloud Console
2. Obtain Client ID and Client Secret
3. Configure authorized redirect URIs
4. Install NextAuth.js: `pnpm add next-auth`
5. Create API route with NextAuth configuration
6. Add session provider to application layout
7. Implement domain restriction in callbacks

### Domain Restriction
- Authentication limited to @kumpan.se email addresses
- Custom sign-in and error pages
- Protected routes using Next.js middleware
- Session-based authentication with secure cookies

---

## Hailey HR API Integration

### API Client Structure
- Modular class-based implementation
- Centralized error handling
- Data transformation utilities
- Automatic retry mechanisms

### How the Hailey HR API Works
- RESTful API for employee data management
- Endpoints for employee profiles, departments, and history
- Authentication via API key in request headers
- Rate limiting and pagination for large datasets

### API Implementation Details
```typescript
// haileyhr.ts - Core API client
export class HaileyHRApi {
  private static apiKey: string | null = null;
  private static apiUrl = 'https://api.haileyhr.com/v1';
  
  // Set API key securely
  public static setApiKey(key: string): void {
    this.apiKey = key;
  }
  
  // Validate API key
  public static async validateApiKey(): Promise<ApiKeyValidationResult> {
    try {
      const response = await fetch(`${this.apiUrl}/validate`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        return this.handleApiError(response);
      }
      
      const data = await response.json();
      return {
        valid: true,
        status: 'valid',
        expiresAt: new Date(data.expiresAt)
      };
    } catch (error) {
      return { valid: false, status: 'error' };
    }
  }
  
  // Fetch employees with pagination
  public static async getEmployees(options?: {
    page?: number;
    limit?: number;
    updatedSince?: Date;
  }): Promise<ApiResponse<Employee[]>> {
    // Implementation details...
  }
  
  // Transform API data to match our schema
  public static transformEmployeeData(apiEmployee: any): Employee {
    return {
      employeeId: apiEmployee.id,
      firstName: apiEmployee.first_name,
      lastName: apiEmployee.last_name,
      email: apiEmployee.email,
      startDate: new Date(apiEmployee.start_date),
      endDate: apiEmployee.end_date ? new Date(apiEmployee.end_date) : null,
      isActive: apiEmployee.status === 'active',
    };
  }
  
  // Helper methods
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
  
  private static handleApiError(response: Response): ApiKeyValidationResult {
    // Error handling logic...
  }
}
```

### Data Synchronization
- Manual and scheduled sync options
- Incremental updates based on last sync date
- Detailed sync history and logging
- Conflict resolution strategies

### Example API Flow
1. Validate API key status
2. Fetch employee data from Hailey HR
3. Transform data to match database schema
4. Update or create employee records
5. Log sync results

---

## Secure API Key Management

### Implementation Approach
- Server-side storage in database
- No client-side exposure of keys
- Regular validation of key status
- Expiration tracking and notifications

### User Interface
- Admin-only access to API key settings
- Secure form with validation
- Real-time status indicators
- Clear error messages and guidance

### Code Example
```typescript
// API key validation
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    const response = await fetch(`${apiUrl}/validate`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      return { valid: false, status: 'invalid' };
    }
    
    const data = await response.json();
    return {
      valid: true,
      status: 'valid',
      expiresAt: new Date(data.expiresAt)
    };
  } catch (error) {
    return { valid: false, status: 'error' };
  }
}
```

---

## Fun and Innovative Features

### Interactive Dashboard Elements
- Draggable widgets for customized layouts
- Real-time updates with WebSocket connections
- Animated data visualizations with framer-motion
- Dark/light mode toggle with system preference detection

### Framer Motion Animations
- Powerful animation library integrated throughout the application
- Staggered animations for survey response cards with fade and slide effects
- Interactive hover animations that enhance user engagement
- Smooth modal transitions with orchestrated entry and exit animations

```typescript
// Example of staggered animations with Framer Motion
export const SurveyResponsesList = ({ responses }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0px 5px 15px rgba(0,0,0,0.1)"
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4"
    >
      {responses.map(response => (
        <motion.div
          key={response.id}
          variants={item}
          whileHover="hover"
          className="bg-white p-4 rounded-lg shadow"
        >
          {/* Response card content */}
        </motion.div>
      ))}
    </motion.div>
  );
};
```

### Animation Features Used
- **Variants**: Predefined animation states for consistent animations
- **Staggered Children**: Sequential animations for list items
- **Gesture Animations**: Interactive animations triggered by user actions
- **Layout Animations**: Smooth transitions when elements change size or position
- **AnimatePresence**: Controlled animations for elements entering and exiting the DOM

### Smart Survey Logic
- Conditional questions based on previous answers
- Sentiment analysis of free-text responses
- Progress saving for long surveys
- Automatic follow-up scheduling based on responses

### Developer Experience
- Custom ESLint rules for consistent code style
- Husky pre-commit hooks for quality control
- Storybook component documentation
- Automated testing with Jest and React Testing Library

### Performance Optimizations
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Server-side rendering for SEO and initial load
- Edge caching for static content

---

## Database Design

### Schema Overview
- Relational PostgreSQL database
- Prisma ORM for type-safe queries
- Models for surveys, employees, and system data

### Key Models
- **SurveyLink**: Unique links for client feedback
- **SurveyResponse**: Client feedback data
- **Employee**: Employee information from Hailey HR
- **EmployeeDataSync**: Sync history and status

### Schema Example
```prisma
model Employee {
  id            String    @id @default(cuid())
  employeeId    String    @unique // External ID from Hailey HR
  firstName     String
  lastName      String
  email         String?
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([startDate, endDate])
  @@index([isActive])
}
```

---

## Dashboard Features

### Analytics
- Survey response rates and trends
- NPS and satisfaction metrics
- Employee retention analytics
- Data visualization components

### Employee Data Management
- Employee list with filtering options
- Data synchronization controls
- Sync history and status tracking
- Error reporting and troubleshooting

### Survey Management
- Create and manage survey links
- View and export survey responses
- Response rate tracking
- Automated notifications

---

## Security Considerations

### Authentication Security
- OAuth 2.0 with Google
- Domain restriction for company emails
- CSRF protection with Next.js
- Secure session management

### API Security
- Server-side API key storage
- No client-side exposure of credentials
- Rate limiting on sensitive endpoints
- Input validation and sanitization

### Data Protection
- Type-safe database operations with Prisma
- Proper error handling without leaking information
- Secure form submission with validation
- Role-based access controls

---

## Development Challenges & Solutions

### Type Safety with Prisma
- Challenge: Maintaining type safety with custom models
- Solution: Proper type assertions and Prisma client configuration

### API Integration
- Challenge: Handling API errors and rate limits
- Solution: Robust error handling and retry mechanisms

### Authentication Restrictions
- Challenge: Limiting access to company emails
- Solution: Custom NextAuth callbacks and middleware

---

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Automated reporting via email
- Mobile-optimized interface
- Multi-language support

### Technical Improvements
- Enhanced caching strategies
- Real-time updates with WebSockets
- Improved error tracking and monitoring
- Performance optimizations

---

## Conclusion

### Project Impact
- Streamlined feedback collection process
- Improved employee data management
- Enhanced analytics for decision-making
- Secure and maintainable codebase

### Key Takeaways
- Next.js provides a powerful full-stack framework
- TypeScript ensures type safety across the application
- Prisma simplifies database operations
- NextAuth offers flexible authentication options

### Questions?

---

## Presentation Slides

### Slide 1: Project Overview
**Projektöversikt**
*Här presenterar jag vår Feedback Portal, en modern webbapplikation som hjälper oss att samla in och analysera kundåterkoppling. Jag kommer att visa hur vi har byggt en säker plattform med en användarvänlig dashboard och integration med våra befintliga system.*

- Next.js 15 web application for collecting client feedback
- Secure dashboard with analytics and reporting
- Employee data integration with Hailey HR API
- Authentication restricted to company emails

### Slide 2: Technical Stack
**Teknisk stack**
*Vår applikation är byggd med moderna teknologier som ger oss både prestanda och utvecklingseffektivitet. Next.js ger oss möjlighet att kombinera server- och klientkomponenter för optimal användarupplevelse.*

```
Frontend: Next.js 15, React, TypeScript, Tailwind CSS
Backend: Next.js API routes, Server Actions
Database: PostgreSQL with Prisma ORM
Authentication: NextAuth.js with Google OAuth
```

### Slide 3: Prisma Database Integration
**Databasintegration med Prisma**
*Vi använder Prisma ORM för att hantera vår databas på ett typsäkert sätt. Detta ger oss automatisk kodkomplettering och minskar risken för fel. Här ser vi hur vi konfigurerar Prisma-klienten för att undvika problem med hot reloading under utveckling.*

```typescript
// Global client configuration
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
```

### Slide 4: Client Feedback System
**Kundfeedbacksystem**
*För att göra det enkelt för kunder att ge feedback har vi implementerat ett system som känner igen återkommande användare. Vi sparar information i localStorage så att kunder inte behöver fylla i sina uppgifter flera gånger.*

```typescript
// Client recognition without login
export function SurveyForm({ uniqueCode, clientName, companyName }) {
  useEffect(() => {
    // Store client info in localStorage
    localStorage.setItem('clientInfo', JSON.stringify({
      name: clientName,
      company: companyName,
      lastAccess: new Date().toISOString()
    }));
  }, [clientName, companyName]);
  
  // Form implementation...
}
```

### Slide 5: NextAuth Implementation
**Implementering av autentisering**
*Vi använder NextAuth för att hantera autentisering med Google OAuth. Vi har konfigurerat systemet så att endast användare med vår företagsdomän kan logga in på dashboarden, vilket ger oss en säker och smidig inloggningsprocess.*

```typescript
// API route configuration
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow company email addresses
      return user.email?.endsWith('@kumpan.se') ?? false;
    }
  }
};
```

### Slide 6: Protected Routes with Middleware
**Skyddade rutter med Middleware**
*För att skydda känsliga delar av applikationen använder vi Next.js middleware. Detta kontrollerar om användaren är autentiserad innan de får tillgång till dashboarden och omdirigerar dem till inloggningssidan om de inte är det.*

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(
    (prefix) => path.startsWith(prefix)
  );

  if (!isProtectedPath) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

### Slide 7: Hailey HR API Integration
**Integration med Hailey HR API**
*För att hålla vår medarbetarinformation uppdaterad har vi integrerat med Hailey HR API. Vår klass hanterar autentisering, datahämtning och transformering av data för att passa vår databasmodell.*

```typescript
export class HaileyHRApi {
  private static apiKey: string | null = null;
  private static apiUrl = 'https://api.haileyhr.com/v1';
  
  // Fetch employees with pagination
  public static async getEmployees(options?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Employee[]>> {
    // Implementation...
  }
  
  // Transform API data to match our schema
  public static transformEmployeeData(apiEmployee: any): Employee {
    return {
      employeeId: apiEmployee.id,
      firstName: apiEmployee.first_name,
      lastName: apiEmployee.last_name,
      // Additional fields...
    };
  }
}
```

### Slide 8: Framer Motion Animations
**Animationer med Framer Motion**
*För att förbättra användarupplevelsen har vi implementerat animationer med Framer Motion. Detta ger en mer engagerande och polerad känsla när användare interagerar med applikationen, särskilt när de visar enkätsvar.*

```typescript
// Staggered animations for survey responses
export const SurveyResponsesList = ({ responses }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    hover: { scale: 1.03 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {responses.map(response => (
        <motion.div key={response.id} variants={item} whileHover="hover">
          {/* Content */}
        </motion.div>
      ))}
    </motion.div>
  );
};
```

### Slide 9: Database Schema
**Databasschema**
*Vårt databasschema är utformat för att hantera enkätlänkar, svar och medarbetarinformation. Med Prisma kan vi definiera relationerna mellan dessa modeller på ett tydligt och koncist sätt.*

```prisma
model SurveyLink {
  id          Int       @id @default(autoincrement())
  uniqueCode  String    @unique
  clientName  String
  companyName String
  createdAt   DateTime  @default(now())
  response    SurveyResponse?
}

model Employee {
  id            String    @id @default(cuid())
  employeeId    String    @unique
  firstName     String
  lastName      String
  email         String?
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean   @default(true)
}
```

### Slide 10: Development Challenges & Solutions
**Utvecklingsutmaningar och lösningar**
*Under utvecklingen stötte vi på flera utmaningar som vi löste på kreativa sätt. Typsäkerhet med Prisma, API-integration och autentiseringsbegränsningar var några av de områden där vi hittade effektiva lösningar.*

- **Type Safety with Prisma**: Solved with proper type assertions
- **API Integration**: Implemented robust error handling and retry mechanisms
- **Authentication Restrictions**: Used custom NextAuth callbacks and middleware
- **UI Performance**: Optimized with code splitting and server components
