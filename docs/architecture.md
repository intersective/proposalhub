# ProposalHub Architecture Document

## 1. Overview
ProposalHub is a Next.js 15+ application designed for creating and managing business proposals. The application follows modern web development practices and utilizes a robust tech stack for optimal performance and maintainability.

## 2. Tech Stack
### Core Technologies
- **Framework**: Next.js 15+
- **Language**: TypeScript
- **UI Framework**: React 18
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (Auth.js)
- **State Management**: TanStack React Query
- **Database**: Firebase (with Firebase Admin SDK)
- **Editor**: TipTap
- **PDF Processing**: pdf-lib, pdfjs-dist
- **Image Processing**: Sharp

## 3. Application Structure
```
app/
├── (admin)/          # UI - Management interfaces
├── (viewer)/         # UI - Proposal recipient/review interfaces
├── (auth)/           # UI - Authentication related pages
├── (site)/           # UI - Public site pages
├── components/       # Reusable UI components
├── api/              # API routes
├── lib/              # Utility functions and shared logic
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

## 4. Key Features
### Authentication System
- Multi-provider authentication (Google, Apple, LinkedIn, Microsoft)
- Passkey support
- Session management with secure cookie handling
- Protected routes and middleware

### Team Management
- Organization management
- Team member management
- LinkedIn integration for profile enrichment
- Role-based access control

### Proposal System
- Rich text editing with TipTap
- PDF generation and processing
- Document version control
- Review and approval workflow

## 5. Architecture Patterns
### Frontend
- React Server Components (RSC) first approach
- Client Components when necessary (marked with 'use client')
- Component-based architecture with modular design
- Responsive design with mobile-first approach

### API Layer
- Route handlers following Next.js 15+ conventions
- RESTful API design
- Proper error handling and validation
- Rate limiting and security measures

### State Management
- Server-side state management with React Query
- Local state with React hooks
- Optimistic updates for better UX
- Proper caching strategies

## 6. Security Measures
- JWT-based authentication
- Environment variable protection
- CORS configuration
- Input validation and sanitization
- Secure cookie handling
- Rate limiting on sensitive endpoints

## 7. Performance Optimizations
- Image optimization with Sharp
- Code splitting and lazy loading
- Server-side rendering (SSR)
- Static site generation where applicable
- Efficient caching strategies

## 8. Development Practices
### Code Organization
- Feature-based directory structure
- Shared components in components directory
- Type-safe development with TypeScript
- Consistent naming conventions

### Quality Assurance
- ESLint for code quality
- TypeScript for type safety
- Proper error handling
- Logging and monitoring

## 9. Third-party Integrations
- LinkedIn API for profile enrichment
- Email service (Nodemailer)
- OpenAI integration
- Cloud storage (Firebase)

## 10. Deployment and Infrastructure
- Vercel/Firebase hosting
- Environment-based configuration
- Continuous Integration/Deployment
- Proper error monitoring and logging

## 11. Future Considerations
- Scalability improvements
- Additional authentication providers
- Enhanced PDF processing capabilities
- Advanced team collaboration features
- Analytics and reporting
- AI-powered features expansion

## 12. Best Practices
- Mobile-first responsive design
- Accessibility compliance
- SEO optimization
- Performance monitoring
- Security best practices
- Code documentation

This architecture document serves as a living guide for the ProposalHub application and should be updated as the application evolves.