# Kumpan Feedback Portal

A modern web application for collecting and managing client feedback through customized survey links. Built with Next.js and React, this portal enables Kumpan team members to generate personalized survey links, send them via email, and track responses.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS with custom purple theme
- **Email**: Resend API with React Email templates
- **Package Manager**: pnpm

## Features

- Generate unique survey links for clients
- Send personalized emails with survey links
- Track who created each survey
- Dashboard for viewing and managing responses
- Beautiful, responsive UI with custom branding
- User authentication with Google accounts

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

> **Note:** We use pnpm as our package manager for faster, more efficient dependency management.

## Environment Variables

Create a `.env.local` file with the following variables:

```
DATABASE_URL=your_postgres_connection_string
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_sender_email
NEXT_PUBLIC_URL=your_public_url
```

## Created With 💜 By

[@emiitogaza](https://github.com/emiitogaza) - Turning client feedback into actionable insights at Kumpan since 2025 ✨

*"Great feedback is the breakfast of champions!"*
