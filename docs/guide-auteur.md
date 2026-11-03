# Guide auteur — transformer les questions en leçons

Ce guide décrit la boucle d’amélioration prévue par l’application : l’apprenant suit le parcours et consigne ses questions ; l’auteur ou l’assistant transforme ensuite ces questions en réponses, en exemples et en nouvelles leçons.

## 1. Récupérer le brief

Dans l’application :

1. Ouvrir **Questions & idées**.
2. Cliquer sur **Copier le brief** pour le coller dans une conversation, ou sur **Exporter le brief** pour obtenir un fichier `.md`.
3. Pour un contexte plus complet, exporter aussi le **rapport d’apprentissage** depuis **Données & sauvegarde**.

Le brief contient :

- la progression et le nombre de questions ;
- les questions sans réponse, groupées par module ;
- les idées d’amélioration et problèmes d’usage ;
- les questions déjà traitées, pour éviter les doublons ;
- les notes de contexte de l’apprenant ;
- la consigne et le format de réponse attendus.

Il ne contient pas la sauvegarde technique complète. Pour reprendre l’état exact, le fichier `.json` reste nécessaire.

## 2. Qualifier chaque question

Pour chaque entrée, décider :

- **Répondre** : la réponse peut être ajoutée au module ou à la FAQ future.
- **Clarifier** : la question révèle qu’un concept est ambigu, trop dense ou mal placé.
- **Exemple** : il manque un cas concret.
- **Correction** : une affirmation du parcours est inexacte ou datée.
- **Idée produit** : la demande concerne l’interface, les exports ou la navigation.
- **Hors périmètre** : la question est trop spécifique ou ne relève pas du parcours.

Ne pas gonfler artificiellement les modules : une réponse courte peut suffire.

## 3. Rédiger une réponse pédagogique

Respecter le ton du parcours :

- français clair, direct, sans hype ;
- phrases courtes, vocabulaire défini à la première occurrence ;
- distinction systématique entre ce qui est probable et ce qui est vérifié ;
- pas de promesse de confidentialité ou de sécurité non démontrée ;
- exemples concrets plutôt qu’analogies empilées ;
- quand une information est datée, l’indiquer.

Format conseillé d’une entrée de brief traitée :

```md
### Réponse courte
Le modèle ne mémorise pas la conversation : chaque appel est indépendant.

### Leçon à ajouter
**Titre :** La mémoire est une fonction de l’application
**Texte :** Le modèle reçoit uniquement le contexte envoyé à chaque requête. Une application peut conserver un historique et le réinjecter, mais ce n’est pas une mémoire interne du modèle.
**Exemple :** Deux conversations identiques dans deux onglets ne partagent pas leur contexte.

### Fichier et emplacement
`src/data/modules-core.js`, module 1, concepts après « Le contexte est toute sa mémoire ».

### Points à vérifier
- Vérifier que le module 11 distingue bien mémoire applicative et mémoire de modèle.
- Vérifier le vocabulaire « contexte » vs « fenêtre de contexte ».
```

## 4. Insérer le contenu au bon endroit

### Un concept manquant

Ajouter un objet dans `concepts` :

```js
{
  title: "Titre court et concret",
  text: "Deux à quatre phrases. Définir, expliquer, relier au module."
}
```

Éviter les doublons. Un concept doit répondre à une question identifiable.

### Un exemple

Modifier `example` du module. L’exemple doit être :

- situé ;
- vérifiable ;
- directement lié à l’idée centrale ;
- assez court pour rester un exemple, pas un nouveau module.

### Un exercice

Modifier `exercise`. Un bon exercice :

- produit une observation ou un artefact ;
- peut être fait avec un outil courant ;
- ne dépend pas d’un produit qui change chaque mois ;
- a une durée compatible avec l’annonce du module.

### Une auto-vérification

Modifier `selfCheck`. Chaque phrase doit être un critère observable :

- bon : « Je peux expliquer la différence entre entraînement et inférence. »
- faible : « J’ai compris le module. »

### Une question de quiz

Le quiz suit ce schéma :

```js
{
  question: "…",
  options: ["…", "…", "…"],
  answer: 1,
  explanation: "Pourquoi cette réponse est correcte, en une ou deux phrases."
}
```

`answer` est l’index de la bonne option (0, 1 ou 2). L’explication doit pouvoir être comprise sans relire tout le module.

### Une ressource

Ajouter d’abord l’entrée dans `src/data/resources.js` :

```js
{
  id: "identifiant-stable",
  title: "Titre",
  author: "Auteur ou organisation",
  url: "https://…",
  lang: "fr",
  price: "free",
  type: "video",
  duration: "~45 min",
  moduleIds: [4],
  description: "Ce que l’apprenant y trouve et pourquoi c’est utile."
}
```

Puis ajouter `id` dans `resourceIds` du module. Éviter les URL de suivi et vérifier que le lien fonctionne encore.

## 5. Mettre à jour la documentation et les tests

Après une modification :

```bash
npm test
npm run check
npm run dev
```

Vérifier manuellement :

1. le tableau de bord et la progression ;
2. la fiche du module modifié ;
3. le quiz, en choisissant une bonne et une mauvaise réponse ;
4. les ressources filtrées ;
5. l’affichage mobile (largeur < 720 px) ;
6. les exports de notes et de brief.

Mettre à jour `README.md` si les fonctionnalités ou les commandes changent, et `docs/architecture.md` si le schéma de données change.

## 6. Gérer les données de l’apprenant

Règles :

- **ne jamais** modifier ni supprimer les notes, exercices ou questions d’un apprenant ;
- les données vivent dans son navigateur, pas dans le dépôt ;
- une nouvelle version du contenu ne doit pas casser `iaLearnApp.v1` ;
- si le schéma évolue, incrémenter `VERSION` et écrire une migration dans `normalizeState` ;
- tester l’import d’une ancienne sauvegarde.

L’application doit rester lisible avec un état vide et avec un état partiel.

## 7. Répondre dans l’application ou dans le dépôt ?

### Dans l’application

L’apprenant peut répondre lui-même à une question depuis la carte : bouton **Répondre**, puis **Enregistrer**. La question passe au statut « Répondue » et reste consultable.

### Dans le dépôt

L’auteur modifie les fichiers de données pour intégrer la réponse au parcours. La question déjà traitée apparaît dans le brief sous « Questions déjà traitées » afin d’éviter de la retraiter.

Les deux usages sont complémentaires : répondre dans l’application garde une trace personnelle ; modifier le dépôt améliore le parcours pour tous.

## 8. Critères de qualité avant publication

- Aucune réponse non vérifiée présentée comme certaine.
- Aucun exemple dépendant d’une interface qui change toutes les semaines.
- Aucun doublon de concept ou de question.
- Les exercices sont réalisables sans compte payant.
- Les ressources sont accessibles et pertinentes.
- Le quiz a exactement trois options et une explication.
- Les tests passent.
- Le rendu mobile reste propre.
- Les notes personnelles ne sont jamais incluses dans les fichiers du dépôt.
