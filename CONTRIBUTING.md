# Contributing to Tempo Voice

Thank you for your interest in contributing to Tempo Voice! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- AWS Account (for testing AI features)
- Twilio Account (for testing voice features)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/tempo-voice.git
   cd tempo-voice
   ```

2. **Install Dependencies**
   ```bash
   # Dashboard
   cd dashboard
   npm install
   
   # Agent Template
   cd ../agent-template
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp env.example .env.local
   cd dashboard
   cp env.local.template .env.local
   ```

4. **Database Setup**
   ```bash
   cd dashboard
   npx prisma generate
   npx prisma db push
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Commit Convention
We follow conventional commits:
```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Running Tests
```bash
# Dashboard tests
cd dashboard
npm run test

# Build test
npm run build

# Lint check
npm run lint
```

### Testing Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Docker build works
- [ ] Environment variables are properly configured

## 📝 Pull Request Process

### Before Submitting
1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests if applicable
   - Update documentation

3. **Test thoroughly**
   - Run all tests
   - Test in development environment
   - Verify Docker build works

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Pull Request Guidelines
- **Title**: Clear, descriptive title
- **Description**: Detailed description of changes
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Describe how you tested the changes
- **Breaking Changes**: Note any breaking changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Docker build successful

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try latest version
3. Test in clean environment

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome, Firefox]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of the desired solution

**Describe alternatives you've considered**
Alternative solutions or workarounds

**Additional context**
Any other context about the feature request
```

## 🏗️ Architecture Guidelines

### Frontend (Dashboard)
- Use Next.js App Router
- Follow component composition patterns
- Use TypeScript interfaces for type safety
- Implement proper error boundaries
- Use Tailwind CSS for styling

### Backend (Agent Template)
- Use Fastify for server setup
- Implement proper error handling
- Use WebSocket for real-time communication
- Follow async/await patterns
- Implement proper logging

### Database
- Use Prisma ORM
- Follow database naming conventions
- Implement proper migrations
- Use transactions for complex operations

## 📚 Documentation

### Code Documentation
- Document complex functions
- Use JSDoc for API documentation
- Include inline comments for complex logic
- Update README for new features

### API Documentation
- Document all API endpoints
- Include request/response examples
- Document error codes and messages
- Keep documentation up to date

## 🔒 Security

### Security Guidelines
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines
- Use HTTPS in production

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting implemented

## 🚀 Release Process

### Version Numbering
We follow semantic versioning (SemVer):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Docker images built
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow professional communication standards

### Getting Help
- Check documentation first
- Search existing issues
- Ask questions in discussions
- Join our community channels

## 📞 Contact

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: [Contact information]

## 🙏 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Tempo Voice! 🎉
