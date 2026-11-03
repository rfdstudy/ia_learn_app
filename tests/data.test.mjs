import test from "node:test";
import assert from "node:assert/strict";
import { loadData } from "./load-app.mjs";

const window = await loadData();
const data = window.IA_DATA;
const allModules = [...data.modules, ...data.optionalModules];
const plain = (value) => JSON.parse(JSON.stringify(value));

test("le parcours contient les 12 modules et les 3 modules optionnels", () => {
  assert.equal(data.modules.length, 12);
  assert.equal(data.optionalModules.length, 3);
  assert.deepEqual(
    plain(data.modules.map((module) => module.id)),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  );
  assert.deepEqual(
    plain(data.optionalModules.map((module) => module.id)),
    [101, 102, 103]
  );
});

test("chaque module possède un contenu pédagogique complet", () => {
  for (const module of allModules) {
    assert.equal(typeof module.shortTitle, "string", `shortTitle du module ${module.id}`);
    assert.ok(module.shortTitle.trim(), `shortTitle vide pour le module ${module.id}`);
    assert.ok(module.title.trim(), `titre vide pour le module ${module.id}`);
    assert.ok(module.kicker.trim(), `kicker vide pour le module ${module.id}`);
    assert.ok(module.duration.trim(), `durée vide pour le module ${module.id}`);
    assert.ok(module.idea.trim(), `idée vide pour le module ${module.id}`);
    assert.ok(module.example.trim(), `exemple vide pour le module ${module.id}`);
    assert.ok(module.exercise.trim(), `exercice vide pour le module ${module.id}`);
    assert.ok(module.concepts.length >= 3, `concepts insuffisants pour le module ${module.id}`);
    assert.ok(module.selfCheck.length >= 2, `auto-vérification insuffisante pour le module ${module.id}`);
    assert.equal(module.quiz.length, 3, `quiz incomplet pour le module ${module.id}`);
    assert.equal(module.optional, module.id >= 100, `option incorrecte pour le module ${module.id}`);
  }
});

test("les concepts et auto-vérifications sont renseignés", () => {
  for (const module of allModules) {
    for (const concept of module.concepts) {
      assert.ok(concept.title.trim(), `titre de concept vide dans le module ${module.id}`);
      assert.ok(concept.text.trim(), `texte de concept vide dans le module ${module.id}`);
    }
    for (const item of module.selfCheck) {
      assert.ok(item.trim(), `auto-vérification vide dans le module ${module.id}`);
    }
  }
});

test("les quiz ont une réponse valide et une explication", () => {
  for (const module of allModules) {
    module.quiz.forEach((question, index) => {
      const label = `module ${module.id}, question ${index + 1}`;
      assert.ok(question.question.trim(), `énoncé vide (${label})`);
      assert.equal(question.options.length, 3, `nombre d’options (${label})`);
      assert.ok(question.options.every((option) => option.trim()), `option vide (${label})`);
      assert.ok(Number.isInteger(question.answer), `index de réponse absent (${label})`);
      assert.ok(question.answer >= 0 && question.answer < question.options.length, `index de réponse invalide (${label})`);
      assert.ok(question.explanation.trim(), `explication vide (${label})`);
    });
  }
});

test("la bibliothèque de ressources est cohérente et reliée aux modules", () => {
  const resourceIds = new Set();
  const moduleIds = new Set(allModules.map((module) => module.id));

  assert.ok(data.resources.length >= 30, "la bibliothèque doit rester substantielle");

  for (const resource of data.resources) {
    assert.ok(resource.id.trim(), "identifiant de ressource vide");
    assert.equal(resourceIds.has(resource.id), false, `identifiant de ressource dupliqué : ${resource.id}`);
    resourceIds.add(resource.id);
    assert.ok(resource.title.trim(), `titre vide pour ${resource.id}`);
    assert.ok(resource.author.trim(), `auteur vide pour ${resource.id}`);
    assert.match(resource.url, /^https:\/\//, `URL non sécurisée pour ${resource.id}`);
    assert.ok(["fr", "en"].includes(resource.lang), `langue invalide pour ${resource.id}`);
    assert.ok(["free", "freemium"].includes(resource.price), `prix invalide pour ${resource.id}`);
    assert.ok(
      ["video", "article", "course", "doc", "tool", "pdf"].includes(resource.type),
      `format invalide pour ${resource.id}`
    );
    assert.ok(resource.moduleIds.length >= 1, `aucun module relié à ${resource.id}`);
    for (const id of resource.moduleIds) {
      assert.ok(moduleIds.has(id), `module inconnu ${id} pour ${resource.id}`);
    }
  }

  for (const module of allModules) {
    assert.ok(module.resourceIds.length >= 1, `aucune ressource pour le module ${module.id}`);
    for (const id of module.resourceIds) {
      assert.ok(resourceIds.has(id), `ressource inconnue ${id} pour le module ${module.id}`);
    }
  }
});
