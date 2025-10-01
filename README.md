# 🚀 TempoVoice Phase 2 - Multi-Tenant Voice AI Agent Management Dashboard

A comprehensive management dashboard for deploying, configuring, and monitoring voice AI agents across multiple tenants.

## 🎯 Overview

TempoVoice Phase 2 is a multi-tenant voice AI agent management system that allows organizations to create, deploy, and manage voice AI agents for their customers. Built with Next.js, TypeScript, and modern web technologies.

## ✨ Features

### 🔐 Authentication & User Management
- **Role-based Access Control**: Admin and Developer roles with different permissions
- **User Creation**: Admins can create new users with email invites
- **Password Security**: Strong password requirements (12+ chars, uppercase, lowercase, numbers, symbols)
- **Email Invites**: Automatic email invitations with login credentials

### 🤖 Agent Management
- **Agent Lifecycle**: Create, start, stop, and delete voice AI agents
- **Status Tracking**: DRAFT, PENDING, DEPLOYING, ACTIVE, ERROR states
- **Configuration**: Knowledge base, prompts, guardrails, and integration settings
- **Webhook Management**: Automatic webhook endpoint generation

### 📞 Phone Number Management
- **Number Pool**: Add and manage available phone numbers
- **Automatic Assignment**: Phone numbers assigned to agents when created
- **Availability Tracking**: Mark numbers as available/unavailable
- **Cleanup**: Automatic freeing when agents are deleted

### 🎨 Modern UI/UX
- **Vanguard Design System**: Professional white/blue theme
- **Responsive Layout**: Mobile-friendly design
- **Dynamic Dashboard**: Real-time data with loading states
- **Background Animations**: Floating particles with different sizes
- **Button Effects**: Rainbow/blue glare effects on primary buttons

### 📊 Dashboard Features
- **Overview**: Stats, recent activity, and performance metrics
- **Quick Actions**: Easy access to create agents and view calls
- **Analytics**: Performance insights and monitoring
- **Navigation**: Role-based menu with conditional access

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database management
- **SQLite** - Local development database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Nodemailer** - Email service

### Database Schema
- **Users**: Authentication and role management
- **Agents**: Voice AI agent configurations
- **Phone Numbers**: Phone number pool management
- **Calls**: Call history and transcripts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saadhaniftaj/TempoVoice-phase2-Console.git
   cd TempoVoice-phase2-Console
   ```

2. **Install dependencies**
   ```bash
   cd dashboard
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with admin credentials:
     - Email: `admin@tempovoice.com`
     - Password: `admin123`

## 📁 Project Structure

```
dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API routes
│   ├── dashboard/                # Dashboard pages
│   └── globals.css               # Global styles
├── src/
│   ├── components/               # React components
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utility libraries
│   └── types/                    # TypeScript types
├── prisma/                       # Database schema
├── public/                       # Static assets
└── scripts/                      # Database scripts
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the dashboard directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (Development)
EMAIL_USER="ethereal.user@ethereal.email"
EMAIL_PASS="ethereal.pass"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Database Setup
The application uses SQLite for local development. For production, you can configure PostgreSQL or MySQL.

## 🚀 Deployment

### AWS Deployment (Production Ready)
The system is designed for AWS deployment with:
- **Lambda Functions** - Serverless compute for agent deployment
- **Fargate** - Containerized agent execution
- **ECR** - Container registry
- **ALB** - Load balancing for multiple calls
- **S3** - Call transcript storage
- **SNS** - WhatsApp notifications
- **DynamoDB** - Production database

### Local Development
The current setup is optimized for local development and testing.

## 👥 User Roles

### Admin Users
- ✅ Full access to all features
- ✅ User management (create/delete users)
- ✅ System settings access
- ✅ All agent and number management

### Developer Users
- ✅ Agent creation and management
- ✅ Phone number management
- ✅ Call monitoring
- ✅ Analytics access
- ❌ User management
- ❌ System settings

## 📧 Email System

### Development Mode
- Email details logged to console
- No SMTP configuration needed
- Perfect for testing

### Production Mode
- Configure SMTP credentials
- Beautiful HTML email templates
- Professional branding

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role Protection**: API endpoints protected by role verification
- **Input Validation**: Server-side validation for all inputs
- **Self-Protection**: Admins cannot delete their own accounts

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/[id]` - Delete user

### Agents
- `GET /api/agents` - List user's agents
- `POST /api/agents` - Create new agent
- `DELETE /api/agents/[id]` - Delete agent
- `POST /api/agents/[id]/start` - Start agent
- `POST /api/agents/[id]/stop` - Stop agent

### Phone Numbers
- `GET /api/phone-numbers` - List phone numbers
- `POST /api/phone-numbers` - Add phone number
- `DELETE /api/phone-numbers/[id]` - Delete phone number

## 🎨 Design System

### Color Palette
- **Primary Blue**: #3b82f6
- **Background**: White (#ffffff)
- **Text**: Dark gray (#1f2937)
- **Accents**: Blue gradients and glows

### Components
- **Vanguard Cards**: Elevated cards with subtle shadows
- **Buttons**: Primary (blue) and secondary (outline) styles
- **Forms**: Consistent input styling with validation
- **Navigation**: Sidebar with role-based menu items

## 🚀 Future Enhancements

- **Real-time Updates**: WebSocket integration for live status updates
- **Advanced Analytics**: Detailed performance metrics and reporting
- **Multi-language Support**: Internationalization
- **API Documentation**: Swagger/OpenAPI integration
- **Testing**: Comprehensive test suite
- **Monitoring**: Application performance monitoring

## 📝 License

This project is proprietary software developed for TempoVoice.

## 🤝 Contributing

This is a private project. For access and contribution guidelines, please contact the development team.

## 📞 Support

For technical support or questions, please contact:
- Email: support@tempovoice.com
- Documentation: [Internal Wiki]
- Issues: [GitHub Issues]

---

**TempoVoice Phase 2** - Multi-tenant Voice AI Agent Management Platform
Built with ❤️ by the TempoVoice Team
