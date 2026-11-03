/*
 * Parcours IA — contrôleur de l’application.
 * Routage par hash, barre latérale, persistance, actions et initialisation.
 */
(function () {
  "use strict";

  const Core = window.IACore;
  const Store = window.IAStore;
  const UI = window.IAUI;
  const Views = window.IAViews;
  const data = window.IA_DATA;
  const modules = data.modules;
  const optionalModules = data.optionalModules || [];
  const allModules = modules.concat(optionalModules);
  const resources = data.resources;
  const moduleMap = new Map(allModules.map(function (module) {
    return [module.id, module];
  }));

  const app = {
    state: Store.load(allModules, resources),
    route: { name: "dashboard" },
    lastRenderedModule: null,
    requestedTab: null,
    workspaceTab: "notes",
    filters: {
      resources: { search: "", module: "all", lang: "all", type: "all", hideSeen: false },
      notes: { search: "" },
      questions: { search: "", module: "all", type: "all", status: "all" }
    },
    editingQuestionId: null,
    focusQuestionId: null,
    pendingScroll: null,
    saveTimer: null,
    storageWarned: false
  };

  function charCount(text) {
    const count = text ? text.length : 0;
    return count + " caractère" + (count > 1 ? "s" : "");
  }

  function persist() {
    const ok = Store.save(app.state);
    if (!ok && !app.storageWarned) {
      app.storageWarned = true;
      UI.showToast("Le stockage local est indisponible. Exportez vos données avant de fermer.", "error");
    }
    return ok;
  }

  function setSaveStatus(text, saving) {
    const element = document.getElementById("save-status");
    if (!element) return;
    element.textContent = text;
    element.classList.toggle("is-saving", Boolean(saving));
  }

  function scheduleSave() {
    setSaveStatus("Enregistrement…", true);
    window.clearTimeout(app.saveTimer);
    app.saveTimer = window.setTimeout(function () {
      app.saveTimer = null;
      const ok = persist();
      if (ok) {
        const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        setSaveStatus("Enregistré à " + time, false);
      } else {
        setSaveStatus("Stockage local indisponible", false);
      }
    }, 450);
  }

  function flushSave() {
    if (!app.saveTimer) return;
    window.clearTimeout(app.saveTimer);
    app.saveTimer = null;
    if (persist()) {
      const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      setSaveStatus("Enregistré à " + time, false);
    }
  }

  /* ------------------------------- Sidebar -------------------------------- */

  function moduleNavItem(module) {
    const checks = Core.moduleCheckProgress(app.state, module);
    const complete = checks.total > 0 && checks.checked === checks.total;
    const progress = Core.ensureModuleState(app.state, module);
    const started =
      checks.checked > 0 ||
      Boolean(progress.notes.trim()) ||
      Boolean(progress.exercise.trim()) ||
      progress.exerciseDone;
    const active = app.route.name === "module" && app.route.id === module.id;

    return (
      '<li><a class="module-link' +
      (active ? " is-active" : "") +
      (complete ? " is-complete" : "") +
      (started && !complete ? " is-started" : "") +
      '" href="#/module/' +
      module.id +
      '"' +
      (active ? ' aria-current="page"' : "") +
      ">" +
      '<span class="module-num">' +
      (complete ? UI.icon("check", 15) : UI.moduleBadge(module)) +
      "</span>" +
      '<span class="module-name">' +
      UI.escapeHTML(module.shortTitle) +
      "</span>" +
      "</a></li>"
    );
  }

  function renderSidebar() {
    const stats = Core.globalStats(app.state, modules);
    const optionalStats = Core.globalStats(app.state, optionalModules);
    const activeNav =
      app.route.name === "dashboard" ||
      app.route.name === "resources" ||
      app.route.name === "notes" ||
      app.route.name === "questions"
        ? app.route.name
        : "";

    const quickNav = document.getElementById("quick-nav");
    if (quickNav) {
      quickNav.innerHTML =
        '<a class="quick-link' +
        (activeNav === "dashboard" ? " is-active" : "") +
        '" href="#/" data-nav="dashboard">' +
        UI.icon("grid", 17) +
        "<span>Vue d’ensemble</span></a>" +
        '<a class="quick-link' +
        (activeNav === "resources" ? " is-active" : "") +
        '" href="#/ressources" data-nav="resources">' +
        UI.icon("book", 17) +
        "<span>Ressources</span></a>" +
        '<a class="quick-link' +
        (activeNav === "notes" ? " is-active" : "") +
        '" href="#/notes" data-nav="notes">' +
        UI.icon("note", 17) +
        "<span>Mes notes</span></a>" +
        '<a class="quick-link' +
        (activeNav === "questions" ? " is-active" : "") +
        '" href="#/questions" data-nav="questions">' +
        UI.icon("message", 17) +
        "<span>Mes questions</span></a>";
    }

    const moduleList = document.getElementById("sidebar-modules");
    if (moduleList) {
      moduleList.innerHTML =
        '<div class="sidebar-label"><span>Le parcours</span><span class="sidebar-count">' +
        stats.completed +
        "/" +
        stats.total +
        '</span></div><ol class="module-nav" aria-label="Les 12 modules du parcours">' +
        modules.map(moduleNavItem).join("") +
        "</ol>";
    }

    const optionalList = document.getElementById("sidebar-optional");
    if (optionalList) {
      optionalList.innerHTML =
        '<div class="sidebar-label"><span>Pour aller plus loin</span><span class="sidebar-count">' +
        optionalStats.completed +
        "/" +
        optionalStats.total +
        '</span></div><ol class="module-nav module-nav-optional" aria-label="Modules optionnels">' +
        optionalModules.map(moduleNavItem).join("") +
        "</ol>";
    }

    const footer = document.getElementById("sidebar-progress");
    if (footer) {
      footer.innerHTML =
        '<div class="sidebar-progress-head"><span>Progression</span><strong>' +
        stats.percent +
        '%</strong></div><div class="sidebar-progress-track"><span style="width:' +
        stats.percent +
        '%"></span></div><p class="sidebar-progress-text">' +
        stats.completed +
        " module" +
        (stats.completed > 1 ? "s" : "") +
        " terminé" +
        (stats.completed > 1 ? "s" : "") +
        " sur " +
        stats.total +
        '</p><button type="button" class="sidebar-data" data-action="open-data">' +
        UI.icon("database", 16) +
        " Données & sauvegarde</button>";
    }
  }

  /* -------------------------------- Routage -------------------------------- */

  function parseRoute() {
    const raw = (window.location.hash || "#/").replace(/^#\/?/, "");
    const path = raw.split("?")[0];
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return { name: "dashboard" };
    if (parts[0] === "module" && parts[1]) {
      const id = Number(parts[1]);
      if (moduleMap.has(id)) return { name: "module", id: id };
      return { name: "dashboard" };
    }
    if (parts[0] === "ressources") return { name: "resources" };
    if (parts[0] === "notes" || parts[0] === "questions") {
      return { name: parts[0] };
    }
    return { name: "dashboard" };
  }

  function pageTitle(route) {
    if (route.name === "module") {
      const module = moduleMap.get(route.id);
      return (module.optional ? "Option · " : "Module " + module.id + " · ") + module.title + " — Parcours IA";
    }
    if (route.name === "resources") return "Ressources — Parcours IA";
    if (route.name === "notes") return "Mes notes — Parcours IA";
    if (route.name === "questions") return "Mes questions — Parcours IA";
    return "Parcours IA — Bien utiliser l’IA";
  }

  function renderRoute(options) {
    const settings = options || {};
    flushSave();
    const route = parseRoute();
    const previousScrollY = window.scrollY;
    const moduleChanged = route.name === "module" && app.lastRenderedModule !== route.id;

    app.route = route;

    if (route.name === "module") {
      const module = moduleMap.get(route.id);
      if (app.requestedTab) {
        app.workspaceTab = app.requestedTab;
        app.requestedTab = null;
      } else if (moduleChanged && !settings.preserveScroll) {
        app.workspaceTab = "notes";
      }
      if (app.state.ui.lastModuleId !== module.id) {
        app.state.ui.lastModuleId = module.id;
        persist();
      }
      app.lastRenderedModule = module.id;
    } else {
      app.requestedTab = null;
      app.lastRenderedModule = null;
    }

    let html = "";
    if (route.name === "module") {
      html = Views.modulePage(app, moduleMap.get(route.id));
    } else if (route.name === "resources") {
      html = Views.resourcesPage(app);
    } else if (route.name === "notes") {
      html = Views.notesPage(app);
    } else if (route.name === "questions") {
      html = Views.questionsPage(app);
    } else {
      html = Views.dashboard(app);
    }

    const view = document.getElementById("view");
    if (!view) return;
    view.innerHTML = html;
    document.title = pageTitle(route);
    renderSidebar();
    setNavOpen(false);

    if (settings.preserveScroll) {
      window.scrollTo(0, previousScrollY);
    } else {
      window.scrollTo(0, 0);
      window.requestAnimationFrame(function () {
        view.focus({ preventScroll: true });
      });
    }

    if (app.pendingScroll) {
      const selector = app.pendingScroll;
      app.pendingScroll = null;
      window.requestAnimationFrame(function () {
        const target = document.querySelector(selector);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (app.focusQuestionId) {
      const id = app.focusQuestionId;
      app.focusQuestionId = null;
      window.requestAnimationFrame(function () {
        const card = document.querySelector('[data-question-id="' + id + '"]');
        const textarea = card ? card.querySelector('textarea[name="answer"]') : null;
        if (textarea) {
          textarea.focus({ preventScroll: true });
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      });
    }
  }

  /* --------------------------- Mises à jour ciblées ------------------------ */

  function updateGlobalProgressUI() {
    const global = Core.globalStats(app.state, modules);
    const meta = document.querySelector("[data-module-top-meta]");
    if (meta) {
      meta.textContent =
        global.completed +
        " module" +
        (global.completed > 1 ? "s" : "") +
        " terminé" +
        (global.completed > 1 ? "s" : "") +
        " · " +
        global.percent +
        " %";
    }
    const bar = document.querySelector("[data-global-progress]");
    if (bar) bar.style.width = global.percent + "%";
    const progressbar = document.querySelector(".progress-line");
    if (progressbar) progressbar.setAttribute("aria-valuenow", String(global.percent));
  }

  function updateModuleStatusUI(module) {
    const status = Views.moduleStatus(app, module);
    const chip = document.querySelector("[data-module-status]");
    if (chip) {
      chip.className = "status-chip " + (status.complete ? "is-complete" : status.started ? "is-started" : "is-new");
      chip.innerHTML =
        UI.icon(status.complete ? "check-circle" : status.started ? "target" : "compass", 16) + status.label;
    }
    renderSidebar();
  }

  function updateSelfcheckCard(module) {
    const card = document.querySelector("[data-selfcheck-card]");
    if (!card) return;
    const status = Views.moduleStatus(app, module);
    card.classList.toggle("is-complete", status.complete);
    const count = card.querySelector("[data-selfcheck-count]");
    if (count) count.textContent = status.checks.checked + "/" + status.checks.total;
    const foot = card.querySelector("[data-selfcheck-foot]");
    if (foot) {
      if (status.complete) {
        foot.innerHTML = UI.icon("check-circle", 16) + " Module terminé. Vous pouvez passer au suivant.";
      } else {
        foot.textContent =
          status.checks.checked +
          " sur " +
          status.checks.total +
          " vérification" +
          (status.checks.total > 1 ? "s" : "") +
          " cochée" +
          (status.checks.checked > 1 ? "s" : "");
      }
    }
    updateModuleStatusUI(module);
    updateGlobalProgressUI();
  }

  function updateExerciseUI(module, done) {
    const card = document.querySelector("[data-exercise-card]");
    if (!card) return;
    card.classList.toggle("is-done", done);
    const button = card.querySelector('[data-action="toggle-exercise"]');
    if (button) {
      button.className = "btn btn-block " + (done ? "btn-done" : "btn-primary");
      button.innerHTML = done ? UI.icon("check", 17) + " Exercice fait" : "Marquer comme fait";
    }
    updateModuleStatusUI(module);
  }

  function refreshQuiz(module) {
    const card = document.getElementById("quiz-card");
    if (!card) return;
    const holder = document.createElement("div");
    holder.innerHTML = Views.quizCard(app, module);
    const replacement = holder.firstElementChild;
    if (replacement) card.replaceWith(replacement);
  }

  function updateResourcesResults() {
    const container = document.getElementById("resources-results");
    if (!container) return;
    container.innerHTML = Views.resourcesResults(app);
    const count = document.getElementById("resources-result-count");
    if (count) count.textContent = Views.resourcesCount(app);
    const seen = Core.resourcesSeenCount(app.state, resources);
    const seenStat = document.getElementById("resources-seen-stat");
    if (seenStat) {
      seenStat.innerHTML =
        UI.icon("check-circle", 16) +
        "<strong>" +
        seen +
        "</strong> " +
        UI.pluralWord(seen, "consultée", "consultées");
    }
  }

  function updateNotesResults() {
    const container = document.getElementById("notes-results");
    if (!container) return;
    container.innerHTML = Views.notesResults(app);
    const empty = document.getElementById("notes-empty-modules");
    if (empty) empty.innerHTML = Views.notesEmptyModules(app);
  }

  function updateQuestionsResults() {
    const container = document.getElementById("questions-results");
    if (!container) return;
    container.innerHTML = Views.questionsResults(app);
    const count = document.getElementById("questions-result-count");
    if (count) count.textContent = Views.questionsCount(app);
  }

  /* --------------------------- Données et exports -------------------------- */

  function openDataModal() {
    UI.openModal(Views.dataModal(app), "Données et sauvegarde");
  }

  function exportJSON() {
    UI.downloadFile(
      "parcours-ia-sauvegarde-" + UI.fileNameDate() + ".json",
      Core.buildBackup(app.state),
      "application/json;charset=utf-8"
    );
    UI.showToast("Sauvegarde JSON exportée.");
  }

  function exportReport() {
    UI.downloadFile(
      "parcours-ia-rapport-" + UI.fileNameDate() + ".md",
      Core.buildReportMarkdown(app.state, data),
      "text/markdown;charset=utf-8"
    );
    UI.showToast("Rapport d’apprentissage exporté.");
  }

  function exportBrief() {
    UI.downloadFile(
      "parcours-ia-brief-auteur-" + UI.fileNameDate() + ".md",
      Core.buildAuthorBrief(app.state, data),
      "text/markdown;charset=utf-8"
    );
    UI.showToast("Brief auteur exporté.");
  }

  function exportNotes() {
    UI.downloadFile(
      "parcours-ia-notes-" + UI.fileNameDate() + ".md",
      Core.buildNotesMarkdown(app.state, data),
      "text/markdown;charset=utf-8"
    );
    UI.showToast("Notes exportées.");
  }

  async function copyBrief() {
    const ok = await UI.copyText(Core.buildAuthorBrief(app.state, data));
    UI.showToast(
      ok ? "Brief copié. Collez-le dans une conversation pour préparer les prochaines leçons." : "La copie a échoué. Utilisez l’export .md.",
      ok ? "success" : "error"
    );
  }

  function confirmReset() {
    UI.confirmAction({
      title: "Réinitialiser toutes les données ?",
      message:
        "Vos notes, exercices, questions et ressources consultées seront effacés de ce navigateur. Cette action est irréversible : exportez d’abord une sauvegarde si nécessaire.",
      confirmLabel: "Tout réinitialiser",
      danger: true,
      onConfirm: function () {
        Store.clear();
        app.state = Core.createDefaultState(allModules);
        app.editingQuestionId = null;
        app.filters.resources = { search: "", module: "all", lang: "all", type: "all", hideSeen: false };
        app.filters.notes = { search: "" };
        app.filters.questions = { search: "", module: "all", type: "all", status: "all" };
        persist();
        renderRoute();
        UI.showToast("Les données ont été réinitialisées.");
      }
    });
  }

  async function handleImportFile(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      UI.showToast("Ce fichier n’est pas un JSON valide.", "error");
      return;
    }

    const validation = Core.validateBackup(parsed);
    if (!validation.ok) {
      UI.showToast(validation.errors[0], "error");
      return;
    }

    const imported = Core.normalizeState(parsed, allModules, resources);
    UI.confirmAction({
      title: "Importer cette sauvegarde ?",
      message:
        "La sauvegarde contient " +
        imported.questions.length +
        " question(s) et les notes de " +
        Core.notesStats(imported, allModules).modulesWithNotes +
        " module(s). Vos données actuelles seront remplacées.",
      confirmLabel: "Importer",
      danger: false,
      onConfirm: function () {
        app.state = imported;
        app.editingQuestionId = null;
        persist();
        renderRoute();
        UI.showToast("Sauvegarde importée.");
      }
    });
  }

  /* ------------------------------- Actions -------------------------------- */

  function setNavOpen(open) {
    document.body.classList.toggle("nav-open", open);
    const toggle = document.getElementById("menu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  }

  function setWorkspaceTab(tab) {
    if (tab !== "notes" && tab !== "exercise" && tab !== "questions") return;
    app.workspaceTab = tab;
    document.querySelectorAll("[data-workspace-tab]").forEach(function (button) {
      const active = button.getAttribute("data-workspace-tab") === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-workspace-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-workspace-panel") !== tab;
    });
  }

  function newQuestionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "q-" + window.crypto.randomUUID();
    }
    return "q-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function handleAction(element) {
    const action = element.getAttribute("data-action");
    const questionId = element.getAttribute("data-question-id");
    const moduleId = Number(element.getAttribute("data-module-id"));
    const module = moduleMap.get(moduleId);

    switch (action) {
      case "toggle-nav":
        setNavOpen(!document.body.classList.contains("nav-open"));
        break;
      case "close-nav":
        setNavOpen(false);
        break;
      case "open-data":
        openDataModal();
        break;
      case "export-json":
        exportJSON();
        break;
      case "export-report":
        exportReport();
        break;
      case "export-brief":
        exportBrief();
        break;
      case "export-notes":
        exportNotes();
        break;
      case "copy-brief":
        copyBrief();
        break;
      case "import-json": {
        const input = document.getElementById("import-file");
        if (input) input.click();
        break;
      }
      case "reset-data":
        confirmReset();
        break;
      case "toggle-exercise": {
        if (!module) return;
        const progress = Core.ensureModuleState(app.state, module);
        progress.exerciseDone = !progress.exerciseDone;
        progress.updatedAt = Core.nowISO();
        persist();
        updateExerciseUI(module, progress.exerciseDone);
        UI.showToast(progress.exerciseDone ? "Exercice marqué comme fait." : "Exercice rouvert.");
        break;
      }
      case "quiz-select": {
        if (!module) return;
        const questionIndex = Number(element.getAttribute("data-question"));
        const optionIndex = Number(element.getAttribute("data-option"));
        const progress = Core.ensureModuleState(app.state, module);
        const current = progress.quiz[questionIndex];
        if (current && current.checked) return;
        progress.quiz[questionIndex] = { choice: optionIndex, checked: false };
        progress.updatedAt = Core.nowISO();
        persist();
        refreshQuiz(module);
        break;
      }
      case "quiz-check": {
        if (!module) return;
        const questionIndex = Number(element.getAttribute("data-question"));
        const progress = Core.ensureModuleState(app.state, module);
        const entry = progress.quiz[questionIndex];
        if (!entry) {
          UI.showToast("Choisissez d’abord une réponse.", "error");
          return;
        }
        entry.checked = true;
        progress.updatedAt = Core.nowISO();
        persist();
        refreshQuiz(module);
        break;
      }
      case "quiz-reset": {
        if (!module) return;
        const progress = Core.ensureModuleState(app.state, module);
        progress.quiz = {};
        progress.updatedAt = Core.nowISO();
        persist();
        refreshQuiz(module);
        UI.showToast("Quiz réinitialisé.");
        break;
      }
      case "edit-answer": {
        if (!questionId) return;
        app.editingQuestionId = questionId;
        app.focusQuestionId = questionId;
        renderRoute({ preserveScroll: true });
        break;
      }
      case "cancel-answer":
        app.editingQuestionId = null;
        renderRoute({ preserveScroll: true });
        break;
      case "reopen-question": {
        const question = app.state.questions.find(function (item) {
          return item.id === questionId;
        });
        if (!question) return;
        question.status = "open";
        question.answeredAt = null;
        question.updatedAt = Core.nowISO();
        persist();
        renderRoute({ preserveScroll: true });
        UI.showToast("Question rouverte.");
        break;
      }
      case "delete-question": {
        const question = app.state.questions.find(function (item) {
          return item.id === questionId;
        });
        if (!question) return;
        UI.confirmAction({
          title: "Supprimer cette question ?",
          message: "« " + Core.truncate(question.text, 140) + " » sera supprimée définitivement.",
          confirmLabel: "Supprimer",
          danger: true,
          onConfirm: function () {
            app.state.questions = app.state.questions.filter(function (item) {
              return item.id !== questionId;
            });
            if (app.editingQuestionId === questionId) app.editingQuestionId = null;
            persist();
            renderRoute({ preserveScroll: true });
            UI.showToast("Question supprimée.");
          }
        });
        break;
      }
      default:
        break;
    }
  }

  function handleClick(event) {
    if (event.defaultPrevented) return;

    const actionElement = event.target.closest("[data-action]");
    if (actionElement) {
      handleAction(actionElement);
      return;
    }

    const tab = event.target.closest("[data-workspace-tab]");
    if (tab) {
      setWorkspaceTab(tab.getAttribute("data-workspace-tab"));
      return;
    }

    const openTab = event.target.closest("[data-open-tab]");
    if (openTab) {
      const href = openTab.getAttribute("href");
      if (href && href.indexOf("#/") === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
        event.preventDefault();
        app.requestedTab = openTab.getAttribute("data-open-tab");
        app.pendingScroll = "#workspace";
        setNavOpen(false);
        if (window.location.hash === href) {
          renderRoute({ preserveScroll: false });
        } else {
          window.location.hash = href;
        }
      }
      return;
    }

    const hashLink = event.target.closest('a[href^="#/"]');
    if (hashLink) setNavOpen(false);
  }

  function handleInput(event) {
    const noteField = event.target.closest("[data-note-field]");
    if (noteField) {
      const module = moduleMap.get(Number(noteField.getAttribute("data-module-id")));
      if (!module) return;
      const field = noteField.getAttribute("data-note-field");
      if (field !== "notes" && field !== "exercise") return;
      const progress = Core.ensureModuleState(app.state, module);
      progress[field] = noteField.value;
      progress.updatedAt = Core.nowISO();
      const panel = noteField.closest(".workspace-panel");
      const counter = panel ? panel.querySelector("[data-char-count]") : null;
      if (counter) counter.textContent = charCount(noteField.value);
      scheduleSave();
      return;
    }

    const search = event.target.closest("[data-search]");
    if (search) {
      const key = search.getAttribute("data-search");
      if (!app.filters[key]) return;
      app.filters[key].search = search.value;
      if (key === "resources") updateResourcesResults();
      else if (key === "notes") updateNotesResults();
      else if (key === "questions") updateQuestionsResults();
    }
  }

  function handleChange(event) {
    const target = event.target;

    if (target.matches("[data-selfcheck]")) {
      const module = moduleMap.get(Number(target.getAttribute("data-module-id")));
      const index = Number(target.getAttribute("data-index"));
      if (!module) return;
      const wasComplete = Core.isModuleComplete(app.state, module);
      const progress = Core.ensureModuleState(app.state, module);
      progress.selfChecks[index] = target.checked;
      progress.updatedAt = Core.nowISO();
      persist();
      updateSelfcheckCard(module);
      if (!wasComplete && Core.isModuleComplete(app.state, module)) {
        UI.showToast("Module terminé. Vous pouvez passer au suivant.");
      }
      return;
    }

    if (target.matches("[data-resource-seen]")) {
      const id = target.getAttribute("data-resource-id");
      if (!id) return;
      if (target.checked) app.state.resourcesSeen[id] = Core.nowISO();
      else delete app.state.resourcesSeen[id];
      persist();
      updateResourcesResults();
      return;
    }

    if (target.matches("[data-resource-filter]")) {
      const field = target.getAttribute("data-resource-filter");
      app.filters.resources[field] = target.type === "checkbox" ? target.checked : target.value;
      updateResourcesResults();
      return;
    }

    if (target.matches("[data-question-filter]")) {
      const field = target.getAttribute("data-question-filter");
      app.filters.questions[field] = target.value;
      updateQuestionsResults();
      return;
    }

    if (target.id === "import-file") {
      handleImportFile(event);
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const kind = form.getAttribute("data-form");

    if (kind === "module-question" || kind === "new-question") {
      const values = new FormData(form);
      const text = String(values.get("text") || "").trim();
      if (text.length < 3) {
        UI.showToast("Écrivez une question un peu plus détaillée.", "error");
        return;
      }

      let questionModuleId = null;
      if (kind === "module-question") {
        questionModuleId = Number(form.getAttribute("data-module-id"));
      } else {
        const rawModule = String(values.get("moduleId") || "general");
        if (rawModule !== "general") {
          const candidate = Number(rawModule);
          questionModuleId = moduleMap.has(candidate) ? candidate : null;
        }
      }

      let type = String(values.get("type") || "question");
      if (["question", "idea", "bug"].indexOf(type) === -1) type = "question";
      const context = String(values.get("context") || "").trim();
      const timestamp = Core.nowISO();
      const question = {
        id: newQuestionId(),
        moduleId: questionModuleId,
        type: type,
        text: text,
        context: context,
        answer: "",
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
        answeredAt: null
      };

      app.state.questions.unshift(question);
      persist();
      if (kind === "module-question") {
        app.workspaceTab = "questions";
        app.pendingScroll = "#workspace";
      } else {
        app.pendingScroll = "#questions-results";
      }
      renderRoute({ preserveScroll: true });
      UI.showToast("Question enregistrée.");
      return;
    }

    if (kind === "answer") {
      const questionId = form.getAttribute("data-question-id");
      const question = app.state.questions.find(function (item) {
        return item.id === questionId;
      });
      if (!question) return;
      const values = new FormData(form);
      const answer = String(values.get("answer") || "").trim();
      const timestamp = Core.nowISO();
      question.answer = answer;
      question.status = answer ? "answered" : "open";
      question.answeredAt = answer ? timestamp : null;
      question.updatedAt = timestamp;
      persist();
      app.editingQuestionId = null;
      renderRoute({ preserveScroll: true });
      UI.showToast(answer ? "Réponse enregistrée." : "Question rouverte.");
    }
  }

  /* ------------------------------- Init ---------------------------------- */

  function init() {
    UI.initModalBindings();
    renderSidebar();
    renderRoute();

    window.addEventListener("hashchange", function () {
      renderRoute();
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
        setNavOpen(false);
      }
    });

    window.addEventListener("beforeunload", flushSave);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flushSave();
    });

    if (!Store.isAvailable()) {
      window.setTimeout(function () {
        UI.showToast("Le stockage local est indisponible : exportez vos données avant de fermer.", "error");
      }, 700);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
