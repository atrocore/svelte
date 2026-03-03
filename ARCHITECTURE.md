# Svelte Architecture & Conventions

This document defines the folder structure, naming conventions, and component organization rules for this Svelte project.

It applies to all developers and AI assistants working in this codebase.
These are not suggestions — they are **architectural contracts**.

---

## 1. Naming Conventions

### 1.1 CamelCase Folder = Component

A folder written in CamelCase is a **real, renderable UI component**.

- Must contain a `.svelte` file with the **same name**
- Has a defined public API: props, events, slots
- The name describes **what the component is** — never where it lives in the DOM

```
ActionButton/
  ActionButton.svelte

Collapser/
  Collapser.svelte

JobManagerPanel/
  JobManagerPanel.svelte
```

### 1.2 kebab-case Folder = Group

A folder in kebab-case is **not a component**. It is a grouping namespace.

- Must NOT contain a `.svelte` file with the same name
- Exists only to group semantically related components
- Name must be a clear, single noun (see Section 3)

```
fields/
buttons/
modals/
```

### 1.3 TypeScript Files

| Purpose | Convention |
|---|---|
| Utilities | `kebab-case.ts` |
| Stores | `something.store.ts` |
| Types / interfaces | `kebab-case.ts` |

---

## 2. Component Naming

### The Core Rule

A component name must answer: **"What does this component render?"**

It must NOT answer: "Where in the DOM is it placed?"

### Why This Matters

A component exists to be reusable. Its current location on a particular page is a coincidence of usage — not its identity. If the component is used in three different places, a location-based name becomes misleading in two of them.

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

A name must be unambiguous even without its folder context. If someone reads the component name in an import, they should immediately understand what it does.

- `Button` — too generic ✗
- `ActionButton` — clear: a button that triggers an action ✓
- `FavoriteEntityButton` — clear: a button for favoriting an entity ✓

`Base`, `Common`, `Generic` prefixes are weak. Use them only for true abstract base components that are never rendered directly.

---

## 3. Grouping Rules

### 3.1 What Is a Group?

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

### 3.2 Group Maturity — When to Create a Group

**Do not create a group prematurely.**

Create a group only when ALL of the following conditions are true:

1. There are **at least two** components that belong to it
2. Their shared identity can be expressed as **one clear noun**
3. The grouping would be **immediately obvious** to any developer reading the structure

If you cannot name the group with a single confident noun — the group is not ready. Leave the components flat.

### 3.3 Lone Components Live Flat

A component that has no natural group yet lives directly in `components/`:

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

This is not a problem. A flat list of lone components is **honest structure** — it reflects the current reality of the project. It is far better than a group created just to avoid a flat list.

When a second component with a clearly shared identity appears, a group can be extracted at that point:

```
// Before: only Collapser exists
components/
  Collapser/
    Collapser.svelte

// After: TreeCollapser added — now a group is justified
components/
  collapsers/
    Collapser/
      Collapser.svelte
    TreeCollapser/
      TreeCollapser.svelte
```

The group emerges from reality, not from anticipation.

### 3.4 Sub-Components

If a component has a child component that is **used exclusively inside it** and has no potential for independent reuse, that sub-component lives inside the parent folder:

```
Admin/
  Admin.svelte
  RebuildDatabaseModal/       ← private to Admin, never used elsewhere
    RebuildDatabaseModal.svelte
```

If the sub-component is or could be reused in other contexts, extract it to the appropriate level in `components/`.

---

## 4. Internal Component Structure

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

- UI logic and reactivity: `.svelte`
- Pure/computational logic: `utils/`
- Types and interfaces: `types/`

---

## 5. Top-Level Structure

```
src/
  lib/                        ← reusable application core
    components/               ← UI components (rules above apply here)
    core/                     ← config, ACL, framework-level integration
    stores/                   ← global and shared Svelte stores
    types/                    ← global TypeScript types, grouped by domain
    helpers/                  ← pure utility functions (no Svelte, no stores)
  routes/                     ← page-level entry points, thin, no reusable logic
  styles/                     ← global CSS, CSS variables, resets
  main.ts                     ← application bootstrap only
```

Note: `lib/helpers/` is a technical namespace for pure functions — not a component group. The rule against vague group names applies to `lib/components/`, not to `lib/` top-level technical namespaces.

---

## 6. Rules Summary

### Do
- Name components by **what they are**, not where they appear in the DOM
- Keep names unambiguous even when read without folder context
- Let lone components live flat in `components/` until a real group matures
- Create a group only when the name is a confident single noun and there are at least two members
- Place sub-components inside the parent only when they are exclusively private to it

### Don't
- Group components by their DOM position, page section, or visual region
- Use structural group names: `containers`, `wrappers`, `layouts`, `common`, `others`
- Create a group for a single component "just in case"
- Use `Base`, `Common`, or `Generic` as component name prefixes unless the component is a true abstract base
- Put reusable logic directly in `.svelte` — move it to `utils/`
- Import from `routes/` inside `lib/`