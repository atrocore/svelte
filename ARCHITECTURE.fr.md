# Svelte — Architecture & Conventions (Version française)

> Ceci est la traduction officielle de `ARCHITECTURE.md`.

Ce document définit la structure des dossiers, les conventions de nommage et les règles d'organisation des composants pour ce projet Svelte.

Il s'applique à tous les développeurs et assistants IA travaillant dans ce dépôt.
Ce ne sont pas des suggestions — ce sont des **contrats architecturaux**.

---

## 1. Conventions de nommage

### 1.1 CamelCase = Composant

Un dossier écrit en CamelCase est un **vrai composant UI rendu à l'écran**.

- Doit contenir un fichier `.svelte` avec le **même nom**
- Possède une API publique définie : props, events, slots
- Le nom décrit **ce que le composant est** — jamais où il se trouve dans le DOM

```
ActionButton/
  ActionButton.svelte

Collapser/
  Collapser.svelte

JobManagerPanel/
  JobManagerPanel.svelte
```

### 1.2 kebab-case = Groupe

Un dossier en kebab-case **n'est pas un composant**. C'est un espace de regroupement.

- Ne doit PAS contenir un fichier `.svelte` du même nom
- Existe uniquement pour regrouper des composants sémantiquement liés
- Le nom doit être un nom commun clair et unique (voir Section 3)

```
fields/
buttons/
modals/
```

### 1.3 Fichiers TypeScript

| Usage | Convention |
|---|---|
| Utilitaires | `kebab-case.ts` |
| Stores | `something.store.ts` |
| Types / interfaces | `kebab-case.ts` |

---

## 2. Nommage des composants

### La règle fondamentale

Le nom d'un composant doit répondre à la question : **"Qu'est-ce que ce composant affiche ?"**

Il ne doit PAS répondre à : "Où est-il placé dans le DOM ?"

### Pourquoi c'est important

Un composant existe pour être réutilisé. Sa position actuelle dans une page ou une mise en page est une coïncidence d'utilisation — pas son identité. Si un composant est utilisé à trois endroits différents, un nom basé sur sa localisation sera trompeur dans deux d'entre eux.

### Mauvais — noms basés sur la position dans le DOM

```
record/header/buttons/FavoriteEntityButton.svelte   ✗  (décrit la position dans le DOM)
admin/layouts/BaseLayout.svelte                     ✗  (décrit la section de la page)
record/search-filter/FilterGroup.svelte             ✗  (décrit la position dans le DOM)
```

### Bon — noms basés sur l'identité

```
buttons/FavoriteEntityButton/FavoriteEntityButton.svelte   ✓
FavoriteEntityButton/FavoriteEntityButton.svelte           ✓
FilterGroup/FilterGroup.svelte                             ✓
```

### La clarté prime sur la concision

Un nom doit être sans ambiguïté même sans le contexte du dossier. Si un développeur voit le nom d'un composant dans un import, il doit immédiatement comprendre ce que c'est.

- `Button` — trop générique ✗
- `ActionButton` — clair : un bouton qui déclenche une action ✓
- `FavoriteEntityButton` — clair : un bouton pour mettre une entité en favori ✓

Les préfixes `Base`, `Common`, `Generic` sont faibles. Les utiliser uniquement pour de vrais composants abstraits qui ne sont jamais rendus directement.

---

## 3. Règles de regroupement

### 3.1 Qu'est-ce qu'un groupe ?

Un groupe est un dossier kebab-case qui rassemble des composants partageant une **identité sémantique commune** — c'est-à-dire qu'ils sont tous des instances du même *type de chose*.

Un nom de groupe valide est :
- **Un seul nom commun**
- **Sémantique** : décrit ce que les composants *sont*
- **Pas structurel** : ne décrit pas comment ils sont construits ni où ils apparaissent

**Noms de groupes valides :**

| Nom | Ce que cela signifie |
|---|---|
| `fields/` | Composants qui affichent ou éditent un champ de données |
| `buttons/` | Composants déclencheurs interactifs |
| `modals/` | Composants de dialogue superposés au contenu principal |
| `tables/` | Composants d'affichage de données tabulaires |
| `charts/` | Composants de visualisation de données |

**Noms de groupes invalides — termes structurels :**

| Nom | Pourquoi c'est incorrect |
|---|---|
| `containers/` | Tout peut contenir quelque chose |
| `wrappers/` | Tout peut envelopper quelque chose |
| `layouts/` | Vague — quel type de mise en page ? |
| `helpers/` | Une poubelle avec un nom poli |
| `common/` | Ne signifie rien en soi |
| `others/` | Jamais acceptable |

