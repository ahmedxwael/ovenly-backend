# Ovenly Backend

Backend API for Ovenly application.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Yarn package manager

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

### Build

```bash
yarn build
```

### Start Production Server

```bash
yarn start
```

### Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build the project for production
- `yarn start` - Start production server
- `yarn format` - Format code with Prettier
- `yarn lint` - Lint code with ESLint

## Project Structure

```
src/
├── config/          # Configuration files
├── core/           # Core application logic
├── middlewares/    # Express middlewares
├── modules/        # Feature modules
├── shared/         # Shared utilities
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=...
# Add other required environment variables
```

## Deployment

This project is configured for Vercel deployment. The build process uses `tsc` and `tsc-alias` to compile TypeScript and resolve path aliases.
