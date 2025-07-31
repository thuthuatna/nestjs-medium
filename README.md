# nestjs-medium

A Medium.com-like API built with [NestJS] and Drizzle ORM.

## Features

- User authentication (register, login) with JWT
- User profiles with follow/unfollow functionality
- Article creation, reading, updating, and deletion
- Article commenting system
- Favoriting articles
- Built with TypeScript, tested with Jest

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL

### Installation

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and update with your DB credentials.

### Database

Run migrations:

```bash
npx drizzle-kit migrate
```

### Running the App

```bash
npm run start:dev
```

### Testing

```bash
npm run test
```

## Project Structure

```
src/
├── app.module.ts            # Main application module
├── main.ts                  # Application entry point
├── articles/                # Articles module with controllers and services
├── auth/                    # Authentication module with JWT strategy
├── comments/                # Comments module for article comments
├── database/                # Database configuration and entities
│   └── entities/            # Drizzle ORM entity definitions
├── profiles/                # User profiles module
└── users/                   # Users module
```

## API

- RESTful endpoints under `/api`
- JWT authentication required for most endpoints
- See [Medium API spec](https://realworld-docs.netlify.app/docs/specs/backend-specs/endpoints/) for details

## License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.
