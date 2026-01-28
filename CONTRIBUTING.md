# Contributing to Quest

First off, thanks for taking the time to contribute! ❤️

All types of contributions are welcome, from bug reports to new features.

## 🛠️ Development Setup

1. **Prerequisites**:
   - Install [Bun](https://bun.sh/) (recommended) or Node.js.
   - A PostgreSQL instance (or use [Neon](https://neon.tech/)).

2. **Clone and Install**:
   ```bash
   git clone https://github.com/lwshakib/quest-form-builder.git
   cd quest-form-builder
   bun install
   ```

3. **Environment**:
   - Copy `.env.example` to `.env` and fill in the required keys (Google OAuth, Gemini API, Cloudinary).

4. **Database**:
   ```bash
   bun x prisma migrate dev
   ```

5. **Run Locally**:
   ```bash
   bun dev
   ```

## 🤝 How Can I Contribute?

### Reporting Bugs

- **Check for existing issues**: Before opening a new issue, please search the tracker to see if the bug has already been reported.
- **Use a clear and descriptive title**.
- **Steps to reproduce**: Provide a clear list of steps to reproduce the behavior.
- **Environment**: Mention your OS, browser, and version.

### Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure the code lints: `bun lint`.
4.  Make sure your commits follow the style guide below.
5.  Issue that pull request!

## 📏 Style Guide

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Reference issues and pull requests liberally.
- We recommend following [Conventional Commits](https://www.conventionalcommits.org/).

### Coding Standards

- **TypeScript**: Mandatory for all new logic.
- **Prettier**: Code should be formatted using Prettier.
- **Components**: Use Radix UI primitives and Tailwind CSS for styling.
- **Framer Motion**: Use for any animations to keep them consistent with the "premium" feel.

## ❓ Questions?

Feel free to open an issue for any questions or reach out to the project owner [lwshakib](https://github.com/lwshakib).

Happy coding! 🌌
