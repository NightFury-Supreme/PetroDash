# Contributing to PteroDash

Thank you for your interest in contributing to PteroDash! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5+
- Git
- Basic knowledge of React, Express.js, and MongoDB

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/NightFury-Supreme/PetroDash.git`
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Set up environment variables (see `env.example` files)
5. Start development servers:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```

## 📝 Code Style

### Backend (Node.js/Express)
- Use ES6+ features
- Follow Express.js best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for complex functions

### Frontend (React/Next.js)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety
- Implement proper error boundaries
- Use Tailwind CSS for styling

### General
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow the existing code structure

## 🔧 Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the provided PR template
   - Describe your changes clearly
   - Link any related issues

## 📋 Pull Request Guidelines

### Before submitting a PR:
- [ ] Code follows the project's style guidelines
- [ ] `npm run lint` passes with 0 warnings/errors (Strict `--max-warnings=0` policy)
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Security considerations are addressed

### PR Template
- **Type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Description**: Clear description of changes
- **Breaking Changes**: List any breaking changes
- **Testing**: Describe how to test the changes
- **Screenshots**: If UI changes are involved

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, version)
- Screenshots if applicable
- Console errors/logs

## 💡 Feature Requests

For feature requests:
- Describe the problem you're solving
- Explain your proposed solution
- Consider alternatives
- Provide use cases

## 📚 Documentation

Help improve documentation by:
- Fixing typos and grammar
- Adding missing information
- Improving examples
- Translating to other languages

## 🧪 Testing

### Backend Testing
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Test database operations
- Mock external services

### Frontend Testing
- Component testing with React Testing Library
- Integration tests for user flows
- E2E tests for critical paths
- Accessibility testing

## 🔒 Security

- Never commit sensitive information
- Follow security best practices
- Report security vulnerabilities privately
- Validate all user inputs
- Implement proper authentication/authorization

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our community server
- **Email**: Contact the maintainers directly

## 🎯 Areas for Contribution

- **Bug fixes**: Help fix reported issues
- **Feature development**: Implement requested features
- **Documentation**: Improve docs and guides
- **Testing**: Add tests and improve coverage
- **Performance**: Optimize code and improve speed
- **Accessibility**: Make the app more accessible
- **Internationalization**: Add multi-language support

## 📄 License

By contributing to PteroDash, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PteroDash! 🚀

