/*
 * Briques d’interface partagées : icônes, échappement, libellés,
 * notifications, fenêtres modales, téléchargements et presse-papiers.
 */
window.IAUI = (function () {
  "use strict";

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17h.01"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
    bug: '<path d="M8 2l1.5 2"/><path d="M16 2l-1.5 2"/><rect x="7" y="6" width="10" height="12" rx="5"/><path d="M3 13h4M17 13h4M5 8l2 1M19 8l-2 1M5 18l2-1M19 18l-2-1"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 5 4-5 4Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    "arrow-up-right": '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>'
  };

  const RESOURCE_TYPES = {
    video: "Vidéo",
    article: "Article",
    course: "Cours",
    doc: "Documentation",
    tool: "Outil",
    pdf: "PDF"
  };

  const RESOURCE_ICONS = {
    video: "play",
    article: "file",
    course: "book",
    doc: "file",
    tool: "spark",
    pdf: "file"
  };

  const LANG_LABELS = {
    fr: "FR",
    en: "EN"
  };

  const PRICE_LABELS = {
    free: "Gratuit",
    freemium: "Freemium"
  };

  function icon(name, size, extraClass) {
    const body = ICONS[name] || "";
    return (
      '<svg class="icon ' +
      (extraClass || "") +
      '" width="' +
      (size || 18) +
      '" height="' +
      (size || 18) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  function logoMark() {
    return '<svg class="logo-svg" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5c.7 6.9 3.3 9.5 10.2 10.2-6.9.7-9.5 3.3-10.2 10.2-.7-6.9-3.3-9.5-10.2-10.2C12.7 12 15.3 9.4 16 2.5Z" fill="currentColor"/><circle cx="24.5" cy="24.5" r="3.5" fill="currentColor" opacity=".55"/></svg>';
  }

  function escapeHTML(value) {
    return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, "&#96;");
  }

  function nl2br(value) {
    return escapeHTML(value).replace(/\r?\n/g, "<br>");
  }

  function plural(count, singular, pluralForm) {
    return count + " " + (count > 1 ? pluralForm : singular);
  }

  function pluralWord(count, singular, pluralForm) {
    return count === 1 ? singular : pluralForm;
  }

  function moduleBadge(module) {
    return module.optional ? "O" + (module.id - 100) : String(module.id);
  }

  function resourceTypeLabel(type) {
    return RESOURCE_TYPES[type] || "Ressource";
  }

  function resourceIcon(type) {
    return RESOURCE_ICONS[type] || "file";
  }

  function langLabel(lang) {
    return LANG_LABELS[lang] || lang.toUpperCase();
  }

  function priceLabel(price) {
    return PRICE_LABELS[price] || price;
  }

  function fileNameDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  /* ----------------------------- Notifications ----------------------------- */

  let toastTimer = null;

  function showToast(message, tone) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.innerHTML =
      icon(tone === "error" ? "close" : "check-circle", 18) +
      "<span>" +
      escapeHTML(message) +
      "</span>";
    toast.className = "toast is-visible" + (tone === "error" ? " is-error" : "");
    toastTimer = window.setTimeout(function () {
      toast.className = "toast";
    }, 4200);
  }

  /* ------------------------------- Modales -------------------------------- */

  let modalOpen = false;
  let lastFocused = null;
  let pendingConfirm = null;

  function modalRoot() {
    return document.getElementById("modal-root");
  }

  function focusables(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function openModal(contentHTML, label) {
    const root = modalRoot();
    if (!root) return;
    if (!modalOpen) lastFocused = document.activeElement;
    modalOpen = true;
    root.innerHTML =
      '<div class="modal-overlay" data-ui-overlay>' +
      '<div class="modal-card" role="dialog" aria-modal="true" aria-label="' +
      escapeAttr(label || "Fenêtre") +
      '">' +
      contentHTML +
      "</div>" +
      "</div>";
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(function () {
      const card = root.querySelector(".modal-card");
      const target = card.querySelector("[data-autofocus]") || card.querySelector("[data-ui-close]");
      if (target) target.focus();
    });
  }

  function closeModal() {
    const root = modalRoot();
    if (!root || !modalOpen) return;
    root.innerHTML = "";
    modalOpen = false;
    pendingConfirm = null;
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function confirmAction(options) {
    pendingConfirm = options.onConfirm || null;
    openModal(
      '<div class="confirm-dialog">' +
        '<div class="confirm-icon ' +
        (options.danger === false ? "is-neutral" : "is-danger") +
        '">' +
        icon(options.danger === false ? "help" : "trash", 22) +
        "</div>" +
        '<h2 class="confirm-title">' +
        escapeHTML(options.title) +
        "</h2>" +
        '<p class="confirm-text">' +
        escapeHTML(options.message) +
        "</p>" +
        '<div class="confirm-actions">' +
        '<button type="button" class="btn btn-secondary" data-ui-close>Annuler</button>' +
        '<button type="button" class="btn ' +
        (options.danger === false ? "btn-primary" : "btn-danger") +
        '" data-ui-confirm data-autofocus>' +
        escapeHTML(options.confirmLabel || "Confirmer") +
        "</button>" +
        "</div>" +
        "</div>",
      options.title
    );
  }

  function initModalBindings() {
    document.addEventListener("click", function (event) {
      if (!modalOpen) return;
      if (event.target.closest("[data-ui-close]")) {
        closeModal();
        return;
      }
      if (event.target.hasAttribute("data-ui-overlay")) {
        closeModal();
        return;
      }
      if (event.target.closest("[data-ui-confirm]")) {
        const callback = pendingConfirm;
        closeModal();
        if (typeof callback === "function") callback();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!modalOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === "Tab") {
        const card = modalRoot().querySelector(".modal-card");
        if (!card) return;
        const items = focusables(card);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* -------------------------- Fichiers et copie --------------------------- */

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* on essaie le repli ci-dessous */
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const result = document.execCommand("copy");
      textarea.remove();
      return result;
    } catch (error) {
      return false;
    }
  }

  return {
    icon: icon,
    logoMark: logoMark,
    escapeHTML: escapeHTML,
    escapeAttr: escapeAttr,
    nl2br: nl2br,
    plural: plural,
    pluralWord: pluralWord,
    moduleBadge: moduleBadge,
    resourceTypeLabel: resourceTypeLabel,
    resourceIcon: resourceIcon,
    langLabel: langLabel,
    priceLabel: priceLabel,
    fileNameDate: fileNameDate,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    confirmAction: confirmAction,
    initModalBindings: initModalBindings,
    downloadFile: downloadFile,
    copyText: copyText
  };
})();
