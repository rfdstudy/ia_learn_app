# Parcours IA — Bien utiliser l’IA

Une application d’apprentissage autonome pour suivre les **12 modules** du parcours « Bien utiliser l’IA », approfondir avec **3 modules optionnels**, prendre des notes, faire les exercices et consigner les questions qui restent ouvertes.

L’application reprend l’esprit de la maquette fournie : barre latérale sombre, accents teal, cartes sobres, progression visible et espace de travail par module. Elle fonctionne **sans compte, sans serveur et sans dépendance** : les données restent dans le navigateur.

## Fonctionnalités

- **Parcours complet** : 12 modules principaux et 3 modules optionnels, chacun avec idée centrale, concepts, exemple, exercice, auto-vérification et quiz de 3 questions.
- **Espace de travail** : notes, résultat d’exercice et questions propres à chaque module, enregistrés automatiquement.
- **Carnet de questions** : questions de cours, idées d’amélioration et problèmes d’usage ; réponse, réouverture ou suppression.
- **Brief auteur** : export Markdown ou copie dans le presse-papiers pour transformer les questions sans réponse et les notes en prochaines leçons.
- **Bibliothèque de ressources** : 36 ressources vérifiées, filtres par module, langue et format, suivi des ressources consultées.
- **Tableau de bord** : progression globale, prochain module, dernières notes et questions ouvertes.
- **Sauvegarde locale** : export/import JSON, rapport d’apprentissage, export des notes et réinitialisation protégée.
- **Responsive** : navigation mobile, mise en page adaptée aux petits écrans.
- **Hors ligne** : aucune requête réseau n’est nécessaire au fonctionnement ; la police Inter est incluse localement.

## Démarrer

### Ouvrir directement

Double-cliquez sur `index.html`. L’application est entièrement statique et utilise des scripts classiques, compatibles avec une ouverture en `file://`.

Selon le navigateur, le stockage local peut être plus restrictif en `file://`. Pour un usage régulier, préférez le petit serveur local ci-dessous.

### Serveur local (recommandé)

Prérequis : **Node.js 18 ou plus**. Aucune installation de dépendance n’est nécessaire.

```bash
npm run dev
```

Ouvrez ensuite <http://127.0.0.1:4173>. Pour changer de port :

```powershell
$env:PORT=4174; npm run dev
```

Sous macOS ou Linux : `PORT=4174 npm run dev`.

### Vérifications et build

```bash
npm test        # tests des données et du noyau métier
npm run check   # syntaxe, cohérence des données, fichiers référencés
npm run build   # génère dist/, publiable tel quel sur un hébergement statique
```

Le build ne transforme pas le code : il copie les fichiers utiles dans `dist/` et vérifie le point d’entrée.

## Utilisation

1. Ouvrez la **vue d’ensemble** et commencez par le module 1.
2. Lisez l’idée centrale et les concepts, puis faites l’exercice.
3. Écrivez vos notes dans **Mon espace de travail** : elles sont enregistrées automatiquement dans ce navigateur.
4. Cochez les points d’**auto-vérification** pour marquer le module comme terminé.
5. Utilisez le quiz pour vérifier rapidement votre compréhension.
6. Notez les points flous ou les idées dans **Questions**.
7. Quand vous voulez faire évoluer le parcours, ouvrez **Questions & idées**, cliquez sur **Copier le brief** ou **Exporter le brief**, puis transmettez ce document à la personne ou à l’assistant qui ajoutera les réponses et les leçons.

### Où sont mes données ?

Tout est dans le `localStorage` du navigateur, sous la clé `iaLearnApp.v1`. Il n’y a aucun envoi vers un serveur.

- `parcours-ia-sauvegarde-AAAA-MM-JJ.json` : sauvegarde complète à réimporter.
- `parcours-ia-rapport-AAAA-MM-JJ.md` : progression, notes et questions.
- `parcours-ia-notes-AAAA-MM-JJ.md` : notes et exercices uniquement.
- `parcours-ia-brief-auteur-AAAA-MM-JJ.md` : brief destiné à l’amélioration du parcours.

Exportez régulièrement : vider les données du navigateur efface aussi la progression. Utilisez **Données & sauvegarde** dans la barre latérale.

## Structure du projet

```text
ia_learn_app/
├── index.html                  # coquille de l’application
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── fonts/                  # Inter, auto-hébergée
├── src/
│   ├── data/
│   │   ├── resources.js        # bibliothèque de 36 ressources
│   │   ├── modules-core.js     # 12 modules principaux
│   │   └── modules-optional.js # 3 modules optionnels
│   ├── styles/
│   │   ├── base.css            # variables, typographie, contrôles
│   │   ├── layout.css          # sidebar, coquille, responsive
│   │   ├── components.css      # cartes, module, quiz, modales
│   │   └── pages.css           # ressources, notes, questions
│   ├── core.js                 # logique métier pure (état, stats, exports)
│   ├── store.js                # persistance localStorage avec repli mémoire
│   ├── ui.js                   # icônes, échappement, modales, toasts
│   ├── views.js                # vues tableau de bord et module
│   ├── views-pages.js          # vues ressources, notes, questions, données
│   └── app.js                  # routage, événements, initialisation
├── scripts/
│   ├── serve.mjs               # serveur statique de développement
│   ├── build.mjs               # copie vers dist/
│   └── check.mjs               # vérification du projet
├── tests/
│   ├── data.test.mjs
│   └── core.test.mjs
├── docs/
│   ├── architecture.md
│   └── guide-auteur.md
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── .npmrc
├── LICENSE
├── package.json
└── README.md
```

## Modifier le contenu

Les modules se trouvent dans `src/data/modules-core.js` et `src/data/modules-optional.js`. Chaque module suit le même schéma :

```js
{
  id: 4,
  shortTitle: "Donner la bonne information",
  title: "Donner la bonne information au modèle",
  kicker: "Pratique",
  duration: "1 à 2 h",
  idea: "…",
  concepts: [{ title: "…", text: "…" }],
  example: "…",
  exercise: "…",
  selfCheck: ["…"],
  quiz: [{ question: "…", options: ["…"], answer: 0, explanation: "…" }],
  resourceIds: ["identifiant-ressource"],
  optional: false
}
```

Les ressources sont définies dans `src/data/resources.js`. Un identifiant inexistant dans `resourceIds` est signalé par `npm run check` et `npm test`.

Le guide détaillé de révision éditoriale se trouve dans [`docs/guide-auteur.md`](docs/guide-auteur.md). L’architecture technique est décrite dans [`docs/architecture.md`](docs/architecture.md).

## Confidentialité et limites

- Aucune donnée n’est transmise : pas d’analytics, pas de compte, pas de requête réseau au chargement.
- Les liens de ressources s’ouvrent volontairement dans un nouvel onglet vers des sites tiers.
- Le stockage est propre à un navigateur et à un profil. Une sauvegarde JSON est nécessaire pour changer d’appareil.
- L’application ne remplace pas une vérification factuelle des réponses d’un modèle d’IA. Le parcours insiste justement sur ce point.

## Compatibilité

Navigateurs modernes : Chrome, Edge, Firefox et Safari récents. L’application utilise `localStorage`, les modules CSS modernes (`:has`, `dvh`, `mask-image`) et les API de téléchargement. En cas d’indisponibilité du stockage, elle continue en mémoire et propose l’export.

## Licence

MIT — voir [`LICENSE`](LICENSE).
