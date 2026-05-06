import LZString from 'lz-string';
import type { MindMap, MindMapNode } from './db';

export interface SharedState {
  map: { title: string };
  nodes: MindMapNode[];
}

export function encodeStateToHash(state: SharedState): string {
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeHashToState(hash: string): SharedState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json) as SharedState;
  } catch {
    return null;
  }
}

export function readMapFromUrl(): SharedState | null {
  const h = window.location.hash;
  const m = h.match(/[#&]map=([^&]+)/);
  if (!m) return null;
  return decodeHashToState(m[1]);
}

export function writeMapToUrl(state: SharedState) {
  const encoded = encodeStateToHash(state);
  const newHash = `#map=${encoded}`;
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
  }
}
