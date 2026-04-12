# Contributing to Quest - The Intelligent Form Builder

First off, thank you for considering contributing to Quest! ❤️ We're excited to see your ideas and improvements. 🚀

All types of contributions are welcome, from bug reports to new feature implementations.

## 🛠️ Development Setup

To get started with local development, follow these steps:

1.  **Prerequisites**:
    - [Bun](https://bun.sh/) (Recommended runtime)
    - A PostgreSQL instance (Use [Neon](https://neon.tech/) for easy cloud setup)
    - Cloudinary, Resend, and Google Gemini API keys for full functionality

2.  **Clone and Install**:

    ```bash
    git clone https://github.com/lwshakib/quest-form-builder.git
    cd quest-form-builder
    bun install
    ```

3.  **Environment Configuration**:
    Copy `.env.example` to `.env` and fill in the required keys:
    - `DATABASE_URL` for Prisma
    - `BETTER_AUTH_SECRET` & `GOOGLE_CLIENT_ID/SECRET` for auth
    - `GOOGLE_API_KEY` for Gemini AI
    - `CLOUDINARY_*` for media hosting
    - `RESEND_API_KEY` for emails
    - AI Worker URLs for GLM and Flux

4.  **Database Migration**:

    ```bash
    bun x prisma migrate dev
    ```

5.  **Run Development Server**:
    ```bash
    bun dev
    ```

## 🤝 How Can I Contribute?

### Reporting Bugs

- **Check for existing issues**: Search the issue tracker to see if the bug has already been reported.
- **Provide clear steps**: Include a clear list of steps to reproduce the issue.
- **Environment**: Specify your OS, browser, and version.

### Suggesting Enhancements

- Start by opening an issue for discussion to ensure alignment with the project's vision.
- Focus on how the enhancement improves the "premium" user experience.

### Pull Requests

1.  Fork the repository and create your feature branch from `main`.
2.  If you've added logic, ensure the code is linted and formatted:
    ```bash
    bun run lint
    bun run format:check
    ```
3.  Follow the commit style guide below.
4.  Open your pull request! 🌌

## 📏 Style Guide

### Git Commit Messages

- Use **Conventional Commits**: `feat: add new question type`, `fix: resolve auth crash`.
- Use the present tense ("Add feature" not "Added feature").
- Reference issues and pull requests in the description.

### Coding Standards

- **Strict TypeScript**: No implicit `any`. Use well-defined interfaces.
- **UI Components**: Use **Radix UI** primitives and **Tailwind CSS 4**.
- **Animations**: Use **Motion** for all transitions to maintain the premium feel.
- **Prisma**: All database changes must be done via Prisma migrations.

## ❓ Questions?

Feel free to open an issue or reach out to the project maintainer [lwshakib](https://github.com/lwshakib).

Happy coding! 🌌
