# Echo

A social media API built with NestJS, TypeORM, PostgreSQL, Socket.io, Redis, and Elasticsearch

## Core Features

### Authentication & Authorization

- Email and Google OAuth authentication
- Account verification and password recovery
- Role-based access control
- Refresh token rotation with automatic cleanup

### User Accounts

- Profile management with avatar uploads
- Follow/unfollow system with request approval for private accounts
- Account blocking and privacy controls
- Account deactivation and reactivation

### Content Management

- Posts with nested replies
- Reposting functionality
- Post bookmarking
- Post likes
- AI-powered content moderation before publishing
- Post pinning

### Real-time Chat

- Direct and group conversations
- Message reactions and editing
- Message delivery and read receipts
- Typing indicators
- Conversation archiving, pinning, and muting
- Group administration (add/remove members, role management)

### Search & Discovery

- Elasticsearch-powered search for posts and users
- Cursor-based pagination
- Relevance-based sorting

### Notifications

- Real-time notifications for social interactions
- Unread notification tracking

### Additional Features

- Multi-language support (English and Arabic)
- Custom blocked words filtering
- Scheduled cleanup tasks for expired tokens and deactivated accounts

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Search**: Elasticsearch
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **AI**: Content moderation integration
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/echo.git
cd echo

# Configure your environment variables
cp .env.example .env

# Start server with docker compose
docker-compose up -d
```

### Available Services

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **pgAdmin**: http://localhost:5050
- **RedisInsight**: http://localhost:5540
- **Kibana**: http://localhost:5601

## Project Structure

```bash
src/
├── modules/ # Feature modules
├── common/ # Shared utilities, guards, decorators
├── config/ # Configuration files
├── database/ # Migrations and seeds
└── i18n/ # Internationalization files
```
