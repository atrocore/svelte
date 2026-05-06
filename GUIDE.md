# Svelte Frontend Development Guide

This document is the single source of truth for Svelte development in this project.
It covers context, architecture philosophy, naming conventions, folder structure, component catalog, and integration with BackboneJS.

These are **architectural contracts** — not suggestions.

---

## 1. Context & Migration Phase

The project is currently in a **migration phase**.

| Layer | Current state |
|---|---|
| Main application | BackboneJS + Handlebars |
| New UI layer | Svelte, introduced incrementally |
| Future target | Full SvelteKit |

At the moment:
- Svelte components are **isolated islands** mounted from BackboneJS views
- BackboneJS is treated as a **host shell** — Svelte is the new rendering layer
- The folder structure already mirrors the **target SvelteKit architecture** to make future migration low-risk

Goals of this architecture:
- Easy onboarding for new developers
- Consistent, predictable structure
- Safe, gradual migration from BackboneJS to Svelte
- Smooth transition to SvelteKit with minimal structural refactoring

---

## 2. Architecture Philosophy

The project follows these core principles:

1. **Incremental migration over big rewrites** — no full rewrites, one component at a time
2. **Explicit structure over implicit conventions** — the folder tells you what the code is
3. **Components are first-class citizens** — structure is designed around components, not pages
4. **Strong separation of concerns** — UI in `.svelte`, logic in `utils/`, types in `types/`
5. **TypeScript-first** — type safety everywhere

---

## 3. Naming Conventions

### 3.1 CamelCase Folder = Component

A folder written in CamelCase is a **real, renderable UI component**.

- Must contain a `.svelte` file with the **same name**
- Has a defined public API: props, events, slots
- Name describes **what the component is**

```
ActionButton/
  ActionButton.svelte

Collapser/
  Collapser.svelte

JobManagerPanel/
  JobManagerPanel.svelte
```

This rule lets any developer instantly recognize components without opening files.

### 3.2 kebab-case Folder = Group

A folder in kebab-case is **not a component**. It is a grouping namespace.

- Must NOT contain a `.svelte` file with the same name
- Exists only to group semantically related components
- Name must be a clear, single noun (see Section 5)

```
fields/
buttons/
modals/
```

### 3.3 TypeScript File Naming

| Purpose | Convention |
|---|---|
| Utilities | `kebab-case.ts` |
| Stores | `something.store.ts` |
| Types / interfaces | `kebab-case.ts` |

```
user.store.ts
date.ts
request.ts
```

---

## 4. Component Naming: What, Not Where

### The Core Rule

A component name must answer: **"What does this component render?"**

It must NOT answer: "Where in the DOM is it placed?"

### Why This Matters

A component exists to be reused. Its current location on a page is a coincidence of usage — not its identity. If a component is used in three different places, a location-based name becomes misleading in two of them.

### Bad — location-based names

```
record/header/buttons/FavoriteEntityButton.svelte   ✗  (describes DOM position)
admin/layouts/BaseLayout.svelte                     ✗  (describes page section)
record/search-filter/FilterGroup.svelte             ✗  (describes DOM position)
```

### Good — identity-based names

```
buttons/FavoriteEntityButton/FavoriteEntityButton.svelte   ✓
FavoriteEntityButton/FavoriteEntityButton.svelte           ✓
FilterGroup/FilterGroup.svelte                             ✓
```

### Clarity Over Brevity

A name must be unambiguous even without its folder context.
If a developer sees a component name in an import, they should immediately understand what it does.

- `Button` — too generic ✗
- `ActionButton` — clear: a button that triggers an action ✓
- `FavoriteEntityButton` — clear: a button for favoriting an entity ✓

Prefixes `Base`, `Common`, `Generic` are weak. Use them only for true abstract base components that are never rendered directly.

---

## 5. Grouping Rules

### 5.1 What Is a Group?

A group is a kebab-case folder that collects components sharing a clear **semantic identity** — they are all instances of the same *type of thing*.

A valid group name is:
- A **single noun**
- **Semantic**: describes what the components *are*
- **Not structural**: does not describe how they are built or where they appear

**Valid group names:**

| Name | What it means |
|---|---|
| `fields/` | Components that display or edit a data field |
| `buttons/` | Interactive trigger components |
| `modals/` | Overlay dialog components |
| `tables/` | Tabular data display components |
| `charts/` | Data visualization components |