Les termes structurels décrivent COMMENT les composants sont construits, pas CE QU'ILS SONT. Un groupe basé sur un terme structurel finira inévitablement par absorber des composants sans lien et deviendra sans signification.

### 3.2 La maturité d'un groupe — quand le créer

**Ne créez pas un groupe prématurément.**

Créez un groupe uniquement lorsque les TROIS conditions suivantes sont réunies :

1. Il existe **au moins deux** composants qui lui appartiennent
2. Leur identité commune peut être exprimée par **un seul nom commun clair**
3. Le regroupement serait **immédiatement évident** pour n'importe quel développeur

Si vous ne pouvez pas nommer le groupe avec un seul nom commun sans hésiter — le groupe n'est pas encore mûr. Laissez les composants à plat.

### 3.3 Les composants isolés restent à plat

Un composant qui n'a pas encore de groupe naturel vit directement dans `components/` :

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

Ce n'est pas un problème. Une liste plate de composants isolés est une **structure honnête** — elle reflète l'état réel du projet. C'est bien mieux qu'un groupe artificiel créé uniquement pour éviter une liste plate.

Lorsqu'un second composant avec une identité clairement partagée apparaît, un groupe peut être extrait à ce moment-là :

```
// Avant : seul Collapser existe
components/
  Collapser/
    Collapser.svelte

// Après : TreeCollapser ajouté — un groupe est maintenant justifié
components/
  collapsers/
    Collapser/
      Collapser.svelte
    TreeCollapser/
      TreeCollapser.svelte
```

Le groupe émerge de la réalité, pas de l'anticipation.

### 3.4 Sous-composants

Si un composant possède un composant enfant **utilisé exclusivement en son sein** et sans potentiel de réutilisation indépendante, ce sous-composant vit à l'intérieur du dossier parent :

```
Admin/
  Admin.svelte
  RebuildDatabaseModal/       ← privé à Admin, jamais utilisé ailleurs
    RebuildDatabaseModal.svelte
```

Si le sous-composant est ou pourrait être réutilisé dans d'autres contextes, il doit être extrait au niveau approprié dans `components/`.

---

## 4. Structure interne d'un composant

```
ComponentName/
  ComponentName.svelte        ← obligatoire
  types/                      ← types et interfaces TypeScript
    some-type.ts
  utils/                      ← logique pure, sans imports Svelte
    some-util.ts
  SubComponent/               ← uniquement si strictement privé à ce composant
    SubComponent.svelte
```

- Logique UI et réactivité : `.svelte`
- Logique pure / calculs : `utils/`
- Types et interfaces : `types/`

---

## 5. Structure de haut niveau

```
src/
  lib/                        ← cœur réutilisable de l'application
    components/               ← composants UI (les règles de ce document s'appliquent ici)
    core/                     ← config, ACL, intégration avec le framework
    stores/                   ← stores Svelte globaux et partagés
    types/                    ← types TypeScript globaux, groupés par domaine
    helpers/                  ← fonctions utilitaires pures (sans Svelte, sans stores)
  routes/                     ← points d'entrée des pages, légers, sans logique réutilisable
  styles/                     ← styles globaux, variables CSS, resets
  main.ts                     ← uniquement le bootstrap de l'application
```

Note : `lib/helpers/` est un espace technique pour les fonctions pures — pas un groupe de composants. La règle contre les noms de groupes vagues s'applique à `lib/components/`, pas aux espaces techniques de haut niveau dans `lib/`.

---

## 6. Résumé des règles

### À faire
- Nommer les composants en fonction de **ce qu'ils sont**, et non de l'endroit où ils apparaissent dans le DOM
- Garder les noms sans ambiguïté même sans le contexte du dossier
- Laisser les composants isolés à plat dans `components/` jusqu'à ce qu'un vrai groupe soit mûr
- Créer un groupe uniquement lorsque le nom est un seul nom commun évident et qu'il y a au moins deux membres
- Placer les sous-composants à l'intérieur du parent uniquement s'ils lui sont strictement privés

### À ne pas faire
- Grouper les composants par leur position dans le DOM, la section de la page ou la région visuelle
- Utiliser des noms de groupes structurels : `containers`, `wrappers`, `layouts`, `common`, `others`
- Créer un groupe pour un seul composant "au cas où"
- Utiliser `Base`, `Common` ou `Generic` comme préfixe de nom de composant sauf si c'est un vrai composant abstrait de base
- Mettre la logique métier directement dans `.svelte` — la déplacer dans `utils/`
- Importer depuis `routes/` à l'intérieur de `lib/`