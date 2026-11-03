/*
 * Noyau métier de l’application : état, progression, exports.
 * Aucune dépendance au DOM ni au stockage : testable avec Node.
 */
window.IACore = (function () {
  "use strict";

  const APP_ID = "ia-learn-app";
  const VERSION = 1;
  const STORAGE_KEY = "iaLearnApp.v1";
  const QUESTION_TYPES = ["question", "idea", "bug"];

  function nowISO() {
    return new Date().toISOString();
  }

  function safeDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function formatDate(value, withTime) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric"
    };
    if (withTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    try {
      return new Intl.DateTimeFormat("fr-FR", options).format(date);
    } catch (error) {
      return date.toLocaleDateString("fr-FR");
    }
  }

  function formatShortDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString("fr-FR");
    }
  }

  function createModuleProgress(module) {
    return {
      notes: "",
      exercise: "",
      exerciseDone: false,
      selfChecks: module.selfCheck.map(function () {
        return false;
      }),
      quiz: {},
      updatedAt: nowISO()
    };
  }

  function createDefaultState(modules) {
    const state = {
      app: APP_ID,
      version: VERSION,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      progress: {},
      questions: [],
      resourcesSeen: {},
      ui: {
        lastModuleId: modules.length ? modules[0].id : 1
      }
    };

    modules.forEach(function (module) {
      state.progress[module.id] = createModuleProgress(module);
    });

    return state;
  }

  function normalizeModuleProgress(raw, module) {
    const base = createModuleProgress(module);
    if (!raw || typeof raw !== "object") return base;

    const progress = {
      notes: typeof raw.notes === "string" ? raw.notes : "",
      exercise: typeof raw.exercise === "string" ? raw.exercise : "",
      exerciseDone: Boolean(raw.exerciseDone),
      selfChecks: module.selfCheck.map(function (_, index) {
        return Boolean(raw.selfChecks && raw.selfChecks[index]);
      }),
      quiz: {},
      updatedAt: safeDate(raw.updatedAt) || nowISO()
    };

    if (raw.quiz && typeof raw.quiz === "object") {
      module.quiz.forEach(function (_, index) {
        const entry = raw.quiz[index];
        if (!entry || typeof entry !== "object") return;
        const choice = Number(entry.choice);
        if (!Number.isInteger(choice) || choice < 0 || choice >= module.quiz[index].options.length) return;
        progress.quiz[index] = {
          choice: choice,
          checked: Boolean(entry.checked)
        };
      });
    }

    return progress;
  }

  function normalizeQuestion(raw, modules, questionsIndex) {
    if (!raw || typeof raw !== "object" || typeof raw.text !== "string" || !raw.text.trim()) {
      return null;
    }

    const validModuleIds = modules.map(function (module) {
      return module.id;
    });
    let moduleId = raw.moduleId === null || raw.moduleId === undefined ? null : Number(raw.moduleId);
    if (moduleId !== null && validModuleIds.indexOf(moduleId) === -1) moduleId = null;

    const type = QUESTION_TYPES.indexOf(raw.type) !== -1 ? raw.type : "question";
    const answer = typeof raw.answer === "string" ? raw.answer : "";
    const status = raw.status === "answered" || answer.trim() ? "answered" : "open";
    const createdAt = safeDate(raw.createdAt) || nowISO();

    return {
      id: typeof raw.id === "string" && raw.id.trim() ? raw.id : "q-" + Date.now().toString(36) + "-" + questionsIndex,
      moduleId: moduleId,
      type: type,
      text: raw.text.trim(),
      context: typeof raw.context === "string" ? raw.context.trim() : "",
      answer: answer,
      status: status,
      createdAt: createdAt,
      updatedAt: safeDate(raw.updatedAt) || createdAt,
      answeredAt: status === "answered" ? safeDate(raw.answeredAt) || nowISO() : null
    };
  }

  function normalizeResourcesSeen(raw, resources) {
    const seen = {};
    if (!raw || typeof raw !== "object") return seen;
    const validIds = resources.map(function (resource) {
      return resource.id;
    });
    validIds.forEach(function (id) {
      if (raw[id]) seen[id] = safeDate(raw[id]) || nowISO();
    });
    return seen;
  }

  function normalizeState(raw, modules, resources) {
    if (!raw || typeof raw !== "object") {
      return createDefaultState(modules);
    }

    const state = createDefaultState(modules);
    state.createdAt = safeDate(raw.createdAt) || state.createdAt;
    state.updatedAt = safeDate(raw.updatedAt) || state.updatedAt;

    modules.forEach(function (module) {
      state.progress[module.id] = normalizeModuleProgress(
        raw.progress ? raw.progress[module.id] : null,
        module
      );
    });

    if (Array.isArray(raw.questions)) {
      state.questions = raw.questions
        .map(function (question, index) {
          return normalizeQuestion(question, modules, index);
        })
        .filter(Boolean);
    }

    state.resourcesSeen = normalizeResourcesSeen(raw.resourcesSeen, resources);

    const lastModuleId = raw.ui && Number(raw.ui.lastModuleId);
    if (
      Number.isInteger(lastModuleId) &&
      modules.some(function (module) {
        return module.id === lastModuleId;
      })
    ) {
      state.ui.lastModuleId = lastModuleId;
    }

    return state;
  }

  function ensureModuleState(state, module) {
    if (!state.progress[module.id]) {
      state.progress[module.id] = createModuleProgress(module);
    }
    const progress = state.progress[module.id];
    if (!Array.isArray(progress.selfChecks)) {
      progress.selfChecks = module.selfCheck.map(function () {
        return false;
      });
    }
    if (!progress.quiz || typeof progress.quiz !== "object") {
      progress.quiz = {};
    }
    return progress;
  }

  function moduleCheckProgress(state, module) {
    const progress = ensureModuleState(state, module);
    const checked = progress.selfChecks.filter(Boolean).length;
    const total = module.selfCheck.length;
    return {
      checked: checked,
      total: total,
      ratio: total ? checked / total : 0
    };
  }

  function isModuleComplete(state, module) {
    const progress = moduleCheckProgress(state, module);
    return progress.total > 0 && progress.checked === progress.total;
  }

  function isModuleStarted(state, module) {
    const progress = ensureModuleState(state, module);
    return (
      progress.selfChecks.some(Boolean) ||
      Boolean(progress.notes.trim()) ||
      Boolean(progress.exercise.trim()) ||
      progress.exerciseDone
    );
  }

  function globalStats(state, modules) {
    const completed = modules.filter(function (module) {
      return isModuleComplete(state, module);
    }).length;
    const started = modules.filter(function (module) {
      return isModuleStarted(state, module);
    }).length;
    return {
      total: modules.length,
      completed: completed,
      started: started,
      percent: modules.length ? Math.round((completed / modules.length) * 100) : 0
    };
  }

  function quizScore(state, module) {
    const progress = ensureModuleState(state, module);
    let score = 0;
    let answered = 0;
    module.quiz.forEach(function (question, index) {
      const entry = progress.quiz[index];
      if (entry && entry.checked) {
        answered += 1;
        if (entry.choice === question.answer) score += 1;
      }
    });
    return {
      score: score,
      answered: answered,
      total: module.quiz.length
    };
  }

  function notesStats(state, modules) {
    let modulesWithNotes = 0;
    let modulesWithExercise = 0;
    let notesCharacters = 0;
    let exerciseCharacters = 0;
    let lastUpdated = null;

    modules.forEach(function (module) {
      const progress = ensureModuleState(state, module);
      if (progress.notes.trim()) {
        modulesWithNotes += 1;
        notesCharacters += progress.notes.trim().length;
      }
      if (progress.exercise.trim()) {
        modulesWithExercise += 1;
        exerciseCharacters += progress.exercise.trim().length;
      }
      if (
        (progress.notes.trim() || progress.exercise.trim()) &&
        (!lastUpdated || progress.updatedAt > lastUpdated)
      ) {
        lastUpdated = progress.updatedAt;
      }
    });

    return {
      modulesWithNotes: modulesWithNotes,
      modulesWithExercise: modulesWithExercise,
      notesCharacters: notesCharacters,
      exerciseCharacters: exerciseCharacters,
      lastUpdated: lastUpdated
    };
  }

  function questionsStats(state) {
    const stats = {
      total: state.questions.length,
      open: 0,
      answered: 0,
      question: 0,
      idea: 0,
      bug: 0
    };
    state.questions.forEach(function (question) {
      if (question.status === "answered") stats.answered += 1;
      else stats.open += 1;
      if (stats[question.type] !== undefined) stats[question.type] += 1;
    });
    return stats;
  }

  function resourcesSeenCount(state, resources) {
    return resources.filter(function (resource) {
      return Boolean(state.resourcesSeen[resource.id]);
    }).length;
  }

  function moduleLabel(module) {
    return module.optional ? "Option · " + module.title : "Module " + module.id + " · " + module.title;
  }

  function findModule(data, id) {
    return data.modules
      .concat(data.optionalModules || [])
      .find(function (module) {
        return module.id === Number(id);
      }) || null;
  }

  function truncate(text, length) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= length) return clean;
    return clean.slice(0, length).replace(/\s+\S*$/, "") + "…";
  }

  function questionTypeLabel(type) {
    if (type === "idea") return "Idée d’amélioration";
    if (type === "bug") return "Problème d’usage";
    return "Question de cours";
  }

  function buildBackup(state) {
    return JSON.stringify(state, null, 2);
  }

  function validateBackup(raw) {
    const errors = [];
    if (!raw || typeof raw !== "object") {
      return { ok: false, errors: ["Le fichier ne contient pas un objet JSON valide."] };
    }
    if (raw.app !== APP_ID) {
      errors.push("Ce fichier ne semble pas être une sauvegarde de Parcours IA.");
    }
    if (typeof raw.version !== "number") {
      errors.push("La version de sauvegarde est absente.");
    }
    if (raw.version > VERSION) {
      errors.push("Cette sauvegarde vient d’une version plus récente de l’application.");
    }
    if (!raw.progress || typeof raw.progress !== "object") {
      errors.push("Les données de progression sont absentes.");
    }
    if (raw.questions && !Array.isArray(raw.questions)) {
      errors.push("Le format des questions est invalide.");
    }
    return {
      ok: errors.length === 0,
      errors: errors
    };
  }

  function buildAuthorBrief(state, data) {
    const modules = data.modules.concat(data.optionalModules || []);
    const stats = globalStats(state, data.modules);
    const qStats = questionsStats(state);
    const lines = [];

    lines.push("# Brief d’amélioration — Parcours IA");
    lines.push("");
    lines.push("Généré le " + formatDate(nowISO(), true) + " depuis l’application d’apprentissage.");
    lines.push("");
    lines.push(
      "Progression : " +
        stats.completed +
        "/" +
        stats.total +
        " modules terminés (" +
        stats.percent +
        " %). Questions : " +
        qStats.total +
        " au total, dont " +
        qStats.open +
        " ouverte(s)."
    );
    lines.push("");
    lines.push(
      "Objectif de ce document : transformer les questions, idées et notes de l’apprenant en réponses pédagogiques et en leçons à ajouter au parcours."
    );
    lines.push("");
    lines.push("---");
    lines.push("");

    const openQuestions = state.questions
      .filter(function (question) {
        return question.status === "open";
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    lines.push("## Questions sans réponse");
    lines.push("");

    if (!openQuestions.length) {
      lines.push("_Aucune question ouverte pour le moment._");
      lines.push("");
    } else {
      modules.forEach(function (module) {
        const moduleQuestions = openQuestions.filter(function (question) {
          return question.moduleId === module.id;
        });
        if (!moduleQuestions.length) return;
        lines.push("### " + moduleLabel(module));
        lines.push("");
        moduleQuestions.forEach(function (question, index) {
          lines.push("#### " + (index + 1) + ". " + question.text);
          lines.push("");
          lines.push("- **Type :** " + questionTypeLabel(question.type));
          lines.push("- **Posée le :** " + formatDate(question.createdAt));
          if (question.context) lines.push("- **Contexte :** " + question.context);
          lines.push("");
        });
      });

      const generalQuestions = openQuestions.filter(function (question) {
        return question.moduleId === null;
      });
      if (generalQuestions.length) {
        lines.push("### Questions générales");
        lines.push("");
        generalQuestions.forEach(function (question, index) {
          lines.push("#### " + (index + 1) + ". " + question.text);
          lines.push("");
          lines.push("- **Type :** " + questionTypeLabel(question.type));
          if (question.context) lines.push("- **Contexte :** " + question.context);
          lines.push("");
        });
      }
    }

    const feedback = state.questions.filter(function (question) {
      return question.type === "idea" || question.type === "bug";
    });

    if (feedback.length) {
      lines.push("## Idées et problèmes signalés");
      lines.push("");
      feedback.forEach(function (question) {
        lines.push(
          "- **" +
            questionTypeLabel(question.type) +
            "**" +
            (question.moduleId !== null ? " (" + (findModule(data, question.moduleId) || {}).title + ")" : "") +
            " : " +
            question.text
        );
        if (question.answer) lines.push("  - Réponse déjà notée : " + truncate(question.answer, 300));
      });
      lines.push("");
    }

    const answeredQuestions = state.questions.filter(function (question) {
      return question.status === "answered";
    });
    if (answeredQuestions.length) {
      lines.push("## Questions déjà traitées (pour éviter les doublons)");
      lines.push("");
      answeredQuestions.forEach(function (question) {
        lines.push("- " + question.text + (question.answer ? " — " + truncate(question.answer, 240) : ""));
      });
      lines.push("");
    }

    lines.push("## Notes de l’apprenant (contexte)");
    lines.push("");
    let notesCount = 0;
    modules.forEach(function (module) {
      const progress = ensureModuleState(state, module);
      if (!progress.notes.trim() && !progress.exercise.trim()) return;
      notesCount += 1;
      lines.push("### " + moduleLabel(module));
      if (progress.notes.trim()) {
        lines.push("");
        lines.push("**Notes :**");
        lines.push("");
        lines.push(truncate(progress.notes, 900));
      }
      if (progress.exercise.trim()) {
        lines.push("");
        lines.push("**Exercice :**");
        lines.push("");
        lines.push(truncate(progress.exercise, 600));
      }
      lines.push("");
    });
    if (!notesCount) {
      lines.push("_Aucune note pour le moment._");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
    lines.push("## Consigne pour l’assistant qui améliore l’application");
    lines.push("");
    lines.push(
      "Pour chaque question ouverte : rédige une réponse pédagogique en français, ajoute si nécessaire une notion ou un exemple au module concerné, puis indique précisément où l’insérer dans `src/data/modules-core.js` ou `src/data/modules-optional.js`."
    );
    lines.push("");
    lines.push(
      "Ne modifie pas les notes personnelles de l’apprenant. Conserve le ton du parcours, les guillemets français et la structure des cartes. Signale les questions qui demandent une vérification factuelle."
    );
    lines.push("");
    lines.push("### Format de réponse souhaité");
    lines.push("");
    lines.push("1. **Réponse courte** à la question.");
    lines.push("2. **Leçon à ajouter** (titre + texte + exemple éventuel).");
    lines.push("3. **Fichier et emplacement** proposés.");
    lines.push("4. **Points à vérifier** dans les sources.");
    lines.push("");
    return lines.join("\n");
  }

  function buildReportMarkdown(state, data) {
    const modules = data.modules.concat(data.optionalModules || []);
    const stats = globalStats(state, data.modules);
    const optionalStats = globalStats(state, data.optionalModules || []);
    const notes = notesStats(state, modules);
    const qStats = questionsStats(state);
    const lines = [];

    lines.push("# Rapport d’apprentissage — Parcours IA");
    lines.push("");
    lines.push("Exporté le " + formatDate(nowISO(), true) + ".");
    lines.push("");
    lines.push("## Synthèse");
    lines.push("");
    lines.push("- Modules principaux terminés : " + stats.completed + "/" + stats.total + " (" + stats.percent + " %)");
    lines.push(
      "- Modules optionnels terminés : " +
        optionalStats.completed +
        "/" +
        optionalStats.total
    );
    lines.push("- Modules avec des notes : " + notes.modulesWithNotes);
    lines.push("- Questions enregistrées : " + qStats.total + " (dont " + qStats.open + " ouvertes)");
    lines.push(
      "- Ressources consultées : " +
        resourcesSeenCount(state, data.resources) +
        "/" +
        data.resources.length
    );
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Progression par module");
    lines.push("");

    modules.forEach(function (module) {
      const progress = ensureModuleState(state, module);
      const checks = moduleCheckProgress(state, module);
      const score = quizScore(state, module);
      lines.push("### " + moduleLabel(module));
      lines.push("");
      lines.push(
        "- Statut : " +
          (isModuleComplete(state, module) ? "terminé" : isModuleStarted(state, module) ? "en cours" : "à découvrir")
      );
      lines.push("- Auto-vérification : " + checks.checked + "/" + checks.total);
      lines.push("- Exercice : " + (progress.exerciseDone ? "marqué comme fait" : "non marqué"));
      if (score.answered) lines.push("- Quiz : " + score.score + "/" + score.total + " (répondu à " + score.answered + ")");
      if (progress.notes.trim()) {
        lines.push("");
        lines.push("**Notes :**");
        lines.push("");
        lines.push(progress.notes.trim());
      }
      if (progress.exercise.trim()) {
        lines.push("");
        lines.push("**Exercice :**");
        lines.push("");
        lines.push(progress.exercise.trim());
      }
      lines.push("");
    });

    lines.push("---");
    lines.push("");
    lines.push("## Questions et réponses");
    lines.push("");
    if (!state.questions.length) {
      lines.push("_Aucune question enregistrée._");
      lines.push("");
    } else {
      state.questions
        .slice()
        .sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .forEach(function (question) {
          const module = question.moduleId !== null ? findModule(data, question.moduleId) : null;
          lines.push("### " + question.text);
          lines.push("");
          lines.push("- Module : " + (module ? module.title : "Général"));
          lines.push("- Type : " + questionTypeLabel(question.type));
          lines.push("- Statut : " + (question.status === "answered" ? "répondue" : "ouverte"));
          lines.push("- Date : " + formatDate(question.createdAt));
          if (question.context) lines.push("- Contexte : " + question.context);
          if (question.answer) {
            lines.push("");
            lines.push("**Réponse :**");
            lines.push("");
            lines.push(question.answer);
          }
          lines.push("");
        });
    }

    lines.push("---");
    lines.push("");
    lines.push("## Ressources consultées");
    lines.push("");
    const seen = data.resources.filter(function (resource) {
      return state.resourcesSeen[resource.id];
    });
    if (!seen.length) {
      lines.push("_Aucune ressource marquée comme consultée._");
    } else {
      seen.forEach(function (resource) {
        lines.push("- [" + resource.title + "](" + resource.url + ") — " + formatShortDate(state.resourcesSeen[resource.id]));
      });
    }
    lines.push("");
    return lines.join("\n");
  }

  function buildNotesMarkdown(state, data) {
    const modules = data.modules.concat(data.optionalModules || []);
    const notes = notesStats(state, modules);
    const lines = [];
    lines.push("# Notes et exercices — Parcours IA");
    lines.push("");
    lines.push("Exporté le " + formatDate(nowISO(), true) + ".");
    lines.push("");
    lines.push(
      notes.modulesWithNotes +
        " module(s) avec des notes, " +
        notes.modulesWithExercise +
        " avec un exercice rédigé."
    );
    lines.push("");
    lines.push("---");
    lines.push("");

    let count = 0;
    modules.forEach(function (module) {
      const progress = ensureModuleState(state, module);
      if (!progress.notes.trim() && !progress.exercise.trim()) return;
      count += 1;
      lines.push("## " + moduleLabel(module));
      lines.push("");
      if (progress.notes.trim()) {
        lines.push("### Notes");
        lines.push("");
        lines.push(progress.notes.trim());
        lines.push("");
      }
      if (progress.exercise.trim()) {
        lines.push("### Exercice");
        lines.push("");
        lines.push(progress.exercise.trim());
        lines.push("");
      }
    });

    if (!count) {
      lines.push("_Aucune note pour le moment._");
      lines.push("");
    }

    return lines.join("\n");
  }

  return {
    APP_ID: APP_ID,
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    QUESTION_TYPES: QUESTION_TYPES,
    nowISO: nowISO,
    formatDate: formatDate,
    formatShortDate: formatShortDate,
    createDefaultState: createDefaultState,
    normalizeState: normalizeState,
    ensureModuleState: ensureModuleState,
    moduleCheckProgress: moduleCheckProgress,
    isModuleComplete: isModuleComplete,
    isModuleStarted: isModuleStarted,
    globalStats: globalStats,
    quizScore: quizScore,
    notesStats: notesStats,
    questionsStats: questionsStats,
    resourcesSeenCount: resourcesSeenCount,
    findModule: findModule,
    truncate: truncate,
    questionTypeLabel: questionTypeLabel,
    buildBackup: buildBackup,
    validateBackup: validateBackup,
    buildAuthorBrief: buildAuthorBrief,
    buildReportMarkdown: buildReportMarkdown,
    buildNotesMarkdown: buildNotesMarkdown
  };
})();
