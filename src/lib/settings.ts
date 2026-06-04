const KEY = 'autoFetchLogos';
export function getAutoFetch(): boolean { return localStorage.getItem(KEY) !== '0'; }
export function setAutoFetch(on: boolean): void { localStorage.setItem(KEY, on ? '1' : '0'); }
