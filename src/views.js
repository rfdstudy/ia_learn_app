/*
 * Vues principales : tableau de bord, fiche d’un module, cartes de questions
 * et quiz. Les vues sont des fonctions pures qui retournent du HTML.
 */
(function () {
  "use strict";

  const Core = window.IACore;
  const UI = window.IAUI;
  const data = window.IA_DATA;
  const modules = data.modules;
  const optionalModules = data.optionalModules || [];
  const allModules = modules.concat(optionalModules);
  const resources = data.resources;
  const moduleMap = new Map(allModules.map(function (module) {
    return [module.id, module];
  }));
  const resourceMap = new Map(resources.map(function (resource) {
    return [resource.id, resource];
  }));

  const VIEWS = (window.IAViews = window.IAViews || {});

  const TYPE_SHORT = {
    question: "Question",
    idea: "Idée",
    bug: "Problème"
  };

  const TYPE_ICON = {
    question: "help",
    idea: "lightbulb",
    bug: "bug"
  };

  function moduleStatus(app, module) {
    const checks = Core.moduleCheckProgress(app.state, module);
    const complete = Core.isModuleComplete(app.state, module);
    const started = Core.isModuleStarted(app.state, module);
    return {
      checks: checks,
      complete: complete,
      started: started,
      label: complete ? "Terminé" : started ? "En cours" : "À découvrir"
    };
  }

  function getModuleQuestions(state, moduleId) {
    return state.questions
      .filter(function (question) {
        return question.moduleId === moduleId;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function getResourcesForModule(moduleId) {
    return resources.filter(function (resource) {
      return resource.moduleIds.indexOf(moduleId) !== -1;
    });
  }

  function charLabel(text) {
    const count = text ? text.length : 0;
    return count + " caractère" + (count > 1 ? "s" : "");
  }

  /* ------------------------------- Dashboard ------------------------------- */

  function renderPathCard(app, module) {
    const status = moduleStatus(app, module);
    const progress = Core.ensureModuleState(app.state, module);
    const hasNotes = Boolean(progress.notes.trim() || progress.exercise.trim());
    const ratio = status.checks.total ? Math.round((status.checks.checked / status.checks.total) * 100) : 0;
    return (
      '<a class="path-card' +
      (status.complete ? " is-complete" : "") +
      (status.started && !status.complete ? " is-started" : "") +
      '" href="#/module/' +
      module.id +
      '">' +
      '<div class="path-top">' +
      '<span class="path-num">' +
      (status.complete ? UI.icon("check", 18) : UI.moduleBadge(module)) +
      "</span>" +
      '<span class="path-status">' +
      status.label +
      "</span>" +
      "</div>" +
      "<h3>" +
      UI.escapeHTML(module.title) +
      "</h3>" +
      '<p class="path-meta">' +
      UI.escapeHTML(module.kicker) +
      " · " +
      UI.escapeHTML(module.duration) +
      "</p>" +
      '<div class="path-progress"><span style="width:' +
      ratio +
      '%"></span></div>' +
      '<div class="path-foot"><span>' +
      status.checks.checked +
      "/" +
      status.checks.total +
      " vérifications</span>" +
      (hasNotes ? '<span class="path-note" title="Notes écrites">' + UI.icon("note", 14) + " Notes</span>" : "") +
      "</div>" +
      "</a>"
    );
  }

  function recentNotes(app) {
    return allModules
      .map(function (module) {
        return {
          module: module,
          progress: Core.ensureModuleState(app.state, module)
        };
      })
      .filter(function (item) {
        return item.progress.notes.trim() || item.progress.exercise.trim();
      })
      .sort(function (a, b) {
        return new Date(b.progress.updatedAt) - new Date(a.progress.updatedAt);
      })
      .slice(0, 3);
  }

  function openQuestions(app) {
    return app.state.questions
      .filter(function (question) {
        return question.status === "open";
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 3);
  }

  VIEWS.dashboard = function (app) {
    const stats = Core.globalStats(app.state, modules);
    const optionalStats = Core.globalStats(app.state, optionalModules);
    const qStats = Core.questionsStats(app.state);
    const notes = Core.notesStats(app.state, allModules);
    const seenResources = Core.resourcesSeenCount(app.state, resources);
    const nextModule =
      modules.find(function (module) {
        return !Core.isModuleComplete(app.state, module);
      }) || modules[modules.length - 1];
    const recent = recentNotes(app);
    const questions = openQuestions(app);
    const allDone = stats.completed === stats.total;

    return (
      '<div class="page dashboard-page">' +
      '<section class="hero-card">' +
      '<div class="hero-copy">' +
      '<p class="eyebrow">Parcours d’apprentissage · 12 modules</p>' +
      "<h1>Bien utiliser l’IA,<br><span>vraiment.</span></h1>" +
      '<p class="hero-lead">Comprendre les modèles, poser les bonnes questions, vérifier les réponses et construire votre propre pile IA. Un parcours progressif, sans hype et à votre rythme.</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-primary btn-lg" href="#/module/' +
      nextModule.id +
      '">' +
      (allDone ? "Revoir le parcours" : stats.completed ? "Continuer le module " + nextModule.id : "Commencer le parcours") +
      UI.icon("arrow-right", 18) +
      "</a>" +
      '<a class="btn btn-secondary btn-lg" href="#/ressources">' +
      UI.icon("book", 18) +
      "Explorer les ressources</a>" +
      "</div>" +
      '<p class="hero-footnote">' +
      UI.icon("clock", 15) +
      " 1 à 2 h par module · à votre rythme · données locales" +
      "</p>" +
      "</div>" +
      '<div class="hero-progress">' +
      '<div class="progress-ring" style="--progress:' +
      stats.percent +
      '%">' +
      '<div class="progress-ring-inner">' +
      "<strong>" +
      stats.percent +
      "%</strong>" +
      "<span>terminé</span>" +
      "</div>" +
      "</div>" +
      "<p><strong>" +
      stats.completed +
      "</strong> module" +
      (stats.completed > 1 ? "s" : "") +
      " sur " +
      stats.total +
      "</p>" +
      '<span class="hero-progress-note">' +
      (allDone ? "Parcours principal terminé" : "Prochain objectif : module " + nextModule.id) +
      "</span>" +
      "</div>" +
      "</section>" +
      '<section class="stats-grid" aria-label="Votre progression en un coup d’œil">' +
      '<div class="stat-card"><span class="stat-icon">' +
      UI.icon("check-circle", 20) +
      '</span><div><strong>' +
      stats.completed +
      "<span>/" +
      stats.total +
      "</span></strong><small>Modules terminés</small></div></div>" +
      '<div class="stat-card"><span class="stat-icon">' +
      UI.icon("note", 20) +
      '</span><div><strong>' +
      notes.modulesWithNotes +
      "</strong><small>Modules annotés</small></div></div>" +
      '<div class="stat-card"><span class="stat-icon">' +
      UI.icon("message", 20) +
      '</span><div><strong>' +
      qStats.open +
      "</strong><small>Questions ouvertes</small></div></div>" +
      '<div class="stat-card"><span class="stat-icon">' +
      UI.icon("book", 20) +
      '</span><div><strong>' +
      seenResources +
      "<span>/" +
      resources.length +
      "</span></strong><small>Ressources consultées</small></div></div>" +
      "</section>" +
      '<section class="dashboard-section">' +
      '<div class="section-head">' +
      "<div><p class=\"eyebrow\">Le parcours</p><h2>12 modules, du fondamental au concret</h2></div>" +
      '<a class="text-link" href="#/notes">Voir mes notes ' +
      UI.icon("arrow-right", 16) +
      "</a>" +
      "</div>" +
      '<div class="path-grid">' +
      modules.map(function (module) {
        return renderPathCard(app, module);
      }).join("") +
      "</div>" +
      "</section>" +
      (optionalModules.length
        ? '<section class="dashboard-section">' +
          '<div class="section-head">' +
          '<div><p class="eyebrow">Pour aller plus loin</p><h2>Modules optionnels</h2></div>' +
          '<span class="section-note">' +
          optionalStats.completed +
          "/" +
          optionalStats.total +
          " terminés</span>" +
          "</div>" +
          '<div class="path-grid optional-grid">' +
          optionalModules.map(function (module) {
            return renderPathCard(app, module);
          }).join("") +
          "</div>" +
          "</section>"
        : "") +
      '<section class="dashboard-columns">' +
      '<div class="card recent-panel">' +
      '<div class="panel-head"><div><p class="section-label">Carnet</p><h2>Dernières notes</h2></div><a class="text-link" href="#/notes">Tout voir ' +
      UI.icon("arrow-right", 16) +
      "</a></div>" +
      (recent.length
        ? '<div class="recent-list">' +
          recent
            .map(function (item) {
              const excerpt = item.progress.notes.trim() || item.progress.exercise.trim();
              return (
                '<a class="recent-item" href="#/module/' +
                item.module.id +
                '" data-open-tab="' +
                (item.progress.notes.trim() ? "notes" : "exercise") +
                '">' +
                '<span class="recent-badge">' +
                UI.moduleBadge(item.module) +
                "</span>" +
                '<span class="recent-copy"><strong>' +
                UI.escapeHTML(item.module.shortTitle) +
                "</strong><small>" +
                UI.escapeHTML(Core.truncate(excerpt, 110)) +
                "</small></span>" +
                '<span class="recent-date">' +
                Core.formatShortDate(item.progress.updatedAt) +
                "</span>" +
                "</a>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="empty-state compact"><span>' +
          UI.icon("note", 24) +
          "</span><p>Vos notes de module apparaîtront ici.</p><a class=\"text-link\" href=\"#/module/1\" data-open-tab=\"notes\">Écrire une première note</a></div>") +
      "</div>" +
      '<div class="card recent-panel">' +
      '<div class="panel-head"><div><p class="section-label">Questions</p><h2>À éclaircir</h2></div><a class="text-link" href="#/questions">Tout voir ' +
      UI.icon("arrow-right", 16) +
      "</a></div>" +
      (questions.length
        ? '<div class="recent-list">' +
          questions
            .map(function (question) {
              const module = question.moduleId !== null ? moduleMap.get(question.moduleId) : null;
              return (
                '<a class="recent-item" href="' +
                (module ? "#/module/" + module.id : "#/questions") +
                '"' +
                (module ? ' data-open-tab="questions"' : "") +
                ">" +
                '<span class="recent-icon">' +
                UI.icon(TYPE_ICON[question.type] || "help", 17) +
                "</span>" +
                '<span class="recent-copy"><strong>' +
                UI.escapeHTML(Core.truncate(question.text, 92)) +
                "</strong><small>" +
                TYPE_SHORT[question.type] +
                (module ? " · " + UI.escapeHTML(module.shortTitle) : " · Général") +
                "</small></span>" +
                "</a>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="empty-state compact"><span>' +
          UI.icon("message", 24) +
          "</span><p>Aucune question ouverte. Notez celles qui vous bloquent.</p><a class=\"text-link\" href=\"#/questions\">Poser une question</a></div>") +
      "</div>" +
      "</section>" +
      '<footer class="app-footer"><span>Parcours IA · 12 modules + 3 modules optionnels</span><span>Vos données restent dans ce navigateur.</span></footer>' +
      "</div>"
    );
  };

  /* -------------------------------- Module -------------------------------- */

  function renderWorkspace(app, module) {
    const progress = Core.ensureModuleState(app.state, module);
    const active = app.workspaceTab || "notes";
    const questions = getModuleQuestions(app.state, module.id);
    const tabs = [
      { id: "notes", label: "Notes", count: progress.notes.trim() ? 1 : 0 },
      { id: "exercise", label: "Exercice", count: progress.exercise.trim() ? 1 : 0 },
      { id: "questions", label: "Questions", count: questions.length }
    ];

    return (
      '<section class="card workspace-card" id="workspace" data-workspace>' +
      '<div class="workspace-head">' +
      '<div><p class="section-label">Mon espace de travail</p><h2>Apprendre en écrivant</h2></div>' +
      '<span class="save-status" id="save-status" aria-live="polite">Enregistré automatiquement</span>' +
      "</div>" +
      '<div class="workspace-tabs" role="tablist" aria-label="Espace de travail du module">' +
      tabs
        .map(function (tab) {
          return (
            '<button type="button" class="workspace-tab' +
            (active === tab.id ? " is-active" : "") +
            '" data-workspace-tab="' +
            tab.id +
            '" role="tab" aria-selected="' +
            (active === tab.id ? "true" : "false") +
            '">' +
            tab.label +
            (tab.count ? '<span class="tab-count">' + tab.count + "</span>" : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="workspace-panel" data-workspace-panel="notes"' +
      (active === "notes" ? "" : " hidden") +
      ">" +
      '<label class="sr-only" for="module-notes-' +
      module.id +
      '">Notes du module</label>' +
      '<textarea id="module-notes-' +
      module.id +
      '" class="editor" rows="9" data-note-field="notes" data-module-id="' +
      module.id +
      '" placeholder="Ce que j’ai compris, un exemple à moi, une question qui reste…">' +
      UI.escapeHTML(progress.notes) +
      "</textarea>" +
      '<div class="editor-foot"><span data-char-count="notes">' +
      charLabel(progress.notes) +
      "</span><span>Enregistrement automatique</span></div>" +
      "</div>" +
      '<div class="workspace-panel" data-workspace-panel="exercise"' +
      (active === "exercise" ? "" : " hidden") +
      ">" +
      '<div class="exercise-prompt"><span class="section-label">Consigne</span><p>' +
      UI.escapeHTML(module.exercise) +
      "</p></div>" +
      '<label class="sr-only" for="module-exercise-' +
      module.id +
      '">Résultat de l’exercice</label>' +
      '<textarea id="module-exercise-' +
      module.id +
      '" class="editor" rows="8" data-note-field="exercise" data-module-id="' +
      module.id +
      '" placeholder="Écrivez ici ce que vous avez fait, observé, appris…">' +
      UI.escapeHTML(progress.exercise) +
      "</textarea>" +
      '<div class="editor-foot"><span data-char-count="exercise">' +
      charLabel(progress.exercise) +
      "</span><span>Un espace pour pratiquer, pas seulement lire.</span></div>" +
      "</div>" +
      '<div class="workspace-panel" data-workspace-panel="questions"' +
      (active === "questions" ? "" : " hidden") +
      ">" +
      '<form class="inline-question-form" data-form="module-question" data-module-id="' +
      module.id +
      '">' +
      '<label class="sr-only" for="module-question-' +
      module.id +
      '">Votre question</label>' +
      '<textarea id="module-question-' +
      module.id +
      '" name="text" rows="3" required placeholder="Une question, une confusion, une idée…"></textarea>' +
      '<div class="inline-form-row">' +
      '<select name="type" aria-label="Type d’entrée">' +
      '<option value="question">Question de cours</option>' +
      '<option value="idea">Idée d’amélioration</option>' +
      '<option value="bug">Problème d’usage</option>' +
      "</select>" +
      '<button type="submit" class="btn btn-primary btn-sm">' +
      UI.icon("plus", 16) +
      "Ajouter la question</button>" +
      "</div>" +
      '<input class="input" name="context" placeholder="Contexte (facultatif) : où avez-vous bloqué ?">' +
      "</form>" +
      '<div class="question-list compact" data-module-questions="' +
      module.id +
      '">' +
      (questions.length
        ? questions
            .map(function (question) {
              return renderQuestionCard(app, question, { hideModule: true });
            })
            .join("")
        : '<div class="empty-inline"><span>' +
          UI.icon("message", 22) +
          "</span><p>Aucune question sur ce module pour l’instant. Notez ce qui reste flou : c’est le point de départ de la prochaine leçon.</p></div>") +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  VIEWS.moduleQuestions = function (app, module) {
    const questions = getModuleQuestions(app.state, module.id);
    if (!questions.length) {
      return (
        '<div class="empty-inline"><span>' +
        UI.icon("message", 22) +
        "</span><p>Aucune question sur ce module pour l’instant. Notez ce qui reste flou : c’est le point de départ de la prochaine leçon.</p></div>"
      );
    }
    return questions
      .map(function (question) {
        return renderQuestionCard(app, question, { hideModule: true });
      })
      .join("");
  };

  VIEWS.quizCard = function (app, module) {
    const progress = Core.ensureModuleState(app.state, module);
    const score = Core.quizScore(app.state, module);

    return (
      '<section class="card quiz-card" id="quiz-card" data-quiz-module="' +
      module.id +
      '">' +
      '<div class="quiz-head"><p class="section-label">Quiz éclair</p><span class="quiz-score">' +
      (score.answered ? score.score + "/" + score.total : module.quiz.length + " questions") +
      "</span></div>" +
      '<div class="quiz-list">' +
      module.quiz
        .map(function (question, questionIndex) {
          const entry = progress.quiz[questionIndex];
          const checked = Boolean(entry && entry.checked);
          const selected = entry ? entry.choice : null;
          const correct = checked && selected === question.answer;
          return (
            '<div class="quiz-item' +
            (checked ? (correct ? " is-correct" : " is-wrong") : "") +
            '">' +
            '<p class="quiz-question"><span>' +
            (questionIndex + 1) +
            ".</span> " +
            UI.escapeHTML(question.question) +
            "</p>" +
            '<div class="quiz-options">' +
            question.options
              .map(function (option, optionIndex) {
                let stateClass = "";
                if (selected === optionIndex && !checked) stateClass = " is-selected";
                if (checked && optionIndex === question.answer) stateClass = " is-answer";
                if (checked && selected === optionIndex && optionIndex !== question.answer) stateClass = " is-wrong";
                return (
                  '<button type="button" class="quiz-option' +
                  stateClass +
                  '" data-action="quiz-select" data-question="' +
                  questionIndex +
                  '" data-option="' +
                  optionIndex +
                  '" data-module-id="' +
                  module.id +
                  '"' +
                  (checked ? " disabled" : "") +
                  ' aria-pressed="' +
                  (selected === optionIndex ? "true" : "false") +
                  '">' +
                  '<span class="quiz-radio"></span><span>' +
                  UI.escapeHTML(option) +
                  "</span></button>"
                );
              })
              .join("") +
            "</div>" +
            (!checked
              ? '<button type="button" class="btn btn-ghost btn-sm quiz-check" data-action="quiz-check" data-question="' +
                questionIndex +
                '" data-module-id="' +
                module.id +
                '"' +
                (selected === null ? " disabled" : "") +
                ">Vérifier</button>"
              : '<p class="quiz-feedback ' +
                (correct ? "is-correct" : "is-wrong") +
                '">' +
                (correct
                  ? UI.icon("check-circle", 16) + " Bonne réponse."
                  : UI.icon("close", 16) + " Réponse correcte : " + UI.escapeHTML(question.options[question.answer])) +
                " — " +
                UI.escapeHTML(question.explanation) +
                "</p>") +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      (score.answered
        ? '<button type="button" class="link-btn quiz-reset" data-action="quiz-reset" data-module-id="' +
          module.id +
          '">' +
          UI.icon("refresh", 15) +
          " Réinitialiser le quiz</button>"
        : "") +
      "</section>"
    );
  };

  VIEWS.modulePage = function (app, module) {
    const progress = Core.ensureModuleState(app.state, module);
    const status = moduleStatus(app, module);
    const global = Core.globalStats(app.state, modules);
    const moduleIndex = allModules.findIndex(function (item) {
      return item.id === module.id;
    });
    const previous = moduleIndex > 0 ? allModules[moduleIndex - 1] : null;
    const next = moduleIndex < allModules.length - 1 ? allModules[moduleIndex + 1] : null;
    const moduleResources = getResourcesForModule(module.id);
    const isOptional = Boolean(module.optional);

    return (
      '<div class="page module-page" data-current-module="' +
      module.id +
      '">' +
      '<div class="module-top">' +
      '<div class="module-top-row">' +
      '<span class="module-counter">' +
      (isOptional ? "Module optionnel" : "Module " + module.id + " sur 12") +
      "</span>" +
      '<span class="module-top-meta" data-module-top-meta>' +
      global.completed +
      " module" +
      (global.completed > 1 ? "s" : "") +
      " terminé" +
      (global.completed > 1 ? "s" : "") +
      " · " +
      global.percent +
      " %</span>" +
      "</div>" +
      '<div class="progress-line" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      global.percent +
      '" aria-label="Progression du parcours"><span data-global-progress style="width:' +
      global.percent +
      '%"></span></div>' +
      "</div>" +
      '<header class="module-heading">' +
      '<div class="module-heading-copy">' +
      '<p class="eyebrow">' +
      UI.escapeHTML(module.kicker) +
      ' <span class="dot-sep">·</span> ' +
      UI.escapeHTML(module.duration) +
      "</p>" +
      "<h1>" +
      UI.escapeHTML(module.title) +
      "</h1>" +
      "</div>" +
      '<span class="status-chip ' +
      (status.complete ? "is-complete" : status.started ? "is-started" : "is-new") +
      '" data-module-status>' +
      UI.icon(status.complete ? "check-circle" : status.started ? "target" : "compass", 16) +
      status.label +
      "</span>" +
      "</header>" +
      '<div class="module-layout">' +
      '<div class="module-main">' +
      '<section class="card idea-card">' +
      '<p class="section-label">Idée centrale</p>' +
      '<p class="idea-text">' +
      UI.escapeHTML(module.idea) +
      "</p>" +
      '<div class="card-separator"></div>' +
      '<p class="section-label">À comprendre</p>' +
      '<ul class="concept-list">' +
      module.concepts
        .map(function (concept) {
          return "<li><strong>" + UI.escapeHTML(concept.title) + ".</strong> " + UI.escapeHTML(concept.text) + "</li>";
        })
        .join("") +
      "</ul>" +
      "</section>" +
      '<section class="example-callout">' +
      '<span class="example-icon">' +
      UI.icon("lightbulb", 20) +
      "</span>" +
      "<div><p class=\"section-label\">Exemple concret</p><p>" +
      UI.escapeHTML(module.example) +
      "</p></div>" +
      "</section>" +
      renderWorkspace(app, module) +
      '<section class="card module-resources">' +
      '<div class="panel-head"><div><p class="section-label">Ressources</p><h2>Pour aller plus loin</h2></div><a class="text-link" href="#/ressources">Toutes les ressources ' +
      UI.icon("arrow-right", 16) +
      "</a></div>" +
      '<div class="resource-mini-list">' +
      moduleResources
        .map(function (resource) {
          return (
            '<a class="resource-mini" href="' +
            UI.escapeAttr(resource.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            '<span class="resource-mini-icon">' +
            UI.icon(UI.resourceIcon(resource.type), 18) +
            "</span>" +
            '<span class="resource-mini-copy"><strong>' +
            UI.escapeHTML(resource.title) +
            "</strong><small>" +
            UI.escapeHTML(resource.author) +
            " · " +
            UI.resourceTypeLabel(resource.type) +
            " · " +
            UI.langLabel(resource.lang) +
            "</small></span>" +
            UI.icon("external", 16) +
            "</a>"
          );
        })
        .join("") +
      "</div>" +
      "</section>" +
      "</div>" +
      '<aside class="module-side">' +
      '<section class="card exercise-card' +
      (progress.exerciseDone ? " is-done" : "") +
      '" data-exercise-card>' +
      '<p class="section-label">Exercice</p>' +
      '<p class="exercise-text">' +
      UI.escapeHTML(module.exercise) +
      "</p>" +
      '<button type="button" class="btn ' +
      (progress.exerciseDone ? "btn-done" : "btn-primary") +
      ' btn-block" data-action="toggle-exercise" data-module-id="' +
      module.id +
      '">' +
      (progress.exerciseDone ? UI.icon("check", 17) + " Exercice fait" : "Marquer comme fait") +
      "</button>" +
      "</section>" +
      '<section class="card selfcheck-card' +
      (status.complete ? " is-complete" : "") +
      '" data-selfcheck-card data-module-id="' +
      module.id +
      '">' +
      '<div class="selfcheck-head"><p class="section-label">Auto-vérification</p><span class="selfcheck-count" data-selfcheck-count>' +
      status.checks.checked +
      "/" +
      status.checks.total +
      "</span></div>" +
      '<div class="check-list">' +
      module.selfCheck
        .map(function (text, index) {
          return (
            '<label class="check-row"><input type="checkbox" data-selfcheck data-module-id="' +
            module.id +
            '" data-index="' +
            index +
            '"' +
            (progress.selfChecks[index] ? " checked" : "") +
            '><span class="check-box">' +
            UI.icon("check", 13) +
            "</span><span>" +
            UI.escapeHTML(text) +
            "</span></label>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="selfcheck-foot" data-selfcheck-foot>' +
      (status.complete
        ? UI.icon("check-circle", 16) + " Module terminé. Vous pouvez passer au suivant."
        : status.checks.checked +
          " sur " +
          status.checks.total +
          " vérification" +
          (status.checks.total > 1 ? "s" : "") +
          " cochée" +
          (status.checks.checked > 1 ? "s" : "")) +
      "</p>" +
      "</section>" +
      VIEWS.quizCard(app, module) +
      "</aside>" +
      "</div>" +
      '<nav class="module-pager" aria-label="Navigation entre les modules">' +
      (previous
        ? '<a class="pager-btn pager-prev" href="#/module/' +
          previous.id +
          '"><span class="pager-label">' +
          UI.icon("arrow-left", 16) +
          (previous.optional ? " Option précédente" : " Module précédent") +
          "</span><strong>" +
          UI.escapeHTML(previous.shortTitle) +
          "</strong></a>"
        : '<a class="pager-btn pager-prev" href="#/"><span class="pager-label">' +
          UI.icon("arrow-left", 16) +
          " Tableau de bord</span><strong>Vue d’ensemble</strong></a>") +
      (next
        ? '<a class="pager-btn pager-next" href="#/module/' +
          next.id +
          '"><span class="pager-label">' +
          (next.optional ? "Pour aller plus loin" : "Module suivant") +
          " " +
          UI.icon("arrow-right", 16) +
          "</span><strong>" +
          UI.escapeHTML(next.shortTitle) +
          "</strong></a>"
        : '<a class="pager-btn pager-next" href="#/"><span class="pager-label">Fin du parcours ' +
          UI.icon("arrow-right", 16) +
          "</span><strong>Vue d’ensemble</strong></a>") +
      "</nav>" +
      "</div>"
    );
  };

  /* ------------------------------- Questions ------------------------------- */

  function renderQuestionCard(app, question, options) {
    const settings = options || {};
    const module = question.moduleId !== null ? moduleMap.get(question.moduleId) : null;
    const editing = app.editingQuestionId === question.id;
    const answered = question.status === "answered";

    return (
      '<article class="question-card' +
      (answered ? " is-answered" : "") +
      '" data-question-id="' +
      UI.escapeAttr(question.id) +
      '">' +
      '<div class="question-meta">' +
      '<span class="type-badge type-' +
      question.type +
      '">' +
      UI.icon(TYPE_ICON[question.type] || "help", 14) +
      TYPE_SHORT[question.type] +
      "</span>" +
      (!settings.hideModule && module
        ? '<span class="module-chip">' + UI.moduleBadge(module) + " · " + UI.escapeHTML(module.shortTitle) + "</span>"
        : !settings.hideModule
          ? '<span class="module-chip">Général</span>'
          : "") +
      '<span class="question-date">' +
      Core.formatShortDate(question.createdAt) +
      "</span>" +
      '<span class="status-badge ' +
      (answered ? "is-answered" : "is-open") +
      '">' +
      (answered ? "Répondue" : "Ouverte") +
      "</span>" +
      "</div>" +
      '<p class="question-text">' +
      UI.nl2br(question.text) +
      "</p>" +
      (question.context
        ? '<p class="question-context"><span>Contexte</span> ' + UI.nl2br(question.context) + "</p>"
        : "") +
      (question.answer
        ? '<div class="answer-box"><p class="answer-label">' +
          UI.icon("check-circle", 15) +
          " Réponse</p><p>" +
          UI.nl2br(question.answer) +
          "</p></div>"
        : "") +
      '<div class="question-actions">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="edit-answer" data-question-id="' +
      UI.escapeAttr(question.id) +
      '">' +
      UI.icon("note", 15) +
      (question.answer ? " Modifier la réponse" : " Répondre") +
      "</button>" +
      (answered
        ? '<button type="button" class="link-btn" data-action="reopen-question" data-question-id="' +
          UI.escapeAttr(question.id) +
          '">Rouvrir</button>'
        : "") +
      '<button type="button" class="icon-btn danger" data-action="delete-question" data-question-id="' +
      UI.escapeAttr(question.id) +
      '" aria-label="Supprimer cette question" title="Supprimer">' +
      UI.icon("trash", 16) +
      "</button>" +
      "</div>" +
      (editing
        ? '<form class="answer-form" data-form="answer" data-question-id="' +
          UI.escapeAttr(question.id) +
          '"><label>Réponse ou piste de réponse<textarea name="answer" rows="4" placeholder="Votre réponse, ou la réponse à ajouter à l’application…">' +
          UI.escapeHTML(question.answer) +
          "</textarea></label>" +
          '<div class="form-actions"><button type="submit" class="btn btn-primary btn-sm">Enregistrer</button><button type="button" class="btn btn-ghost btn-sm" data-action="cancel-answer">Annuler</button></div></form>'
        : "") +
      "</article>"
    );
  }

  VIEWS.questionCard = renderQuestionCard;

  VIEWS.getModuleQuestions = function (app, moduleId) {
    return getModuleQuestions(app.state, moduleId);
  };

  VIEWS.getResourcesForModule = getResourcesForModule;
  VIEWS.moduleStatus = moduleStatus;
})();
