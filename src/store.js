/*
 * Persistance locale. Les données ne quittent jamais le navigateur.
 * En cas d’indisponibilité de localStorage, l’application continue en mémoire.
 */
window.IAStore = (function () {
  "use strict";

  const Core = window.IACore;
  let available = true;
  let memoryState = null;

  function load(modules, resources) {
    try {
      const raw = window.localStorage.getItem(Core.STORAGE_KEY);
      if (!raw) return Core.createDefaultState(modules);
      const parsed = JSON.parse(raw);
      return Core.normalizeState(parsed, modules, resources);
    } catch (error) {
      available = false;
      return memoryState || Core.createDefaultState(modules);
    }
  }

  function save(state) {
    state.updatedAt = Core.nowISO();
    memoryState = state;
    if (!available) return false;
    try {
      window.localStorage.setItem(Core.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      available = false;
      return false;
    }
  }

  function clear() {
    memoryState = null;
    try {
      window.localStorage.removeItem(Core.STORAGE_KEY);
    } catch (error) {
      available = false;
    }
  }

  function usageBytes(state) {
    try {
      return new Blob([JSON.stringify(state)]).size;
    } catch (error) {
      return JSON.stringify(state).length;
    }
  }

  function isAvailable() {
    return available;
  }

  return {
    load: load,
    save: save,
    clear: clear,
    usageBytes: usageBytes,
    isAvailable: isAvailable
  };
})();
