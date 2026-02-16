# Contributing to ProfileStalk

First off, thank you for considering contributing to ProfileStalk! It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by respect, professionalism, and inclusivity. Please be kind and considerate in all interactions.

### Our Standards

- **Be Respectful**: Treat everyone with respect and consideration
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Collaborative**: Work together towards the best solutions
- **Be Patient**: Remember that everyone has different skill levels

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Great Bug Reports** include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs. actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)
- **Sample image URLs** (if relevant to the bug)

**Example Bug Report:**

```markdown
## Bug: EXIF dates not parsing correctly for iPhone images

**Environment:**
- OS: Windows 11
- Node: 18.17.0
- Browser: Chrome 120

**Steps to Reproduce:**
1. Upload an iPhone 14 Pro photo
2. View the report page
3. Check EXIF Capture Time

**Expected:** 2024-01-15T10:30:00Z
**Actual:** "Invalid Date"

**Sample Image:** [link or attachment]
```

### Suggesting Enhancements

We love feature suggestions! Please include:

- **Use case**: Why is this feature needed?
- **User story**: "As a [user type], I want [goal] so that [benefit]"
- **Implementation ideas**: Any technical thoughts?
- **Examples**: Links to similar features in other tools

### Pull Requests

1. **Fork the repo** and create a feature branch from `main`
2. **Follow coding standards** (see below)
3. **Add tests** if you're adding functionality
4. **Update documentation** if you're changing behavior
5. **Keep PRs focused** - one feature or fix per PR
6. **Write clear commit messages**

## Development Setup

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier)
- Git

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/profilestalk.git
cd profilestalk

# Install dependencies
npm install

# Setup D1 database
wrangler login
npx wrangler d1 execute profile-image-intel --local --file=./migrations/0001_initial_schema.sql

# Start development server
npm run dev
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm run dev
npm test

# Type check
npm run typecheck

# Commit your changes
git add .
git commit -m "feat: add feature description"

# Push to your fork
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

## Pull Request Process

1. **Update documentation** if you're changing public APIs
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass**: `npm test && npm run typecheck`
4. **Follow commit message conventions** (see below)
5. **Link any related issues** in the PR description
6. **Wait for review** - maintainers will review within 1-2 weeks
7. **Address feedback** if any changes are requested

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Added tests that prove my fix/feature works
- [ ] All tests pass locally (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
```

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Type everything explicitly
export async function analyzeImage(url: string): Promise<AnalysisResult> {
  const buffer: ArrayBuffer = await fetchImage(url);
  return parseBuffer(buffer);
}

// ❌ Bad: Implicit any types
export async function analyzeImage(url) {
  const buffer = await fetchImage(url);
  return parseBuffer(buffer);
}
```

### File Naming

- **Routes**: `snake_case` or `kebab-case` - `reports.$id.tsx`, `api.analyze.ts`
- **Services**: `kebab-case` - `image-analyzer.ts`, `url-fetcher.ts`
- **Types**: `index.ts` in types directory
- **Tests**: Same name as file being tested with `.test.ts` suffix

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: ~100 characters (not strict)
- **Trailing commas**: Yes in multi-line objects/arrays

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Sample every 100th triplet to reduce processing time while maintaining accuracy
const sample = rawPixels.filter((_, i) => i % 100 < 3);

// ❌ Bad: Obvious comment
// Loop through pixels
for (const pixel of pixels) { ... }
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add TIFF file support
fix: correct EXIF date parsing for Canon cameras
docs: update deployment guide
style: format code with prettier
refactor: simplify hash calculation logic
test: add tests for URL validation
chore: update dependencies
```

**Examples:**

- `feat(metadata): add support for XMP tags`
- `fix(database): handle null values in reports table`
- `docs(readme): add troubleshooting section`

## Testing Guidelines

### Unit Tests

- **Test files**: Place next to the file being tested or in `tests/`
- **Coverage**: Aim for >80% coverage on critical paths
- **Run tests**: `npm test` before committing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] URL analysis with various image sources (Instagram, GitHub, etc.)
- [ ] File upload with different formats (JPEG, PNG, GIF, WebP)
- [ ] Report page displays all data correctly
- [ ] Re-check URL functionality
- [ ] Image preview displays properly
- [ ] Mobile responsiveness
- [ ] Console has no errors

### Test Data

Use these for manual testing:

- **GitHub Avatar**: `https://avatars.githubusercontent.com/u/9919`
- **Instagram CDN**: Test with real Instagram profile images
- **Large File**: Test with 10MB+ image
- **Small File**: Test with <1KB image
- **Various Formats**: JPEG, PNG, GIF, WebP, TIFF

## Project Structure

```
profilestalk/
├── .github/              # GitHub templates and workflows
├── app/                  # Application code
│   ├── routes/          # Remix routes (pages + API)
│   ├── services/        # Backend business logic
│   ├── lib/             # Shared utilities
│   ├── types/           # TypeScript type definitions
│   └── styles/          # CSS and Tailwind
├── docs/                # Documentation
├── migrations/          # Database migrations
├── public/              # Static assets
├── tests/               # Test files
├── CONTRIBUTING.md      # This file
├── LICENSE              # MIT License
└── README.md            # Project overview
```

## Documentation

When adding features, update:

- **README.md**: If changing setup or usage
- **docs/DEPLOYMENT.md**: If changing deployment process
- **docs/DEV_REMOTE_DB.md**: If changing database workflow
- **Code comments**: For complex logic

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/YOUR_ORG/profilestalk/discussions)
- **Bug found?** Open an [Issue](https://github.com/YOUR_ORG/profilestalk/issues)
- **Want to chat?** Join our [Discord](#) (if available)

## Recognition

Contributors are recognized in:

- GitHub contributor graph
- Release notes for their contributions
- Special mentions for significant features

---

**Thank you for contributing to ProfileStalk! 🎉**

Your contributions make the internet a more transparent place.
