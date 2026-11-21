// Boot: styles from tokens, storage, then the first screen. Ported from v1's start().
import { tokenCss } from './design/tokens';
import './app/styles.css';
import { DeviceAdapter, AccountAdapter, Store } from './storage/store';
import { emptyApp } from './storage/schema';
import { G } from './app/state';
import { initTTS, watchTheme } from './app/effects';
import { listen, mount, render, routeHome, setProf } from './app/flow';
import { BOOT_MS } from './app/data';
import { installTestHooks } from './app/testhooks';

const tokens = document.createElement('style');
tokens.id = 'tokens';
tokens.textContent = tokenCss();
document.head.prepend(tokens);

const device = new DeviceAdapter();
G.store = new Store(device, device.loadSync() || emptyApp());
mount(document.getElementById('app')!, document.getElementById('layer')!);
watchTheme();
listen();
installTestHooks();

function start() {
  setProf(); G.UI.screen = 'boot'; render();
  const ready = { done: false };
  const go = () => { if (ready.done) return; ready.done = true; routeHome(); };
  setTimeout(go, BOOT_MS);
  AccountAdapter.connect(window.claude)
    .then(acc => G.store.attach(acc, { inPractice: () => G.UI.screen === 'practice', onReplaced: () => { if (ready.done) routeHome(); } }))
    .catch(() => { /* device storage only */ })
    .then(go, go);
  initTTS(() => { if (G.UI.screen === 'practice') render(); });
}

const hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) hot.snapshot(() => ({}));
if (hot && hot.ready) hot.ready(start); else start();
