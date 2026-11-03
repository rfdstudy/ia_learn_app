# Architecture

## Vue d’ensemble

`ia_learn_app` est une application statique en HTML, CSS et JavaScript classique. Elle n’a ni framework, ni étape de compilation obligatoire, ni backend. Les scripts sont chargés dans un ordre explicite depuis `index.html`, ce qui permet aussi une ouverture directe par double-clic.

```text
index.html
  ├── public/fonts + favicon + manifest
  ├── src/styles/base.css
  ├── src/styles/layout.css
  ├── src/styles/components.css
  ├── src/styles/pages.css
  ├── src/data/resources.js
  ├── src/data/modules-core.js
  ├── src/data/modules-optional.js
  ├── src/core.js
  ├── src/store.js
  ├── src/ui.js
  ├── src/views.js
  ├── src/views-pages.js
  └── src/app.js
```

Chaque fichier expose un objet global (`window.IA_DATA`, `window.IACore`, `window.IAStore`, `window.IAUI`, `window.IAViews`). Il n’y a pas de modules ES afin de préserver le fonctionnement en `file://`.

## Responsabilités

### `src/data/`

Contenu éditorial séparé de l’interface.

- `resources.js` initialise `window.IA_DATA` avec les ressources.
- `modules-core.js` et `modules-optional.js` ajoutent les modules via `Object.assign`.
- Les identifiants de modules sont numériques (`1` à `12`, `101` à `103`).
- Chaque module contient les champs affichés par les vues et un quiz à trois options.

### `src/core.js`

Noyau métier sans DOM. Il contient :

- la constante `APP_ID`, la version de schéma et la clé `localStorage` ;
- la création et la normalisation de l’état ;
- le calcul de la progression, des notes, des questions et des ressources consultées ;
- le score des quiz ;
- la validation d’une sauvegarde ;
- la génération des exports Markdown.

Il est testable sous Node en fournissant un objet `window` au contexte d’exécution.

### `src/store.js`

Encapsule `localStorage` :

- `load()` normalise les données lues ; un JSON corrompu ne bloque pas l’application ;
- `save()` met à jour `updatedAt` et conserve un état mémoire ; un échec de stockage est exposé à l’appelant ;
- `clear()` supprime la clé ;
- `usageBytes()` estime la taille de la sauvegarde ;
- `isAvailable()` permet à l’interface de prévenir l’utilisateur.

Le repli mémoire garantit que l’application reste utilisable même si le stockage est interdit, à condition d’exporter avant fermeture.

### `src/ui.js`

Briques transverses :

- icônes SVG inline et badge de module ;
- échappement HTML (`escapeHTML`, `escapeAttr`, `nl2br`) ;
- libellés de ressources ;
- notifications ;
- modales et confirmations avec piège de focus clavier ;
- téléchargement de fichiers et copie presse-papiers avec repli `execCommand`.

Aucune chaîne éditoriale n’est injectée sans échappement.

### `src/views.js` et `src/views-pages.js`

Fonctions de rendu **pures** : elles reçoivent `app` (état + filtres + route) et retournent une chaîne HTML. Elles ne modifient pas l’état et n’attachent pas d’écouteurs.

- `views.js` : tableau de bord, fiche module, espace de travail, cartes de question, quiz.
- `views-pages.js` : ressources, notes, questions, fenêtre de données.

Les vues utilisent une délégation d’événements centralisée dans `app.js`.

### `src/app.js`

Contrôleur unique :

- état de session et filtres ;
- routage par hash (`#/`, `#/module/4`, `#/ressources`, `#/notes`, `#/questions`) ;
- rendu de la vue principale et de la barre latérale ;
- délégation des clics, saisies, changements et soumissions ;
- sauvegarde différée avec indicateur de statut ;
- exports, import, réinitialisation ;
- initialisation et raccourcis clavier.

Les mises à jour ciblées (quiz, auto-vérification, recherche) évitent de reconstruire toute la page à chaque interaction.

## État et persistance

L’état a cette forme :

