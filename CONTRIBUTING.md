# Contributing to Quest - The Intelligent Form Builder

First off, thank you for considering contributing to Quest! ❤️ We're excited to see your ideas and improvements. 🚀

All types of contributions are welcome, from bug reports to new feature implementations.

## 🛠️ Development Setup & Workflow

To get started with local development and contribute, follow these detailed steps:

### 1. Fork & Clone

1.  **Fork the repository**: Click the "Fork" button at the top right of the GitHub page.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/quest-form-builder.git
    cd quest-form-builder
    ```
3.  **Add Upstream Remote**: Add the original repository as an upstream to keep your fork synced:
    ```bash
    git remote add upstream https://github.com/lwshakib/quest-form-builder.git
    ```

### 2. Prerequisites & Installation

1.  Ensure you have **[Bun](https://bun.sh/)** installed.
2.  Install dependencies:
    ```bash
    bun install
    ```

### 3. Environment Configuration

1.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Fill in the required keys in `.env`:
    - **Database**: `DATABASE_URL` for Prisma (e.g., Neon).
    - **Auth**: `BETTER_AUTH_SECRET` & `GOOGLE_CLIENT_ID/SECRET`.
    - **Media Hosting**: `AWS_*` variables for S3 or Cloudflare R2 bucket.
    - **Emails**: `RESEND_API_KEY`.
    - **AI**: `CLOUDFLARE_AI_GATEWAY_*` variables or standard provider keys.
3.  Initialize your storage bucket:
    ```bash
    bun run bucket:setup
    ```

### 4. Database Migration

Run the migrations to build your local schema:

```bash
bun x prisma migrate dev
```

### 5. Running the App

Start the development server:

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

### Branching, Committing, and Pull Requests

1.  **Create a Branch**:
    Ensure you are up to date and create a feature branch:

    ```bash
    git checkout main
    git pull upstream main
    git checkout -b feat/your-feature-name
    ```

2.  **Work and Format**:
    Make your changes, then ensure the code is formatted and linted:

    ```bash
    bun run format
    bun run lint
    ```

3.  **Commit Your Changes**:
    Follow the Conventional Commits style:

    ```bash
    git add .
    git commit -m "feat: add your detailed description"
    ```

4.  **Push and Open a Pull Request**:
    ```bash
    git push origin feat/your-feature-name
    ```
    Go to the original repository on GitHub, click **Compare & pull request**, and provide a clear description of your changes! 🌌

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
