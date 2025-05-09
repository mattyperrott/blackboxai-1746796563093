# Contributing Guide

Thank you for your interest in contributing to the Epher Secure Chat project! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Code Standards](#code-standards)
5. [Testing Requirements](#testing-requirements)
6. [Security Guidelines](#security-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Documentation](#documentation)

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Constructive feedback only
- Focus on the code, not the person
- Report violations to maintainers

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- Python 3.x (for development server)
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/epher-chat.git

# Install dependencies
cd epher-chat
npm install

# Run tests to verify setup
npm test
```

### Project Structure

```
app/src/main/assets/
├── js/
│   ├── config/          # Configuration files
│   ├── services/        # Core services
│   └── utils/          # Utility functions
├── css/                # Stylesheets
├── tests/              # Test files
├── docs/               # Documentation
└── vendor/             # Third-party libraries
```

## Development Process

### 1. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/bug-description

# For documentation
git checkout -b docs/topic-name
```

### 2. Development Guidelines

- Write clean, maintainable code
- Follow existing patterns and conventions
- Keep changes focused and atomic
- Comment complex logic
- Update documentation as needed

### 3. Commit Messages

Follow the conventional commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test updates
- chore: Maintenance tasks

Example:
```
feat(crypto): implement perfect forward secrecy

- Add key rotation mechanism
- Update message encryption process
- Add tests for new functionality

Closes #123
```

## Code Standards

### JavaScript Style Guide

- Use ES6+ features
- Follow airbnb style guide
- Use meaningful variable names
- Keep functions small and focused
- Use TypeScript-style JSDoc comments

Example:
```javascript
/**
 * Encrypts a message using the current session key.
 * @param {Object} message - The message to encrypt
 * @param {string} message.content - Message content
 * @param {number} message.timestamp - Message timestamp
 * @returns {Promise<Object>} Encrypted message envelope
 * @throws {CryptoError} If encryption fails
 */
async function encryptMessage(message) {
    // Implementation
}
```

### Security Best Practices

- Never store sensitive data in plaintext
- Use secure random number generation
- Validate all inputs
- Implement proper error handling
- Follow least privilege principle

## Testing Requirements

### Test Coverage

- Minimum 80% code coverage
- All new features must include tests
- Update existing tests when modifying features

### Types of Tests

1. **Unit Tests**
```javascript
describe('MessageEncryption', () => {
    it('should encrypt messages correctly', async () => {
        const message = { content: 'test' };
        const encrypted = await encrypt(message);
        expect(encrypted).toHaveProperty('cipher');
        expect(encrypted).toHaveProperty('nonce');
    });
});
```

2. **Integration Tests**
```javascript
describe('MessageFlow', () => {
    it('should handle end-to-end message delivery', async () => {
        const sender = new User('alice');
        const receiver = new User('bob');
        await sender.sendMessage(receiver, 'Hello');
        expect(receiver.messages).toContain('Hello');
    });
});
```

3. **Security Tests**
```javascript
describe('SecurityFeatures', () => {
    it('should prevent message replay attacks', async () => {
        const message = await captureMessage();
        await expect(replayMessage(message)).rejects.toThrow();
    });
});
```

## Security Guidelines

### Code Review Checklist

- [ ] Input validation implemented
- [ ] Proper error handling
- [ ] No sensitive data exposure
- [ ] Secure random number generation
- [ ] Proper key management
- [ ] No hardcoded secrets
- [ ] XSS prevention implemented
- [ ] CSRF protection in place

### Security Testing

- Run security audit: `npm audit`
- Check dependencies: `npm audit fix`
- Run security tests: `npm run test:security`

## Pull Request Process

1. **Before Submitting**
   - Update documentation
   - Add/update tests
   - Run full test suite
   - Check code coverage
   - Run security audit

2. **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Security audit passed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests cover changes
- [ ] Security guidelines followed
```

3. **Review Process**
   - Two approvals required
   - All tests must pass
   - Coverage requirements met
   - Security review for sensitive changes

## Documentation

### Required Documentation

1. **Code Documentation**
   - JSDoc comments for functions
   - Inline comments for complex logic
   - Module documentation
   - Type definitions

2. **Feature Documentation**
   - User guides
   - API documentation
   - Security considerations
   - Configuration options

3. **Update Guides**
   - README.md
   - SECURITY.md
   - API.md
   - DEPLOYMENT.md

### Documentation Style

```javascript
/**
 * @module MessageHandler
 * @description Handles message encryption and delivery
 */

/**
 * Processes an incoming message.
 * @async
 * @param {Object} message - The incoming message
 * @param {string} message.id - Message identifier
 * @param {string} message.content - Message content
 * @param {number} message.timestamp - Message timestamp
 * @returns {Promise<void>}
 * @throws {ValidationError} If message is invalid
 * @throws {CryptoError} If decryption fails
 */
async function processMessage(message) {
    // Implementation
}
```

## Questions and Support

- GitHub Issues: Technical problems
- Discussions: General questions
- Security issues: security@example.com
- Documentation: docs@example.com

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