```js
{
  app: "ia-learn-app",
  version: 1,
  createdAt: "ISO",
  updatedAt: "ISO",
  progress: {
    "1": {
      notes: "",
      exercise: "",
      exerciseDone: false,
      selfChecks: [false, false, false],
      quiz: { "0": { choice: 1, checked: true } },
      updatedAt: "ISO"
    }
  },
  questions: [
    {
      id: "q-…",
      moduleId: 1,          // null = question générale
      type: "question",    // question | idea | bug
      text: "…",
      context: "…",
      answer: "",
      status: "open",      // open | answered
      createdAt: "ISO",
      updatedAt: "ISO",
      answeredAt: null
    }
  ],
  resourcesSeen: { "arena": "ISO" },
  ui: { lastModuleId: 1 }
}
```

`normalizeState` garantit :

- une entrée de progression pour chaque module, même après ajout d’un module ;
- des tableaux d’auto-vérification à la bonne longueur ;
- l’ignorance des réponses de quiz hors bornes ;
- la suppression des questions vides ;
- la validation des identifiants de module et de ressource ;
- la réparation des dates invalides.

Une sauvegarde étrangère ou d’une version future est refusée via `validateBackup`.

## Routage

Le hash est la source de vérité. `parseRoute()` accepte :

| Hash | Vue |
| --- | --- |
| `#/` ou vide | Tableau de bord |
| `#/module/1` à `12` | Module principal |
| `#/module/101` à `103` | Module optionnel |
| `#/ressources` | Bibliothèque |
| `#/notes` | Carnet de notes |
| `#/questions` | Questions et brief |

Les liens `data-open-tab="notes|exercise|questions"` demandent l’ouverture d’un onglet du module avant le rendu.

## Persistance et sauvegarde

- Les notes et exercices sont enregistrés 450 ms après la dernière frappe, ainsi qu’avant changement de route, fermeture ou passage en arrière-plan.
- Les actions ponctuelles (quiz, cases, questions, ressources) enregistrent immédiatement.
- L’import remplace l’état après confirmation et normalisation.
- La réinitialisation supprime la clé puis recrée un état vierge.

## Exports

- **JSON** : état complet, réimportable.
- **Rapport** : synthèse, progression par module, notes, questions/réponses et ressources consultées.
- **Notes** : notes et exercices rédigés, par module.
- **Brief auteur** : questions ouvertes groupées par module, idées/problèmes, questions déjà traitées, notes de contexte, consigne éditoriale et format de réponse attendu.

La date des noms de fichiers est locale (`AAAA-MM-JJ`), tandis que les dates internes sont stockées en ISO.

## Sécurité

- Tout contenu utilisateur affiché est échappé par `UI.escapeHTML` ou `UI.nl2br`.
- Les URL de ressources proviennent des données statiques et sont échappées dans les attributs.
- L’import JSON est validé avant remplacement et ne permet pas d’exécuter du code.
- Aucun contenu distant n’est chargé au démarrage.

## Tests

```bash
npm test
```

- `tests/data.test.mjs` vérifie les 12 + 3 modules, les champs obligatoires, les quiz, les identifiants et les liens entre modules et ressources.
- `tests/core.test.mjs` vérifie la progression, les quiz, les statistiques, la normalisation, la validation, les exports et le repli de stockage.
- `tests/load-app.mjs` charge les scripts classiques dans un contexte `vm` avec un faux `window`.

`npm run check` ajoute la vérification syntaxique de tous les fichiers JavaScript et la présence des ressources référencées par `index.html`.

## Choix techniques

- **Pas de dépendance** : installation instantanée, durée de vie longue, aucune chaîne d’approvisionnement npm.
- **Scripts classiques** : ouverture directe, débogage simple, ordre de chargement explicite.
- **Rendu par chaînes HTML** : lisible pour un projet de contenu, avec échappement systématique et délégation d’événements.
- **CSS séparé par couche** : variables et contrôles, structure, composants, pages.
- **État normalisé** : la sauvegarde reste compatible avec l’ajout de contenu.

## Ajouter un module ou une ressource

1. Ajouter une ressource dans `resources.js` avec un identifiant unique.
2. Ajouter le module dans `modules-core.js` ou `modules-optional.js`.
3. Relier les deux via `resourceIds` / `moduleIds`.
4. Utiliser un identifiant de module nouveau mais stable.
5. Lancer `npm test` puis `npm run check`.
6. Vérifier visuellement le tableau de bord, la fiche et la bibliothèque.

L’état existant est conservé : `normalizeState` crée la progression manquante pour un nouveau module.
