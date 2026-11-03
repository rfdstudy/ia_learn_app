/*
 * Modules optionnels du parcours : pour approfondir le budget, la méthode
 * d’apprentissage et la pratique du code avec l’IA.
 */
Object.assign(window.IA_DATA, {
  optionalModules: [
    {
      id: 101,
      shortTitle: "Coûts et limites",
      title: "Coûts et limites",
      kicker: "Optionnel · Budget",
      duration: "45 min à 1 h",
      idea: "Comprendre où part l’argent permet d’utiliser les bons modèles au bon moment, sans payer pour de la puissance inutile.",
      concepts: [
        {
          title: "Tokens d’entrée et de sortie",
          text: "Les fournisseurs facturent séparément ce que vous envoyez et ce que le modèle produit. Les tokens de sortie sont souvent plus chers. Une longue réponse coûte donc plus qu’une réponse courte."
        },
        {
          title: "Abonnement ou API",
          text: "Un abonnement donne accès à une application selon ses limites. Une API se paie à l’usage, généralement au million de tokens. Ce ne sont pas les mêmes modèles économiques."
        },
        {
          title: "Ce qui fait grimper la facture",
          text: "Un contexte très long, une conversation qui s’allonge, un agent qui multiplie les appels et des sorties verbeuses. Le coût d’une tâche agentique peut être bien supérieur à celui d’une question simple."
        },
        {
          title: "Trois leviers",
          text: "Utiliser un petit modèle pour les tâches simples, raccourcir le contexte en ne gardant que l’essentiel, et éviter les itérations inutiles. Mesurez avant d’optimiser."
        }
      ],
      example: "Résumer 100 pages avec un grand modèle coûte plus cher qu’avec un petit modèle. Si la tâche est simple, testez le petit d’abord ; raccourcissez le contexte et évitez de relancer dix fois la même demande.",
      exercise: "Prenez une tâche que vous faites régulièrement avec l’IA. Estimez le nombre de tokens d’entrée et de sortie, puis comparez le coût sur LLM Pricing avec un petit et un grand modèle. Notez le levier que vous pourriez appliquer.",
      selfCheck: [
        "Je distingue un abonnement d’une facturation à l’usage.",
        "Je connais trois façons de réduire le coût d’une tâche.",
        "Je sais pourquoi les tokens de sortie comptent."
      ],
      quiz: [
        {
          question: "Les tokens de sortie sont…",
          options: [
            "toujours gratuits",
            "facturés, souvent plus cher que les tokens d’entrée",
            "invisibles"
          ],
          answer: 1,
          explanation: "La génération de la réponse a un coût, généralement supérieur à celui de la lecture du contexte."
        },
        {
          question: "Un abonnement à une application…",
          options: [
            "est la même chose qu’une facture API",
            "donne accès à l’application selon ses limites ; l’API se paie à l’usage",
            "n’a jamais de limite"
          ],
          answer: 1,
          explanation: "L’abonnement et l’API sont deux modes de facturation différents."
        },
        {
          question: "Pour réduire la dépense…",
          options: [
            "utiliser un petit modèle pour les tâches simples et raccourcir le contexte",
            "envoyer tout le document à chaque question",
            "utiliser le plus grand modèle pour tout"
          ],
          answer: 0,
          explanation: "Le bon modèle au bon moment et un contexte ciblé réduisent le coût sans sacrifier l’essentiel."
        }
      ],
      resourceIds: ["openreplay-costs", "llm-pricing"],
      optional: true
    },
    {
      id: 102,
      shortTitle: "Apprendre avec l’IA",
      title: "Apprendre avec l’IA sans perdre ses compétences",
      kicker: "Optionnel · Méthode",
      duration: "45 min à 1 h",
      idea: "L’IA peut être un excellent tuteur… ou un raccourci qui fait le travail à votre place. La différence tient à la façon de l’utiliser.",
      concepts: [
        {
          title: "Tuteur, pas substitut",
          text: "Demandez des indices, des questions et des explications plutôt que la solution. Essayez d’abord, puis utilisez l’IA pour débloquer et comprendre."
        },
        {
          title: "Faire verbaliser",
          text: "Expliquez la notion avec vos mots, puis demandez à l’IA de repérer les imprécisions. Faites-vous interroger au lieu de seulement relire."
        },
        {
          title: "Vérifier sans l’IA",
          text: "Refaites régulièrement un exercice seul, sans aide. C’est ce test qui montre ce que vous savez vraiment faire. L’IA peut ensuite corriger et expliquer."
        },
        {
          title: "Éviter la dépendance",
          text: "Le conflit cognitif et l’effort de récupération font partie de l’apprentissage. Si l’IA répond avant que vous ayez cherché, vous risquez de perdre la compétence."
        }
      ],
      example: "Demandez à l’IA : « Ne me donne pas la solution. Pose-moi des questions et donne-moi un indice à la fois. » Puis, le lendemain, refaites l’exercice seul. C’est ce test sans aide qui mesure vraiment l’apprentissage.",
      exercise: "Choisissez un exercice difficile. Demandez à l’IA de vous guider par indices, sans donner la solution. Le lendemain, refaites l’exercice sans aucune aide, puis comparez.",
      selfCheck: [
        "Je sais utiliser l’IA comme tuteur sans lui déléguer ma réflexion.",
        "Je vérifie régulièrement ce que je sais faire sans elle.",
        "Je demande des indices et des questions avant la solution."
      ],
      quiz: [
        {
          question: "Utiliser l’IA comme tuteur, c’est…",
          options: [
            "lui demander des indices et des questions plutôt que la solution",
            "lui faire faire tous les exercices",
            "lui demander de rédiger le devoir"
          ],
          answer: 0,
          explanation: "Le tuteur fait travailler l’élève ; il ne fait pas le travail à sa place."
        },
        {
          question: "Pour vérifier ses acquis…",
          options: [
            "relire la réponse de l’IA",
            "refaire l’exercice sans aide et se tester",
            "regarder une vidéo de plus"
          ],
          answer: 1,
          explanation: "La récupération active sans aide est un meilleur test que la relecture."
        },
        {
          question: "Le risque d’un usage mal placé est…",
          options: [
            "de progresser plus vite",
            "de déléguer sa réflexion et de perdre la compétence",
            "de ne pas utiliser assez l’IA"
          ],
          answer: 1,
          explanation: "Si l’IA pense à votre place, l’effort d’apprentissage disparaît."
        }
      ],
      resourceIds: ["believemy-learn", "perplexity-study", "sorbonne-guide"],
      optional: true
    },
    {
      id: 103,
      shortTitle: "Coder avec l’IA",
      title: "Coder avec l’IA",
      kicker: "Optionnel · Code",
      duration: "45 min à 1 h",
      idea: "Un assistant de code est puissant, mais le code reste votre responsabilité : il faut le comprendre, le tester et pouvoir revenir en arrière.",
      concepts: [
        {
          title: "Relire avant d’exécuter",
          text: "Lisez le code généré, vérifiez les dépendances, les effets de bord et les cas limites. Un code qui compile n’est pas forcément un code correct."
        },
        {
          title: "Tester",
          text: "Écrivez ou lancez des tests, essayez des entrées inhabituelles, reproduisez le bug. Le test est ce qui transforme une impression en preuve."
        },
        {
          title: "Versionner avec Git",
          text: "Commits petits et fréquents, messages clairs, possibilité de revenir en arrière. Git est votre filet de sécurité quand une génération casse quelque chose."
        },
        {
          title: "Demander des explications",
          text: "Demandez une explication ligne par ligne, les alternatives et les compromis. Si vous ne pouvez pas expliquer le code, vous ne pourrez pas le maintenir."
        },
        {
          title: "Refaire à la main",
          text: "Reproduisez les parties clés sans l’IA. C’est le meilleur moyen de garder la compréhension et de progresser comme développeur."
        }
      ],
      example: "Générez une fonction, lisez-la ligne par ligne, écrivez un test, exécutez-le, puis refaites la partie centrale sans l’IA. Le code doit rester quelque chose que vous pouvez expliquer et maintenir.",
      exercise: "Demandez une petite fonction à un assistant, puis : relisez-la, écrivez un test, exécutez-le, demandez une explication ligne par ligne et refaites la partie centrale à la main.",
      selfCheck: [
        "Je relis, teste et versionne le code généré.",
        "Je sais refaire à la main les parties clés pour garder la compréhension.",
        "Je demande des explications avant de valider un code que je ne comprends pas."
      ],
      quiz: [
        {
          question: "Avant d’exécuter du code généré, il faut…",
          options: [
            "le relire et comprendre ce qu’il fait",
            "le déployer directement",
            "supprimer les tests"
          ],
          answer: 0,
          explanation: "La relecture permet de repérer les effets de bord et les erreurs avant qu’elles ne causent des dégâts."
        },
        {
          question: "Git sert à…",
          options: [
            "versionner et pouvoir revenir en arrière",
            "accélérer le modèle",
            "remplacer les tests"
          ],
          answer: 0,
          explanation: "Git conserve l’historique et permet d’annuler une modification problématique."
        },
        {
          question: "Pour garder la compréhension…",
          options: [
            "refaire à la main les parties clés",
            "ne jamais lire le code",
            "demander uniquement des réponses sans explication"
          ],
          answer: 0,
          explanation: "Réécrire sans l’IA ancre la logique et révèle les zones floues."
        }
      ],
      resourceIds: ["cline", "karpathy-how"],
      optional: true
    }
  ]
});
