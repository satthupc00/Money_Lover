import ICONS from './icons.json';

export const I = (name, cls = '') =>
  `<svg class="lc ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

export const hasIcon = (name) => !!ICONS[name];
