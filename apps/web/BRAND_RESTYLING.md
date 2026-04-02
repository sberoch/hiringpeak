# Brand Restyling Quick Reference

## Page layout with icon + heading

See `app/(pages)/settings/layout.tsx`

- 10x10 icon box: `bg-electric text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]`
- Title: `text-2xl font-bold tracking-tight text-ink`
- Description: `text-sm text-slate-brand leading-relaxed`

## Sidebar navigation

See `components/settings/settings-sidebar.tsx`

- Container: `w-[240px] sticky top-6 rounded-2xl border border-brand-border bg-surface`
- Active item: `bg-electric/[0.08] text-electric` with inset shadow
- Transitions: `ease-[cubic-bezier(0.16,1,0.3,1)]`

## Data table (search, sort, pagination)

See `packages/ui/src/components/data-table.tsx` (from repo root)

- Container: `rounded-2xl border border-brand-border bg-surface`
- Focus ring: `focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)]`

## Table column definitions & row actions

See `components/users/user-table-columns.tsx`

- Role badge: `bg-electric/5 text-electric rounded-lg`
- Action menu: `MoreHorizontal` in ghost button

## Sheet (side drawer for create/edit)

See `components/users/new-user-sheet.tsx`

- Content: `w-[90%] sm:max-w-md bg-surface border-brand-border`
- Title: `text-xl font-bold text-ink`

## Edit sheet with form

See `components/users/edit-user-sheet.tsx`

## Form fields

See `components/users/user-form.tsx`

- Submit button: `w-full bg-electric hover:bg-electric-light text-white rounded-md py-2.5 font-semibold`

## Confirmation dialog (destructive action)

See `components/users/delete-user-dialog.tsx`

- Container: `rounded-2xl border-brand-border bg-surface`
- Cancel: `rounded-xl border-brand-border`
- Destructive: `bg-red-600 hover:bg-red-700 rounded-xl`

## Settings CRUD list (inline edit/delete with dialog)

See `components/settings/areas-settings.tsx`

- Search + add toolbar, bordered list, edit/delete icon buttons
- Input in dialogs: `rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10`

## Status badges (colored by state)

See `components/companies/company-table-columns.tsx`

- Active: `bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold`
- Prospect: `bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold`

## Count pill badge

See `components/companies/company-table-columns.tsx`

- Style: `bg-electric/5 text-electric rounded-lg px-2.5 py-0.5 text-xs font-semibold`

## Primary CTA button

`bg-electric hover:bg-electric-light text-white rounded-md font-semibold hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all`

- Lift on hover: `hover:-translate-y-0.5`

## Color tokens

| Token | Usage |
| --- | --- |
| `canvas` | Page background |
| `surface` | Cards, sheets, dialogs |
| `ink` | Primary text |
| `electric` | Accent, CTAs, active states |
| `electric-light` | Hover states |
| `slate-brand` | Secondary text |
| `muted-brand` | Placeholders, captions |
| `brand-border` | Borders, dividers |
| `brand-border-light` | Subtle separators, hover bg |

## Brand guidelines source

See `apps/landing/brandbook.md` (from repo root)
