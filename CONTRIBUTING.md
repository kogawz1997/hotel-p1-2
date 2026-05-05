# Contributing to Maitri

Thanks for your interest in Maitri.

## We're not yet open for public contributions

This project is in private beta with pilot hotels. Public contributions will open once we've stabilized the core API surface (estimated Q3 2026).

## In the meantime

If you're interested:

- **Hoteliers** — [open an issue](https://github.com/yourusername/maitri/issues/new) to share feedback or feature requests
- **Developers** — feel free to fork and explore. Open an issue to discuss any patches before submitting
- **Translators** — we'll need help expanding language support, please reach out

## Code conventions (for future contributors)

### TypeScript
- Strict mode on, no `any` without justification
- Prefer interfaces over types for objects
- Server components by default, `'use client'` only when needed

### Styling
- Tailwind utility classes, no custom CSS unless absolutely necessary
- Use design tokens from `tailwind.config.js` (colors, spacing, fonts)
- Mobile-first responsive design

### File organization
- One component per file, named exports
- Co-locate `page.tsx` (server) with `*-client.tsx` (client) where needed
- Business logic lives in `src/lib/`, not in API routes or components

### Commits
Conventional commits format:
```
feat(inbox): add typing indicators
fix(reservations): correct timezone for check-in
docs(readme): update pricing table
```

### Pull requests
- Clear description of what + why
- Screenshots for UI changes
- Tests for business logic changes
- Link related issues

## Code of conduct

Be kind, be respectful, assume good intent. We don't tolerate harassment or discrimination.

## License

By contributing, you agree your contributions will be licensed under the [MIT License](./LICENSE).
