/*
 * Vues secondaires : ressources, notes, questions et fenêtre de sauvegarde.
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

  const VIEWS = (window.IAViews = window.IAViews || {});

  const TYPE_SHORT = {
    question: "Question",
    idea: "Idée",
    bug: "Problème"
  };

  /* ------------------------------- Ressources ------------------------------- */

  function filteredResources(app) {
    const filters = app.filters.resources;
    const search = filters.search.trim().toLowerCase();

    return resources
      .filter(function (resource) {
        if (filters.lang !== "all" && resource.lang !== filters.lang) return false;
        if (filters.type !== "all" && resource.type !== filters.type) return false;
        if (filters.module !== "all" && resource.moduleIds.indexOf(Number(filters.module)) === -1) return false;
        if (filters.hideSeen && app.state.resourcesSeen[resource.id]) return false;
        if (!search) return true;
        const moduleTitles = resource.moduleIds
          .map(function (id) {
            const module = moduleMap.get(id);
            return module ? module.title + " " + module.shortTitle : "";
          })
          .join(" ");
        const haystack = [resource.title, resource.author, resource.description, moduleTitles]
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(search) !== -1;
      })
      .sort(function (a, b) {
        const moduleA = a.moduleIds[0] || 999;
        const moduleB = b.moduleIds[0] || 999;
        if (moduleA !== moduleB) return moduleA - moduleB;
        return a.title.localeCompare(b.title, "fr");
      });
  }

  function resourceCard(app, resource) {
    const seen = Boolean(app.state.resourcesSeen[resource.id]);
    return (
      '<article class="resource-card' +
      (seen ? " is-seen" : "") +
      '" data-resource-card="' +
      UI.escapeAttr(resource.id) +
      '">' +
      '<div class="resource-top">' +
      '<span class="resource-icon">' +
      UI.icon(UI.resourceIcon(resource.type), 19) +
      "</span>" +
      '<span class="resource-tags"><span class="tag tag-lang">' +
      UI.langLabel(resource.lang) +
      '</span><span class="tag">' +
      UI.resourceTypeLabel(resource.type) +
      "</span>" +
      (resource.price === "freemium" ? '<span class="tag tag-price">Freemium</span>' : "") +
      "</span>" +
      '<label class="seen-check"><input type="checkbox" data-resource-seen data-resource-id="' +
      UI.escapeAttr(resource.id) +
      '"' +
      (seen ? " checked" : "") +
      '><span class="seen-box">' +
      UI.icon("check", 12) +
      '</span><span class="seen-label">Consultée</span></label>' +
      "</div>" +
      '<h3 class="resource-title"><a href="' +
      UI.escapeAttr(resource.url) +
      '" target="_blank" rel="noopener noreferrer">' +
      UI.escapeHTML(resource.title) +
      UI.icon("external", 15) +
      "</a></h3>" +
      '<p class="resource-author">' +
      UI.escapeHTML(resource.author) +
      (resource.duration ? " · " + UI.escapeHTML(resource.duration) : "") +
      "</p>" +
      '<p class="resource-description">' +
      UI.escapeHTML(resource.description) +
      "</p>" +
      '<div class="resource-modules">' +
      resource.moduleIds
        .map(function (id) {
          const module = moduleMap.get(id);
          if (!module) return "";
          return (
            '<span class="module-chip small" title="' +
            UI.escapeAttr(module.title) +
            '">' +
            (module.optional ? "Option " + (module.id - 100) : "Module " + module.id) +
            "</span>"
          );
        })
        .join("") +
      "</div>" +
      "</article>"
    );
  }

  VIEWS.resourcesResults = function (app) {
    const list = filteredResources(app);
    if (!list.length) {
      return (
        '<div class="empty-state"><span>' +
        UI.icon("search", 28) +
        "</span><h3>Aucune ressource ne correspond</h3><p>Essayez un autre mot-clé ou retirez un filtre.</p></div>"
      );
    }
    return '<div class="resource-grid">' + list.map(function (resource) {
      return resourceCard(app, resource);
    }).join("") + "</div>";
  };

  VIEWS.resourcesCount = function (app) {
    return UI.plural(filteredResources(app).length, "ressource affichée", "ressources affichées");
  };

  VIEWS.resourcesPage = function (app) {
    const filters = app.filters.resources;
    const seen = Core.resourcesSeenCount(app.state, resources);
    const frCount = resources.filter(function (resource) {
      return resource.lang === "fr";
    }).length;
    const freeCount = resources.filter(function (resource) {
      return resource.price === "free";
    }).length;

    return (
      '<div class="page resources-page">' +
      '<div class="page-head">' +
      '<div><p class="eyebrow">La bibliothèque</p><h1>Ressources</h1><p class="page-lead">Une sélection vérifiée pour approfondir chaque module. Les liens s’ouvrent dans un nouvel onglet.</p></div>' +
      '<div class="page-badge">' +
      UI.icon("shield", 16) +
      " Sélection vérifiée le 3 novembre 2026" +
      "</div>" +
      "</div>" +
      '<div class="mini-stats">' +
      '<span class="mini-stat">' +
      UI.icon("book", 16) +
      "<strong>" +
      resources.length +
      "</strong> " +
      UI.pluralWord(resources.length, "ressource", "ressources") +
      "</span>" +
      '<span class="mini-stat" id="resources-seen-stat">' +
      UI.icon("check-circle", 16) +
      "<strong>" +
      seen +
      "</strong> " +
      UI.pluralWord(seen, "consultée", "consultées") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("compass", 16) +
      "<strong>" +
      frCount +
      "</strong> en français</span>" +
      '<span class="mini-stat">' +
      UI.icon("spark", 16) +
      "<strong>" +
      freeCount +
      "</strong> " +
      UI.pluralWord(freeCount, "gratuite", "gratuites") +
      "</span>" +
      "</div>" +
      '<section class="card filter-card">' +
      '<div class="search-field">' +
      UI.icon("search", 18) +
      '<label class="sr-only" for="resource-search">Rechercher une ressource</label>' +
      '<input id="resource-search" type="search" data-search="resources" value="' +
      UI.escapeAttr(filters.search) +
      '" placeholder="Rechercher un titre, un auteur, un sujet…">' +
      "</div>" +
      '<div class="filter-row">' +
      '<label class="field"><span>Module</span><select data-resource-filter="module">' +
      '<option value="all">Tous les modules</option>' +
      modules
        .map(function (module) {
          return '<option value="' + module.id + '"' + (filters.module === String(module.id) ? " selected" : "") + ">Module " + module.id + " · " + UI.escapeHTML(module.shortTitle) + "</option>";
        })
        .join("") +
      optionalModules
        .map(function (module) {
          return '<option value="' + module.id + '"' + (filters.module === String(module.id) ? " selected" : "") + ">Option " + (module.id - 100) + " · " + UI.escapeHTML(module.shortTitle) + "</option>";
        })
        .join("") +
      "</select></label>" +
      '<label class="field"><span>Langue</span><select data-resource-filter="lang"><option value="all">Toutes</option><option value="fr"' +
      (filters.lang === "fr" ? " selected" : "") +
      ">Français</option><option value=\"en\"" +
      (filters.lang === "en" ? " selected" : "") +
      ">Anglais</option></select></label>" +
      '<label class="field"><span>Format</span><select data-resource-filter="type"><option value="all">Tous</option>' +
      ["video", "article", "course", "doc", "tool", "pdf"]
        .map(function (type) {
          return '<option value="' + type + '"' + (filters.type === type ? " selected" : "") + ">" + UI.resourceTypeLabel(type) + "</option>";
        })
        .join("") +
      "</select></label>" +
      '<label class="check-inline"><input type="checkbox" data-resource-filter="hideSeen"' +
      (filters.hideSeen ? " checked" : "") +
      '><span class="check-box">' +
      UI.icon("check", 13) +
      "</span><span>Masquer les ressources consultées</span></label>" +
      "</div>" +
      "</section>" +
      '<div class="results-meta"><span id="resources-result-count">' +
      VIEWS.resourcesCount(app) +
      '</span><span class="results-hint">Astuce : cochez « Consultée » pour suivre votre exploration.</span></div>' +
      '<div id="resources-results">' +
      VIEWS.resourcesResults(app) +
      "</div>" +
      '<footer class="app-footer"><span>Les noms de produits changent vite : retenez les concepts et les critères.</span><span>Ressources du parcours fourni.</span></footer>' +
      "</div>"
    );
  };

  /* --------------------------------- Notes --------------------------------- */

  function noteItems(app) {
    const search = app.filters.notes.search.trim().toLowerCase();
    return allModules
      .map(function (module) {
        return {
          module: module,
          progress: Core.ensureModuleState(app.state, module)
        };
      })
      .filter(function (item) {
        const notes = item.progress.notes;
        const exercise = item.progress.exercise;
        if (!notes.trim() && !exercise.trim()) return false;
        if (!search) return true;
        return (
          item.module.title.toLowerCase().indexOf(search) !== -1 ||
          item.module.shortTitle.toLowerCase().indexOf(search) !== -1 ||
          notes.toLowerCase().indexOf(search) !== -1 ||
          exercise.toLowerCase().indexOf(search) !== -1
        );
      })
      .sort(function (a, b) {
        return new Date(b.progress.updatedAt) - new Date(a.progress.updatedAt);
      });
  }

  function noteCard(app, item) {
    const module = item.module;
    const progress = item.progress;
    return (
      '<article class="note-card">' +
      '<div class="note-card-head">' +
      '<div class="note-title"><span class="note-badge">' +
      UI.moduleBadge(module) +
      '</span><div><p class="eyebrow">' +
      (module.optional ? "Module optionnel" : "Module " + module.id) +
      " · " +
      UI.escapeHTML(module.kicker) +
      "</p><h3>" +
      UI.escapeHTML(module.title) +
      "</h3></div></div>" +
      '<span class="note-date">' +
      Core.formatShortDate(progress.updatedAt) +
      "</span>" +
      "</div>" +
      '<div class="note-content">' +
      (progress.notes.trim()
        ? '<div class="note-block"><p class="note-label">Notes</p><p class="note-preview">' +
          UI.escapeHTML(Core.truncate(progress.notes, 420)) +
          "</p></div>"
        : "") +
      (progress.exercise.trim()
        ? '<div class="note-block"><p class="note-label">Exercice</p><p class="note-preview">' +
          UI.escapeHTML(Core.truncate(progress.exercise, 280)) +
          "</p></div>"
        : "") +
      "</div>" +
      '<div class="note-actions">' +
      '<a class="btn btn-ghost btn-sm" href="#/module/' +
      module.id +
      '" data-open-tab="notes">' +
      UI.icon("note", 15) +
      (progress.notes.trim() ? " Ouvrir les notes" : " Écrire une note") +
      "</a>" +
      (progress.exercise.trim()
        ? '<a class="link-btn" href="#/module/' + module.id + '" data-open-tab="exercise">Voir l’exercice</a>'
        : "") +
      "</div>" +
      "</article>"
    );
  }

  function emptyModules(app) {
    const search = app.filters.notes.search.trim().toLowerCase();
    if (search) return "";
    const empty = allModules.filter(function (module) {
      const progress = Core.ensureModuleState(app.state, module);
      return !progress.notes.trim() && !progress.exercise.trim();
    });
    if (!empty.length) return "";
    return (
      '<section class="empty-modules">' +
      '<p class="section-label">À compléter</p>' +
      '<p class="empty-modules-lead">Ces modules n’ont pas encore de notes. Un mot suffit pour commencer.</p>' +
      '<div class="empty-module-chips">' +
      empty
        .map(function (module) {
          return (
            '<a class="module-chip link-chip" href="#/module/' +
            module.id +
            '" data-open-tab="notes">' +
            UI.moduleBadge(module) +
            " · " +
            UI.escapeHTML(module.shortTitle) +
            "</a>"
          );
        })
        .join("") +
      "</div>" +
      "</section>"
    );
  }

  VIEWS.notesResults = function (app) {
    const items = noteItems(app);
    if (!items.length) {
      const search = app.filters.notes.search.trim();
      return (
        '<div class="empty-state"><span>' +
        UI.icon(search ? "search" : "note", 28) +
        "</span><h3>" +
        (search ? "Aucune note ne correspond" : "Votre carnet est encore vide") +
        "</h3><p>" +
        (search
          ? "Essayez un autre mot-clé."
          : "Ouvrez un module et écrivez ce que vous avez compris, vos exemples ou ce qui reste flou.") +
        "</p>" +
        (search
          ? ""
          : '<a class="btn btn-primary btn-sm" href="#/module/1" data-open-tab="notes">Commencer le module 1</a>') +
        "</div>"
      );
    }
    return '<div class="note-grid">' + items.map(function (item) {
      return noteCard(app, item);
    }).join("") + "</div>";
  };

  VIEWS.notesEmptyModules = function (app) {
    return emptyModules(app);
  };

  VIEWS.notesPage = function (app) {
    const notes = Core.notesStats(app.state, allModules);
    const search = app.filters.notes.search;
    return (
      '<div class="page notes-page">' +
      '<div class="page-head">' +
      '<div><p class="eyebrow">Votre carnet</p><h1>Notes & exercices</h1><p class="page-lead">Une page par module, comme le recommande le parcours. Tout est enregistré automatiquement dans ce navigateur.</p></div>' +
      '<button type="button" class="btn btn-secondary" data-action="export-notes">' +
      UI.icon("download", 17) +
      " Exporter mes notes" +
      "</button>" +
      "</div>" +
      '<div class="mini-stats">' +
      '<span class="mini-stat">' +
      UI.icon("note", 16) +
      "<strong>" +
      notes.modulesWithNotes +
      "</strong> " +
      UI.pluralWord(notes.modulesWithNotes, "module annoté", "modules annotés") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("target", 16) +
      "<strong>" +
      notes.modulesWithExercise +
      "</strong> " +
      UI.pluralWord(notes.modulesWithExercise, "exercice rédigé", "exercices rédigés") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("file", 16) +
      "<strong>" +
      notes.notesCharacters.toLocaleString("fr-FR") +
      "</strong> caractères de notes</span>" +
      (notes.lastUpdated
        ? '<span class="mini-stat">' +
          UI.icon("clock", 16) +
          "Dernière note le <strong>" +
          Core.formatShortDate(notes.lastUpdated) +
          "</strong></span>"
        : "") +
      "</div>" +
      '<section class="card filter-card compact-filter">' +
      '<div class="search-field">' +
      UI.icon("search", 18) +
      '<label class="sr-only" for="notes-search">Rechercher dans les notes</label>' +
      '<input id="notes-search" type="search" data-search="notes" value="' +
      UI.escapeAttr(search) +
      '" placeholder="Rechercher dans vos notes et exercices…">' +
      "</div>" +
      "</section>" +
      '<div id="notes-results">' +
      VIEWS.notesResults(app) +
      "</div>" +
      '<div id="notes-empty-modules">' +
      VIEWS.notesEmptyModules(app) +
      "</div>" +
      '<footer class="app-footer"><span>Vos notes restent sur cet appareil.</span><span>Exportez-les pour les sauvegarder.</span></footer>' +
      "</div>"
    );
  };

  /* ------------------------------- Questions ------------------------------- */

  function filteredQuestions(app) {
    const filters = app.filters.questions;
    const search = filters.search.trim().toLowerCase();
    return app.state.questions
      .filter(function (question) {
        if (filters.status !== "all" && question.status !== filters.status) return false;
        if (filters.type !== "all" && question.type !== filters.type) return false;
        if (filters.module === "general" && question.moduleId !== null) return false;
        if (filters.module !== "all" && filters.module !== "general" && question.moduleId !== Number(filters.module)) return false;
        if (!search) return true;
        const module = question.moduleId !== null ? moduleMap.get(question.moduleId) : null;
        return [question.text, question.context, question.answer, module ? module.title : ""]
          .join(" ")
          .toLowerCase()
          .indexOf(search) !== -1;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  VIEWS.questionsResults = function (app) {
    const list = filteredQuestions(app);
    if (!list.length) {
      const hasQuestions = app.state.questions.length > 0;
      return (
        '<div class="empty-state"><span>' +
        UI.icon(hasQuestions ? "search" : "message", 28) +
        "</span><h3>" +
        (hasQuestions ? "Aucune question ne correspond" : "Aucune question pour le moment") +
        "</h3><p>" +
        (hasQuestions
          ? "Essayez un autre filtre ou un autre mot-clé."
          : "Notez ici les notions floues, les questions à poser ou les idées pour améliorer le parcours.") +
        "</p></div>"
      );
    }
    return '<div class="question-list">' + list.map(function (question) {
      return VIEWS.questionCard(app, question);
    }).join("") + "</div>";
  };

  VIEWS.questionsCount = function (app) {
    return UI.plural(filteredQuestions(app).length, "question affichée", "questions affichées");
  };

  VIEWS.questionsPage = function (app) {
    const stats = Core.questionsStats(app.state);
    const filters = app.filters.questions;
    return (
      '<div class="page questions-page">' +
      '<div class="page-head">' +
      '<div><p class="eyebrow">Votre carnet</p><h1>Questions & idées</h1><p class="page-lead">Notez ce qui vous bloque ou ce qui pourrait améliorer l’application. Ces questions sont la matière première des prochaines leçons.</p></div>' +
      '<button type="button" class="btn btn-secondary" data-action="export-brief">' +
      UI.icon("download", 17) +
      " Exporter le brief" +
      "</button>" +
      "</div>" +
      '<section class="author-card">' +
      '<div class="author-main"><span class="author-icon">' +
      UI.icon("spark", 22) +
      '</span><div><p class="section-label">Pour faire évoluer le parcours</p><h2>Transformez vos questions en leçons</h2><p>Le brief rassemble vos questions sans réponse, vos idées et vos notes. Copiez-le ou exportez-le pour préparer la prochaine version de l’application avec des réponses et des leçons associées.</p></div></div>' +
      '<div class="author-actions"><button type="button" class="btn btn-primary" data-action="copy-brief">' +
      UI.icon("copy", 16) +
      ' Copier le brief</button><button type="button" class="btn btn-secondary" data-action="export-brief">' +
      UI.icon("download", 16) +
      " Exporter en .md</button></div>" +
      "</section>" +
      '<div class="mini-stats">' +
      '<span class="mini-stat">' +
      UI.icon("message", 16) +
      "<strong>" +
      stats.total +
      "</strong> " +
      UI.pluralWord(stats.total, "entrée", "entrées") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("help", 16) +
      "<strong>" +
      stats.open +
      "</strong> " +
      UI.pluralWord(stats.open, "ouverte", "ouvertes") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("check-circle", 16) +
      "<strong>" +
      stats.answered +
      "</strong> " +
      UI.pluralWord(stats.answered, "répondue", "répondues") +
      "</span>" +
      '<span class="mini-stat">' +
      UI.icon("lightbulb", 16) +
      "<strong>" +
      (stats.idea + stats.bug) +
      "</strong> " +
      UI.pluralWord(stats.idea + stats.bug, "idée ou problème", "idées ou problèmes") +
      "</span>" +
      "</div>" +
      '<section class="card new-question-card">' +
      '<div class="panel-head"><div><p class="section-label">Nouvelle entrée</p><h2>Poser une question</h2></div></div>' +
      '<form data-form="new-question" class="question-form">' +
      '<div class="form-row">' +
      '<label class="field"><span>Module concerné</span><select name="moduleId"><option value="general">Général / plusieurs modules</option>' +
      modules
        .map(function (module) {
          return '<option value="' + module.id + '">Module ' + module.id + " · " + UI.escapeHTML(module.shortTitle) + "</option>";
        })
        .join("") +
      optionalModules
        .map(function (module) {
          return '<option value="' + module.id + '">Option ' + (module.id - 100) + " · " + UI.escapeHTML(module.shortTitle) + "</option>";
        })
        .join("") +
      "</select></label>" +
      '<label class="field"><span>Type</span><select name="type"><option value="question">Question de cours</option><option value="idea">Idée d’amélioration</option><option value="bug">Problème d’usage</option></select></label>' +
      "</div>" +
      '<label class="field"><span>Votre question</span><textarea name="text" rows="3" required placeholder="Exemple : pourquoi le RAG ne suffit-il pas à garantir une réponse fiable ?"></textarea></label>' +
      '<label class="field"><span>Contexte (facultatif)</span><input class="input" name="context" placeholder="Où avez-vous bloqué ? Que cherchiez-vous à faire ?"></label>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">' +
      UI.icon("plus", 17) +
      " Ajouter la question</button><span class=\"form-hint\">Elle sera enregistrée localement et pourra être exportée.</span></div>" +
      "</form>" +
      "</section>" +
      '<section class="card filter-card">' +
      '<div class="search-field">' +
      UI.icon("search", 18) +
      '<label class="sr-only" for="questions-search">Rechercher dans les questions</label>' +
      '<input id="questions-search" type="search" data-search="questions" value="' +
      UI.escapeAttr(filters.search) +
      '" placeholder="Rechercher une question, un contexte, une réponse…">' +
      "</div>" +
      '<div class="filter-row">' +
      '<label class="field"><span>Module</span><select data-question-filter="module"><option value="all">Tous</option><option value="general"' +
      (filters.module === "general" ? " selected" : "") +
      ">Général</option>" +
      modules
        .map(function (module) {
          return '<option value="' + module.id + '"' + (filters.module === String(module.id) ? " selected" : "") + ">Module " + module.id + "</option>";
        })
        .join("") +
      optionalModules
        .map(function (module) {
          return '<option value="' + module.id + '"' + (filters.module === String(module.id) ? " selected" : "") + ">Option " + (module.id - 100) + "</option>";
        })
        .join("") +
      "</select></label>" +
      '<label class="field"><span>Type</span><select data-question-filter="type"><option value="all">Tous</option><option value="question"' +
      (filters.type === "question" ? " selected" : "") +
      ">Questions</option><option value=\"idea\"" +
      (filters.type === "idea" ? " selected" : "") +
      ">Idées</option><option value=\"bug\"" +
      (filters.type === "bug" ? " selected" : "") +
      ">Problèmes</option></select></label>" +
      '<label class="field"><span>Statut</span><select data-question-filter="status"><option value="all">Tous</option><option value="open"' +
      (filters.status === "open" ? " selected" : "") +
      ">Ouvertes</option><option value=\"answered\"" +
      (filters.status === "answered" ? " selected" : "") +
      ">Répondues</option></select></label>" +
      "</div>" +
      "</section>" +
      '<div class="results-meta"><span id="questions-result-count">' +
      VIEWS.questionsCount(app) +
      '</span><span class="results-hint">Répondez directement dans chaque carte.</span></div>' +
      '<div id="questions-results">' +
      VIEWS.questionsResults(app) +
      "</div>" +
      '<footer class="app-footer"><span>Vos questions restent dans ce navigateur.</span><span>Exportez le brief pour les transformer en leçons.</span></footer>' +
      "</div>"
    );
  };

  /* ------------------------------ Données --------------------------------- */

  VIEWS.dataModal = function (app) {
    const stats = Core.questionsStats(app.state);
    const notes = Core.notesStats(app.state, allModules);
    const size = window.IAStore.usageBytes(app.state);
    const sizeLabel = size > 1024 ? (size / 1024).toFixed(1) + " Ko" : size + " o";
    const available = window.IAStore.isAvailable();

    return (
      '<div class="modal-head"><div><p class="section-label">Vos données</p><h2>Données & sauvegarde</h2></div><button type="button" class="icon-btn" data-ui-close aria-label="Fermer">' +
      UI.icon("close", 20) +
      "</button></div>" +
      '<p class="modal-lead">Tout est stocké dans le <code>localStorage</code> de ce navigateur : aucun compte, aucun serveur. Exportez régulièrement pour conserver une copie et pour transmettre vos questions.</p>' +
      (available
        ? ""
        : '<div class="warning-box">' +
          UI.icon("lock", 18) +
          " Le stockage local est indisponible dans ce navigateur. Vos données seront perdues à la fermeture : exportez-les maintenant.</div>") +
      '<div class="storage-summary">' +
      '<div><strong>' +
      notes.modulesWithNotes +
      "</strong><span>" +
      UI.pluralWord(notes.modulesWithNotes, "module annoté", "modules annotés") +
      "</span></div>" +
      '<div><strong>' +
      stats.total +
      "</strong><span>" +
      UI.pluralWord(stats.total, "question", "questions") +
      "</span></div>" +
      '<div><strong>' +
      Core.resourcesSeenCount(app.state, resources) +
      "</strong><span>" +
      UI.pluralWord(Core.resourcesSeenCount(app.state, resources), "ressource vue", "ressources vues") +
      "</span></div>" +
      '<div><strong>' +
      sizeLabel +
      "</strong><span>de stockage</span></div>" +
      "</div>" +
      '<div class="data-actions">' +
      '<button type="button" class="data-action" data-action="export-json"><span class="data-action-icon">' +
      UI.icon("download", 19) +
      '</span><span><strong>Exporter la sauvegarde</strong><small>Fichier .json complet, à réimporter plus tard</small></span></button>' +
      '<button type="button" class="data-action" data-action="export-report"><span class="data-action-icon">' +
      UI.icon("chart", 19) +
      '</span><span><strong>Rapport d’apprentissage</strong><small>Progression, notes et questions en .md</small></span></button>' +
      '<button type="button" class="data-action" data-action="export-brief"><span class="data-action-icon">' +
      UI.icon("spark", 19) +
      '</span><span><strong>Brief auteur</strong><small>Questions à transformer en leçons</small></span></button>' +
      '<button type="button" class="data-action" data-action="import-json"><span class="data-action-icon">' +
      UI.icon("upload", 19) +
      '</span><span><strong>Importer une sauvegarde</strong><small>Remplace les données actuelles</small></span></button>' +
      "</div>" +
      '<div class="data-note">' +
      "<h3>Comment retrouver mes questions ensuite ?</h3>" +
      "<p>Utilisez <strong>Copier le brief</strong> dans <em>Questions & idées</em>, ou exportez le fichier <code>.md</code>. Vous pourrez le transmettre pour ajouter les réponses et les leçons au parcours. La sauvegarde <code>.json</code> permet aussi de restaurer vos données sur un autre navigateur.</p>" +
      "</div>" +
      '<div class="modal-foot"><span>Dernière sauvegarde : ' +
      Core.formatDate(app.state.updatedAt, true) +
      "</span>" +
      '<button type="button" class="link-danger" data-action="reset-data">' +
      UI.icon("trash", 15) +
      " Réinitialiser toutes les données</button></div>" +
      '<input id="import-file" type="file" accept=".json,application/json" hidden>'
    );
  };

  VIEWS.allModules = allModules;
  VIEWS.modules = modules;
  VIEWS.optionalModules = optionalModules;
  VIEWS.resources = resources;
  VIEWS.moduleMap = moduleMap;
})();
