# Add Theme

Adds a new country theme to the Quiniela Expertos app.

## Step 1 — Get the country

If `$ARGUMENTS` is empty, ask the user: **"¿Para qué país quieres crear el nuevo tema?"**

Use their answer as the country name. If they already provided it via `$ARGUMENTS`, skip the question.

## Step 2 — Research the flag colors

Look up the flag of the country and identify:
- The **primary** color (most dominant, used for `--accent`)
- The **secondary** color if relevant
- The overall warm/cool hue of the flag

Use vivid, saturated versions of those colors — inspired by the FIFA WC 2026 palette already in use (neon green `#00C853` for Mexico, bright red `#E51414` for Canada, royal blue `#2535F0` for USA). Match that energy level.

## Step 3 — Generate the full variable set

Derive all values from the primary flag color:

| Variable | Derivation |
|---|---|
| `--accent` | Vivid primary flag color |
| `--accent-hover` | ~15% darker than `--accent` |
| `--accent-light` | ~40% lighter / pastel version for text |
| `--accent-dim` | Very dark (~15% lightness), same hue |
| `--accent-muted` | `rgba(r,g,b, 0.2)` |
| `--accent-deep` | `rgba(r,g,b, 0.4)` using `--accent-dim` RGB |
| `--bg-base` | Near-black (`~2-4% lightness`), tinted with the flag hue |
| `--surface-nav` | Slightly lighter than `--bg-base`, same hue |
| `--surface-card` | Slightly lighter than `--surface-nav`, same hue |
| `--blob-a` | `rgba(r,g,b, 0.28)` using `--accent` RGB |
| `--blob-b` | `rgba(r,g,b, 0.22)` using a mid-dark shade |
| `--blob-c` | `rgba(r,g,b, 0.18)` using `--accent-hover` RGB |

## Step 4 — Choose the theme ID

- `themeId`: lowercase country name in English, no spaces (e.g., `brazil`, `argentina`, `france`)
- CSS class: `theme-{themeId}`
- Flag emoji: appropriate emoji for the country

## Step 5 — Update `src/index.css`

Read the file first, then append the new theme block **before** the `/* ── Global base background` comment, following the exact same format as `.theme-canada` and `.theme-usa`.

## Step 6 — Update `src/lib/themes.ts`

Read the file, then add a new entry to the `THEMES` array:
```ts
{ id: 'themeId', label: 'Country name in Spanish', flag: '🏳️', className: 'theme-themeId' },
```

Place it after the existing entries.

## Step 7 — Verify

Run `npm run build` to confirm no TypeScript or Vite errors.

## Step 8 — Report

Tell the user:
- The theme name and flag
- The exact hex values chosen for `--accent`, `--accent-light`, and `--bg-base`
- That they can now select it in the Dashboard theme picker