**Invalid group names — structural terms:**

| Name | Why it is wrong |
|---|---|
| `containers/` | Everything can contain something |
| `wrappers/` | Everything can wrap something |
| `layouts/` | Vague — what kind of layout? |
| `helpers/` | A trash bin with a polite name |
| `common/` | Means nothing on its own |
| `others/` | Never acceptable |

Structural terms describe HOW components are built, not WHAT they are. A group based on a structural term will inevitably absorb unrelated components over time and become meaningless.

### 5.2 Group Maturity — When to Create a Group

**Do not create a group prematurely.**

Create a group only when ALL three conditions are met:

1. There are **at least two** components that belong to it
2. Their shared identity can be expressed as **one clear noun**
3. The grouping would be **immediately obvious** to any developer

If you cannot name the group with a single confident noun — **the group is not ready**. Leave the components flat.

### 5.3 Lone Components Live Flat

A component without a natural group lives directly in `components/`:

```
components/
  Collapser/
    Collapser.svelte
  DataQualityPanel/
    DataQualityPanel.svelte
  fields/
    BoolField/
    TextField/
```

This is not a problem. A flat list of lone components is **honest structure** — it reflects the real state of the project. It is far better than an artificial group created just to avoid a flat list.

When a second component with a clearly shared identity appears, extract the group at that point:

```
// Before: only Collapser exists
components/
  Collapser/

// After: TreeCollapser added — a group is now justified
components/
  collapsers/
    Collapser/
    TreeCollapser/
```

The group **emerges from reality, not from anticipation**.

### 5.4 Sub-Components

If a component has a child component **used exclusively within it** and with no potential for independent reuse, that sub-component lives inside the parent folder:

```
Admin/
  Admin.svelte
  RebuildDatabaseModal/       ← private to Admin, never used elsewhere
    RebuildDatabaseModal.svelte
```

If the sub-component is or could be reused in other contexts, extract it to the appropriate level in `components/`.

---

## 6. Internal Component Structure

```
ComponentName/
  ComponentName.svelte        ← required
  types/                      ← TypeScript types and interfaces
    some-type.ts
  utils/                      ← pure logic, no Svelte imports
    some-util.ts
  SubComponent/               ← only if exclusively private to this component
    SubComponent.svelte
```

Rules:
- UI logic and reactivity: `.svelte`
- Pure/computational logic: `utils/`
- Types and interfaces: `types/`
- Sub-components only when strictly private

---

## 7. Folder Structure

### 7.1 Top Level

```
src/
  lib/                        ← reusable application core
  routes/                     ← page-level entry points
  styles/                     ← global CSS
  main.ts                     ← application bootstrap only
```

### 7.2 `lib/` — Application Core

Everything inside `lib/`:
- Is reusable
- Can be imported from anywhere in the application
- Must stay clean and stable

```
lib/
  components/                 ← UI components (all rules above apply here)
  core/                       ← config, ACL, framework-level integration
  stores/                     ← global and shared Svelte stores
  types/                      ← global TypeScript types, grouped by domain
  helpers/                    ← pure utility functions
```

#### `lib/components/`

Reusable UI components with no business ownership.
All naming and grouping rules from Sections 3–5 apply here.

Example groups that exist or may emerge:

```
components/
  fields/                     ← components for displaying/editing data fields
  │  BoolField/
  │  TextField/
  │  IntegerField/
  buttons/                    ← interactive trigger components
  │  ActionButton/
  │  DropdownActionButton/
  modals/                     ← overlay dialog components
  │  ConfirmModal/
  SomeUniqueComponent/        ← lone component, no group yet — that's fine
```

The list of groups is **not fixed or closed**. New groups emerge naturally as the codebase grows, following the maturity rules in Section 5.2.

#### `lib/core/`

Application-level rules and configuration.

```
core/
  acl.ts
  config.ts
```

Contains: access control logic, global configuration. No UI code.

#### `lib/helpers/`

Pure utility functions.

```
helpers/
  date.ts
  request.ts
```

Rules: no Svelte imports, no stores, must be framework-agnostic.

> Note: `lib/helpers/` is a **technical namespace** for pure functions, not a component group. The rule against vague group names applies to `lib/components/` — not to top-level technical namespaces in `lib/`.

#### `lib/stores/`

Svelte stores for global or shared state.

```
stores/
  user.store.ts
```

Rules: one store per file, clear ownership and responsibility.

