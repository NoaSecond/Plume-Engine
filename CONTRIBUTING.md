# Contributing to Plume Engine

Thanks for your interest in contributing! This file outlines the recommended workflow, coding conventions, and how to write commits.

## Language

- Please write code, documentation, and commit messages in English.

## Branching & Pull Requests

- Use feature branches off of `main` (or the branch you're targeting): `feature/<short-description>` or `fix/<short-description>`.
- Open a Pull Request (PR) with a clear title and short description of the change.
- Reference any related issue(s) in the PR description.
- Small, focused PRs are preferred.

## Commit Messages

- Use Gitmoji prefixes if helpful. Keep messages concise and in English.
- Examples:
  - `✨ Add default rendering`
  - `🐛 Fix normal calculation`
  - `♻️ Simplify rendering code`

## Code Style

- Prefer readable, well-documented code.
- Keep functions small and focused.
- Add comments for non-obvious logic.
- Follow existing naming and formatting conventions in the repository.

## Building and Testing

- See `README.md` for build instructions. If you add new dependencies, update the README and mention how to install them.

## PR Checklist

- [ ] The code builds and runs locally.
- [ ] I added or updated documentation if needed.
- [ ] I added tests for new features (if applicable).
- [ ] PR description explains the motivation and the change.

## Getting help

If you're not sure where to start, open an issue describing what you'd like to work on or ask for guidance in the issue tracker.

Thanks again — contributions are welcome!

## Usage — Git, commits and style

Please write commit messages and source code in English.

We follow Gitmoji for expressive commits. Example:

```powershell
git add .
git commit -m "✨ feat: add default rendering"
```

Common examples:

- ✨ Add default rendering system
- 🐛 Fix normal calculations
- 📝 Update README
- 💄 Fix indentation and formatting
- ♻️ Simplify rendering pipeline
- ⚡️ Optimize texture loading
- ✅ Add unit tests for the ECS
- 🔧 Update build scripts

Quick tip: add a short description after the type, for example `✨ Add shadow handling (basic)`.

Optional: use `gitmoji-cli` for interactive commits:

```powershell
npm install -g gitmoji-cli
npx gitmoji-cli -c
```