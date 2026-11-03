import test from "node:test";
import assert from "node:assert/strict";
import { loadRuntime } from "./load-app.mjs";

const runtime = await loadRuntime();
const { IACore: Core, IAUI: UI, IAStore: Store, IA_DATA: data } = runtime;
const modules = data.modules;
const optionalModules = data.optionalModules;
const allModules = [...modules, ...optionalModules];
const plain = (value) => JSON.parse(JSON.stringify(value));

function freshState() {
  return Core.createDefaultState(allModules);
}

function addQuestion(state, overrides = {}) {
  const timestamp = "2026-11-03T10:00:00.000Z";
  const question = {
    id: "q-test-" + Math.random().toString(36).slice(2, 8),
    moduleId: 1,
    type: "question",
    text: "Pourquoi le modèle oublie-t-il la conversation précédente ?",
    context: "Test unitaire",
    answer: "",
    status: "open",
    createdAt: timestamp,
    updatedAt: timestamp,
    answeredAt: null,
    ...overrides
  };
  state.questions.push(question);
  return question;
}

test("l’état par défaut contient une progression pour chaque module", () => {
  const state = freshState();
  assert.equal(state.app, Core.APP_ID);
  assert.equal(state.version, Core.VERSION);
  assert.deepEqual(plain(state.questions), []);
  assert.equal(Object.keys(state.progress).length, allModules.length);
  for (const module of allModules) {
    const progress = state.progress[module.id];
    assert.equal(progress.selfChecks.length, module.selfCheck.length);
    assert.equal(progress.selfChecks.every((value) => value === false), true);
    assert.deepEqual(plain(progress.quiz), {});
    assert.equal(progress.notes, "");
  }
});

test("un module est terminé quand toutes ses auto-vérifications sont cochées", () => {
  const state = freshState();
  const module = modules[0];
  const progress = Core.ensureModuleState(state, module);

  assert.equal(Core.isModuleComplete(state, module), false);
  assert.equal(Core.isModuleStarted(state, module), false);
  assert.deepEqual(plain(Core.moduleCheckProgress(state, module)), {
    checked: 0,
    total: module.selfCheck.length,
    ratio: 0
  });

  progress.notes = "Une première note.";
  assert.equal(Core.isModuleStarted(state, module), true);
  assert.equal(Core.globalStats(state, modules).started, 1);

  progress.selfChecks = progress.selfChecks.map(() => true);
  assert.equal(Core.isModuleComplete(state, module), true);
  assert.equal(Core.globalStats(state, modules).completed, 1);
  assert.equal(Core.globalStats(state, modules).percent, 8);
});

test("le score du quiz ne compte que les réponses vérifiées", () => {
  const state = freshState();
  const module = modules[0];
  const progress = Core.ensureModuleState(state, module);

  progress.quiz[0] = { choice: module.quiz[0].answer, checked: true };
  progress.quiz[1] = { choice: (module.quiz[1].answer + 1) % 3, checked: true };
  progress.quiz[2] = { choice: module.quiz[2].answer, checked: false };

  assert.deepEqual(plain(Core.quizScore(state, module)), {
    score: 1,
    answered: 2,
    total: 3
  });
});

test("les statistiques de notes et de questions sont exactes", () => {
  const state = freshState();
  const progress = Core.ensureModuleState(state, modules[0]);
  progress.notes = "Une note utile.";
  progress.exercise = "Un exercice terminé.";
  progress.updatedAt = "2026-11-03T12:00:00.000Z";

  const notes = Core.notesStats(state, allModules);
  assert.equal(notes.modulesWithNotes, 1);
  assert.equal(notes.modulesWithExercise, 1);
  assert.equal(notes.notesCharacters, 15);
  assert.equal(notes.exerciseCharacters, 20);

  addQuestion(state, { type: "question" });
  addQuestion(state, { type: "idea", status: "answered", answer: "Une piste." });
  addQuestion(state, { type: "bug", answer: "" });
  const questions = Core.questionsStats(state);
  assert.deepEqual(plain(questions), {
    total: 3,
    open: 2,
    answered: 1,
    question: 1,
    idea: 1,
    bug: 1
  });
});

test("les ressources consultées sont normalisées et comptées", () => {
  const state = freshState();
  const first = data.resources[0];
  state.resourcesSeen[first.id] = "2026-11-03T09:00:00.000Z";
  state.resourcesSeen.unknown = "2026-11-03T09:00:00.000Z";

  const normalized = Core.normalizeState(state, allModules, data.resources);
  assert.equal(normalized.resourcesSeen[first.id], "2026-11-03T09:00:00.000Z");
  assert.equal("unknown" in normalized.resourcesSeen, false);
  assert.equal(Core.resourcesSeenCount(normalized, data.resources), 1);
});

