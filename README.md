# Tempo Voice - AI Voice Agent Platform

A comprehensive AI voice agent platform built with Next.js, featuring real-time voice interactions, agent management, and advanced AI capabilities powered by AWS Bedrock Nova Sonic.

## 🚀 Features

### Core Functionality
- **AI Voice Agents**: Create and manage intelligent voice agents
- **Real-time Voice Processing**: Powered by AWS Bedrock Nova Sonic AI
- **Twilio Integration**: Seamless phone call handling and WebSocket streaming
- **Agent Management**: Full CRUD operations for voice agents
- **Folder Organization**: Organize agents into logical folders
- **File Upload Support**: Upload documents for AI configuration (PDF, DOCX, TXT, MD, CSV)

### Dashboard Features
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Authentication**: Secure JWT-based authentication system
- **Real-time Updates**: Live agent status and call monitoring
- **Analytics**: Comprehensive call analytics and performance metrics
- **Phone Number Management**: Manage Twilio phone numbers
- **User Management**: Multi-user support with role-based access

### Technical Features
- **Containerized Deployment**: Full Docker support with docker-compose
- **Database Management**: PostgreSQL with Prisma ORM
- **API-First Architecture**: RESTful APIs with comprehensive endpoints
- **File Processing**: Advanced text extraction from various document formats
- **Error Handling**: Robust error handling and logging
- **Health Monitoring**: Built-in health checks and monitoring

## 🏗️ Architecture

### Frontend (Dashboard)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API and Zustand
- **UI Components**: Radix UI primitives
- **Authentication**: JWT-based with secure token handling

### Backend (Agent Template)
- **Runtime**: Node.js with Fastify
- **WebSocket**: Real-time audio streaming
- **AI Integration**: AWS Bedrock Nova Sonic
- **Voice Processing**: Twilio Programmable Voice
- **Audio Codecs**: μ-law and LPCM support

### Database
- **ORM**: Prisma with PostgreSQL
- **Schema**: Comprehensive data models for agents, users, calls, and folders
- **Migrations**: Automated database schema management

## 📁 Project Structure

```
tempo-voice/
├── dashboard/                 # Next.js Dashboard Application
│   ├── app/                  # App Router pages and API routes
│   ├── src/                  # Source code and components
│   ├── prisma/               # Database schema and migrations
│   ├── Dockerfile            # Container configuration
│   ├── docker-compose.yml    # Service orchestration
│   └── build.sh              # Build automation script
├── agent-template/           # Voice Agent Server
│   ├── dist/                 # Compiled JavaScript
│   ├── src/                  # TypeScript source (if available)
│   └── package.json          # Dependencies and scripts
├── lambda/                   # AWS Lambda functions (if applicable)
├── terraform/                # Infrastructure as Code (if applicable)
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- AWS Account with Bedrock access
- Twilio Account with Programmable Voice

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tempo-voice
   ```

2. **Setup Dashboard**
   ```bash
   cd dashboard
   npm install
   cp env.local.template .env.local
   # Configure your environment variables
   npm run dev
   ```

3. **Setup Agent Template**
   ```bash
   cd agent-template
   npm install
   # Configure environment variables
   npm start
   ```

### Production Deployment

1. **Using Docker Compose**
   ```bash
   cd dashboard
   ./build.sh
   ```

2. **Manual Docker Build**
   ```bash
   cd dashboard
   docker-compose build
   docker-compose up -d
   ```

## 🔧 Configuration

### Environment Variables

#### Dashboard (.env.local)
```bash
# Database
DATABASE_URL="file:./dev.db"  # Development
# DATABASE_URL="postgresql://..."  # Production

# JWT
JWT_SECRET="your-jwt-secret"

# AWS
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_API_SECRET="your-twilio-secret"
TWILIO_API_SID="your-twilio-api-sid"
```

#### Agent Template (.env)
```bash
# AWS Bedrock
AWS_PROFILE="bedrock-test"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_API_SECRET="your-twilio-secret"
TWILIO_API_SID="your-twilio-api-sid"
```

## 📚 API Documentation

### Dashboard APIs

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/[id]` - Get agent details
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent
- `POST /api/agents/[id]/start` - Start agent
- `POST /api/agents/[id]/stop` - Stop agent

#### Folders
- `GET /api/folders` - List all folders
- `POST /api/folders` - Create new folder
- `PUT /api/agents/[id]/folder` - Move agent to folder

#### File Upload
- `POST /api/upload/extract-text` - Upload and extract text from documents

### Agent Template APIs

#### WebSocket
- `WebSocket /ws` - Real-time audio streaming
- Handles Twilio media streams and Bedrock AI responses

## 🐳 Docker Deployment

### Services
- **dashboard**: Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **nginx**: Reverse proxy (optional, ports 80/443)

### Commands
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose build --no-cache
```

## 🧪 Testing

### Dashboard Testing
```bash
cd dashboard
npm run build  # Test production build
npm run lint   # Run ESLint
```

### Agent Testing
```bash
cd agent-template
npm start      # Start agent server
# Test with Twilio webhook
```

## 📊 Monitoring

### Health Checks
- Dashboard: `GET /api/health`
- Database: Built-in PostgreSQL health checks
- Agent: WebSocket connection monitoring

### Logging
- Application logs via console
- Error tracking and debugging
- Performance monitoring

## 🔒 Security

### Authentication
- JWT-based authentication
- Secure token storage
- Role-based access control

### Data Protection
- Environment variable configuration
- Secure database connections
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

#### Development Server Issues
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check environment variables

#### Database Issues
- Run migrations: `npx prisma db push`
- Reset database: `npx prisma db push --force-reset`

#### Docker Issues
- Clean containers: `docker-compose down --volumes`
- Rebuild images: `docker-compose build --no-cache`

### Getting Help
- Check the logs: `docker-compose logs -f`
- Review environment configuration
- Ensure all prerequisites are installed

## 🎯 Roadmap

### Planned Features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice cloning capabilities
- [ ] Advanced AI model selection
- [ ] Real-time collaboration
- [ ] Mobile application
- [ ] Advanced security features

### Technical Improvements
- [ ] Performance optimization
- [ ] Enhanced error handling
- [ ] Comprehensive testing suite
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting
- [ ] Documentation improvements

---

**Built with ❤️ using Next.js, AWS Bedrock, and Twilio**