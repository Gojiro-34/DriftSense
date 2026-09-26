// ─── Icon System ─────────────────────────────────────────────────────────────
// Inline stroke-based SVGs. Consistent 1.75px stroke, 24x24 grid, round joins.
// No icon fonts, no emoji.

const ICONS = {
  brand: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v3M12 17v3M20.5 12h-3M6.5 12h-3"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1"/><rect x="13" y="3.5" width="7.5" height="4.5" rx="1"/><rect x="13" y="10.5" width="7.5" height="10" rx="1"/><rect x="3.5" y="13.5" width="7.5" height="7" rx="1"/>',
  gavel: '<path d="M13.5 6.5 17.5 10.5"/><path d="M9.8 10.2 13.8 14.2"/><path d="M6 13.9 10.1 18"/><path d="M3.3 20.7 8.5 15.5"/><path d="M12.2 3.8 20.2 11.8"/>',
  "clipboard-check": '<rect x="5" y="4.5" width="14" height="17" rx="1.5"/><path d="M9 4.5V3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4.5"/><path d="M9 13l2.2 2.2L15.5 11"/>',
  list: '<path d="M8.5 6h11M8.5 12h11M8.5 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  "alert-triangle": '<path d="M12 4 21.2 20H2.8Z"/><path d="M12 9.7v4.3"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>',
  "check-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.6 2.6 5-5.4"/>',
  "log-in": '<path d="M10.5 3.5H6a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 6 20.5h4.5"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9.5"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1"/><rect x="10" y="10" width="4" height="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M19 5l-2 2M5 19l2-2M19 19l-2-2"/>',
  "cloud-off": '<path d="M4 4l16 16"/><path d="M8.5 8.6A4.5 4.5 0 0 0 9 17.5h9a4 4 0 0 0 1.3-7.8"/><path d="M6.6 12.1A4.5 4.5 0 0 1 15.9 8"/>',
  "shield-check": '<path d="M12 3l7.5 3v5.6c0 4.6-3.1 8.4-7.5 9.4-4.4-1-7.5-4.8-7.5-9.4V6Z"/><path d="M8.7 12.2l2.3 2.3 4.3-4.6"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="17" rx="1.5"/><path d="M9 4.5V3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4.5"/>',
  "alert-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  "file-text": '<path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4.2"/><path d="M8.5 12.5h7M8.5 16h7"/>',
  "arrows-horizontal": '<path d="M3.5 8.5h16M16.5 4.5l3.5 4-3.5 4"/><path d="M20.5 15.5h-16M7.5 19.5l-3.5-4 3.5-4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="M20 20l-4.4-4.4"/>',
  shield: '<path d="M12 3l7.5 3v5.6c0 4.6-3.1 8.4-7.5 9.4-4.4-1-7.5-4.8-7.5-9.4V6Z"/>',
  wrench: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.4L3.5 17l3.5 3.5 5.3-5.2a4.5 4.5 0 0 0 5.4-6l-3 3-2.6-2.6Z"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4.5v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 19.5v-4h4"/>',
  "user-x": '<circle cx="9.5" cy="8" r="4"/><path d="M2.5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="M17.5 8.5l4.5 4.5M22 8.5L17.5 13"/>',
  "x-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none"/>',
  "chevron-right": '<path d="M9 5l7 7-7 7"/>'
};

function icon(name, opts = {}) {
  const body = ICONS[name];
  if (!body) return "";
  const size = opts.size || 18;
  const cls = opts.className ? ` ${opts.className}` : "";
  const stroke = opts.strokeWidth || 1.75;
  return `<svg class="icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

window.icon = icon;