test("la normalisation répare une sauvegarde partielle sans perdre les données valides", () => {
  const state = freshState();
  state.progress[1].notes = "Note conservée";
  state.progress[1].selfChecks[0] = true;
  state.progress[1].quiz[0] = { choice: 1, checked: true };
  const question = addQuestion(state, {
    answer: "Une réponse",
    status: "answered"
  });

  const partial = {
    app: Core.APP_ID,
    version: 1,
    createdAt: state.createdAt,
    progress: {
      1: {
        notes: "Note conservée",
        selfChecks: [true],
        quiz: {
          0: { choice: 1, checked: true },
          1: { choice: 99, checked: true }
        }
      }
    },
    questions: [
      {
        id: question.id,
        moduleId: 1,
        type: "question",
        text: question.text,
        answer: "Une réponse",
        createdAt: question.createdAt
      },
      { text: "" },
      { moduleId: 999, text: "Question générale", type: "inconnu" }
    ],
    resourcesSeen: { [data.resources[0].id]: "date-invalide" }
  };

  const normalized = Core.normalizeState(partial, allModules, data.resources);
  assert.equal(normalized.progress[1].notes, "Note conservée");
  assert.equal(normalized.progress[1].selfChecks.length, modules[0].selfCheck.length);
  assert.deepEqual(plain(normalized.progress[1].quiz), { 0: { choice: 1, checked: true } });
  assert.equal(normalized.questions.length, 2);
  assert.equal(normalized.questions[0].status, "answered");
  assert.equal(normalized.questions[1].moduleId, null);
  assert.equal(normalized.questions[1].type, "question");
  assert.ok(normalized.resourcesSeen[data.resources[0].id]);
  assert.equal(Object.keys(normalized.progress).length, allModules.length);
});

test("la validation de sauvegarde refuse les fichiers étrangers et les versions futures", () => {
  const valid = JSON.parse(Core.buildBackup(freshState()));
  assert.deepEqual(plain(Core.validateBackup(valid)), { ok: true, errors: [] });

  assert.equal(Core.validateBackup(null).ok, false);
  assert.equal(Core.validateBackup({ app: "autre-app", version: 1, progress: {} }).ok, false);
  assert.equal(Core.validateBackup({ app: Core.APP_ID, version: Core.VERSION + 1, progress: {} }).ok, false);
  assert.equal(Core.validateBackup({ app: Core.APP_ID, version: 1 }).ok, false);
});

test("les exports Markdown contiennent les notes, questions et ressources consultées", () => {
  const state = freshState();
  const module = modules[0];
  const progress = Core.ensureModuleState(state, module);
  progress.notes = "Le contexte est la seule mémoire du modèle.";
  progress.exercise = "J’ai comparé trois réponses.";
  progress.selfChecks = progress.selfChecks.map(() => true);
  progress.quiz[0] = { choice: module.quiz[0].answer, checked: true };
  const question = addQuestion(state, {
    text: "Comment vérifier une source ?",
    context: "Après l’exercice",
    status: "open"
  });
  state.resourcesSeen[data.resources[0].id] = "2026-11-03T09:00:00.000Z";

  const report = Core.buildReportMarkdown(state, data);
  assert.match(report, /Rapport d’apprentissage/);
  assert.match(report, /Le contexte est la seule mémoire du modèle\./);
  assert.match(report, /Comment vérifier une source \?/);
  assert.match(report, /Ressources consultées/);
  assert.match(report, /### Module 1[^\n]*\n\n- Statut : terminé/);
  assert.match(report, /### Module 2[^\n]*\n\n- Statut : à découvrir/);
  assert.match(report, /### Module 3[^\n]*\n\n- Statut : à découvrir/);

  const notes = Core.buildNotesMarkdown(state, data);
  assert.match(notes, /Notes et exercices/);
  assert.match(notes, /J’ai comparé trois réponses\./);

  const brief = Core.buildAuthorBrief(state, data);
  assert.match(brief, /Brief d’amélioration/);
  assert.match(brief, /Comment vérifier une source \?/);
  assert.match(brief, /Consigne pour l’assistant/);
  assert.ok(brief.includes(question.context));
  assert.match(brief, /src\/data\/modules-core\.js/);
});

test("le brief ne liste que les questions ouvertes dans la section prioritaire", () => {
  const state = freshState();
  addQuestion(state, { text: "Question ouverte prioritaire", status: "open" });
  addQuestion(state, {
    text: "Question déjà répondue",
    status: "answered",
    answer: "Réponse existante"
  });

  const brief = Core.buildAuthorBrief(state, data);
  const openSection = brief.split("## Questions déjà traitées")[0];
  assert.match(openSection, /Question ouverte prioritaire/);
  assert.doesNotMatch(openSection, /Question déjà répondue/);
  assert.match(brief, /Questions déjà traitées/);
});

test("l’échappement HTML et les libellés partagés sont sûrs", () => {
  assert.equal(
    UI.escapeHTML('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
  );
  assert.equal(UI.escapeAttr("a`b"), "a&#96;b");
  assert.equal(UI.nl2br("ligne 1\nligne 2"), "ligne 1<br>ligne 2");
  assert.equal(UI.plural(1, "module", "modules"), "1 module");
  assert.equal(UI.plural(2, "module", "modules"), "2 modules");
  assert.equal(UI.moduleBadge(optionalModules[0]), "O1");
  assert.equal(UI.resourceTypeLabel("video"), "Vidéo");
});

test("le stockage indisponible ne fait pas échouer l’application", () => {
  const state = freshState();
  const loaded = Store.load(allModules, data.resources);
  assert.equal(loaded.questions.length, 0);
  assert.equal(Store.save(state), false);
  assert.equal(Store.isAvailable(), false);
  assert.doesNotThrow(() => Store.clear());
});