#### `lib/types/`

Global TypeScript types grouped by domain.

```
types/
  api/
    request.ts
  entity/
    product.ts
  ui/
    dropdown.ts
```

Rules: no logic, types only, grouped by responsibility.

### 7.3 `routes/` — Routing Layer

> **Transitional layer.** This project does not yet use SvelteKit.

`routes/` exists to:
- Mirror future SvelteKit routing conventions
- Prepare the codebase for a smooth transition
- Avoid large structural refactors later

Currently routing is handled by BackboneJS. Svelte components inside `routes/` are mounted manually.

```
routes/
  admin/
    Admin/
      Admin.svelte
      RebuildDatabaseModal/
        RebuildDatabaseModal.svelte
  update/
    SystemUpdatePanel/
      SystemUpdatePanel.svelte
```

Rules:
- Components in `routes/` should be **thin** — minimal logic
- No reusable UI logic here
- Treat these as page-level entry points only
- Never import from `routes/` inside `lib/`

### 7.4 `styles/`

```
styles/
  style.css
```

Contains: global styles, CSS variables, base and reset rules.
Component-specific styles belong inside `.svelte` files.

### 7.5 `main.ts`

Application bootstrap only: global initialization, style imports.
No business logic allowed here.

---

## 8. Local Development

### 8.1 Dev Server (HMR)

The dev server proxies the PHP backend through Vite, replacing the built `atro.min.js` with a live ES module entry. Changes to `.svelte` and `.ts` files are reflected in the browser instantly via Hot Module Replacement — no page reload, no rebuild step.

**First-time setup:**

```bash
cd src/svelte
cp .env.example .env   # then edit .env
npm install
```

Edit `.env` and set `BACKEND_URL` to your local PHP application URL:

```
BACKEND_URL=https://atrocore.local
DEV_PORT=5173
```

**Start the dev server:**

```bash
npm run dev
```

Open **`http://localhost:5173`** (or the port set in `DEV_PORT`) instead of your usual backend URL. The app runs identically — login, data, and API all go through the PHP backend. Only Svelte components are served from Vite.

### 8.2 Production Build

```bash
npm run build
```

Output goes to `../atrocore/client/` by default, or to the path set in `BUILD_PATH`.

### 8.3 How the Dev Server Works

```
Browser → localhost:5173
              │
              ├── /src/**          → Vite (source files, HMR)
              ├── /@vite/**        → Vite (HMR runtime)
              └── everything else → PHP backend (proxied)
```

On the first HTML request, the proxy middleware intercepts the PHP response and:

1. Makes all absolute backend URLs relative (so scripts and API calls go through the proxy)
2. Replaces `<script src=".../atro.min.js">` with `<script type="module" src="/src/dev-main.ts">`
3. Removes the built `style.css` link (Vite injects it from source automatically)

`src/dev-main.ts` is the dev-only entry point. It imports `main.ts` and exposes everything on `window.Svelte`, matching the interface of the production UMD bundle.

---

## 9. Integration with BackboneJS

Svelte components are mounted inside BackboneJS views using the global `Svelte` variable.

```javascript
// Inside a BackboneJS view's afterRender():
const component = new Svelte.ActionButton({
    target: this.$el.find('.button-container')[0],
    props: {
        label: 'Save',
        onClick: () => this.save()
    }
});
```

Key points:
- Svelte handles **rendering and reactivity**
- BackboneJS handles **routing, models, and page lifecycle**
- Svelte components receive data via **props** and communicate back via **callbacks or events**
- Always destroy the Svelte component when the BackboneJS view is removed to avoid memory leaks

---

## 11. Rules Summary

### Do
- Name components by **what they are**, not where they appear in the DOM
- Keep names unambiguous even without folder context
- Let lone components live flat in `components/` until a real group matures
- Create a group only when the name is a single confident noun and there are at least two members
- Place sub-components inside the parent only when they are exclusively private
- Move pure logic out of `.svelte` into `utils/`
- Add TypeScript types early

### Don't
- Group components by DOM position, page section, or visual region
- Use structural group names: `containers`, `wrappers`, `layouts`, `common`, `others`
- Create a group for a single component "just in case"
- Use `Base`, `Common`, `Generic` as name prefixes unless the component is a true abstract base
- Put business or domain logic in `lib/components/`
- Import from `routes/` inside `lib/`
- Leave logic inside `.svelte` when it can go in `utils/`