// Storage behind one interface with two adapters (spec F-20.AC-2):
//   device  - localStorage in this browser (always, the default)
//   account - the Claude artifact runtime's per-user db, when the page runs as an artifact
// Behaviour is v1's: newest save wins on load; a remote save that arrives during practice is not
// applied mid-session, and the session's next save then becomes the newest. Every call is wrapped
// so a missing or failing backend never breaks rendering.
import { random } from '../engine/rng';
import { LS_KEY, migrateApp, type AppData } from './schema';

export interface StorageAdapter {
  readonly name: 'device' | 'account';
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}

type KV = Pick<Storage, 'getItem' | 'setItem'>;

/** On-device adapter. Synchronous underneath, so first paint never waits for it. */
export class DeviceAdapter implements StorageAdapter {
  readonly name = 'device' as const;
  constructor(private kv: KV | null = safeLocalStorage(), private key = LS_KEY) {}
  loadSync(): AppData | null {
    try { const s = this.kv?.getItem(this.key); return s ? migrateApp(JSON.parse(s)) : null; } catch { return null; }
  }
  saveSync(data: AppData): void { try { this.kv?.setItem(this.key, JSON.stringify(data)); } catch { /* storage full or blocked */ } }
  async load() { return this.loadSync(); }
  async save(data: AppData) { this.saveSync(data); }
}

function safeLocalStorage(): KV | null { try { return globalThis.localStorage ?? null; } catch { return null; } }

interface DocRef { get(): Promise<{ exists: boolean; data(): unknown }>; set(v: unknown): Promise<unknown> }
export interface ClaudeRuntime { use(cap: string): Promise<unknown> }

/** Account adapter over the artifact runtime's db document at data/users/<id>/numbersky. */
export class AccountAdapter implements StorageAdapter {
  readonly name = 'account' as const;
  constructor(private ref: DocRef, private timeoutMs = 10_000) {}
  async load(): Promise<AppData | null> {
    const snap = await Promise.race([this.ref.get(), new Promise<never>((_, rej) => setTimeout(() => rej({ code: 'timeout' }), this.timeoutMs))]);
    return snap.exists ? migrateApp(JSON.parse(JSON.stringify(snap.data()))) : null;
  }
  async save(data: AppData) { await this.ref.set(JSON.parse(JSON.stringify(data))); }

  /** Connects when the runtime offers db and user; resolves null otherwise. */
  static async connect(rt: ClaudeRuntime | undefined | null): Promise<AccountAdapter | null> {
    if (!rt || !rt.use) return null;
    const [db, user] = await Promise.all([rt.use('db'), rt.use('user')]) as [{ doc(p: string): DocRef } | null, { id(): Promise<string | null> } | null];
    if (!db || !user) return null;
    const uid = await user.id(); if (!uid) return null;
    return new AccountAdapter(db.doc('data/users/' + uid + '/numbersky'));
  }
}

export interface StoreHooks {
  /** True while a practice session is running: a newer remote save is then not applied. */
  inPractice(): boolean;
  /** Called after a newer remote save replaced the in-memory data. */
  onReplaced(): void;
}

/** Coordinates the adapters. `data` is the live, mutable app state. */
export class Store {
  data: AppData;
  mode: 'device' | 'account' = 'device';
  private account: StorageAdapter | null = null;
  private writing = false;
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly device: DeviceAdapter, initial: AppData, readonly debounceMs = 1200) { this.data = initial; }

  /** Save now on the device, and soon to the account when connected. */
  save(): void {
    this.data.updated = Date.now();
    this.device.saveSync(this.data);
    if (this.account) { this.dirty = true; this.schedule(this.debounceMs); }
  }

  private schedule(ms: number) { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => { void this.flush(); }, ms); }

  async flush(): Promise<void> {
    if (!this.account || this.writing || !this.dirty) return;
    this.writing = true; this.dirty = false;
    try { await this.account.save(this.data); this.mode = 'account'; }
    catch (e) {
      const c = (e as { code?: string } | null)?.code;
      if (c === 'unavailable') { this.dirty = true; setTimeout(() => { void this.flush(); }, 1500 + random() * 1500); }
      else if (c === 'resource_exhausted') { this.dirty = true; setTimeout(() => { void this.flush(); }, 5000); }
      else { this.account = null; this.mode = 'device'; }
    }
    this.writing = false;
    if (this.dirty && this.account && !this.writing) this.schedule(this.debounceMs);
  }

  /** Attach the account adapter and reconcile: newest save wins. Never throws. */
  async attach(account: StorageAdapter | null, hooks: StoreHooks): Promise<void> {
    try {
      if (!account) return;
      const remote = await account.load();
      this.account = account; this.mode = 'account';
      if (remote) {
        if ((remote.updated || 0) > (this.data.updated || 0) && remote.profiles) {
          if (!hooks.inPractice()) { this.data = remote; this.device.saveSync(this.data); hooks.onReplaced(); }
        } else if ((this.data.updated || 0) > (remote.updated || 0)) { this.dirty = true; await this.flush(); }
      } else if (Object.keys(this.data.profiles).length) { this.dirty = true; await this.flush(); }
    } catch { /* stay on device storage */ }
  }
}
