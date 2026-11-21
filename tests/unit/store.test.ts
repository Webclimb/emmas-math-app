// Storage interface (F-20.AC-2, put in place for M0): two adapters behind one interface, newest save
// wins on load, and a remote save never silently replaces progress during a practice session.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { emptyApp, LS_KEY, type AppData } from '../../src/storage/schema';
import { AccountAdapter, DeviceAdapter, Store, type StorageAdapter } from '../../src/storage/store';
import { newProfile } from '../../src/engine/model';

function memKV() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; }
function appWith(name: string, updated: number): AppData { const p = newProfile(name, '🦊'); return { v: 1, profiles: { [p.id]: p }, current: p.id, updated }; }
class FakeAccount implements StorageAdapter {
  readonly name = 'account' as const;
  saved: AppData[] = [];
  constructor(public remote: AppData | null, public fail: string | null = null) {}
  async load() { return this.remote ? structuredClone(this.remote) : null; }
  async save(d: AppData) { if (this.fail) { const f = this.fail; this.fail = null; throw { code: f }; } this.saved.push(structuredClone(d)); }
}
const hooks = (inPractice = false) => ({ inPractice: () => inPractice, onReplaced: vi.fn() });

afterEach(() => { vi.useRealTimers(); });

describe('storage interface', () => {
  test('test_F20_AC2: the device adapter round-trips through its key and survives broken storage', () => {
    const kv = memKV(), dev = new DeviceAdapter(kv);
    expect(dev.loadSync()).toBeNull();
    const d = appWith('A', 5); dev.saveSync(d);
    expect(JSON.parse(kv.m.get(LS_KEY)!).profiles[d.current!].name).toBe('A');
    expect(dev.loadSync()!.current).toBe(d.current);
    kv.m.set(LS_KEY, '{not json'); expect(dev.loadSync()).toBeNull();
    const broken = new DeviceAdapter({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } });
    expect(broken.loadSync()).toBeNull();
    expect(() => broken.saveSync(d)).not.toThrow();
    expect(new DeviceAdapter(null).loadSync()).toBeNull();
  });

  test('test_F20_AC2: with no artifact runtime the account adapter is absent and nothing breaks', async () => {
    expect(await AccountAdapter.connect(undefined)).toBeNull();
    expect(await AccountAdapter.connect({ use: async () => null })).toBeNull();
    const st = new Store(new DeviceAdapter(memKV()), emptyApp());
    await expect(st.attach(null, hooks())).resolves.toBeUndefined();
    expect(st.mode).toBe('device');
  });

  test('test_F20_AC2: the newer save wins on load (remote newer)', async () => {
    const kv = memKV(), local = appWith('Local', 100), remote = appWith('Remote', 200);
    const st = new Store(new DeviceAdapter(kv), local), h = hooks();
    await st.attach(new FakeAccount(remote), h);
    expect(st.data.profiles[st.data.current!].name).toBe('Remote');
    expect(h.onReplaced).toHaveBeenCalledOnce();
    expect(JSON.parse(kv.m.get(LS_KEY)!).updated).toBe(200);
    expect(st.mode).toBe('account');
  });

  test('test_F20_AC2: the newer save wins on load (local newer is pushed up)', async () => {
    const local = appWith('Local', 300), acc = new FakeAccount(appWith('Remote', 200));
    const st = new Store(new DeviceAdapter(memKV()), local);
    await st.attach(acc, hooks());
    expect(st.data.profiles[st.data.current!].name).toBe('Local');
    expect(acc.saved.at(-1)!.updated).toBe(300);
  });

  test('test_F20_AC2: a newer remote save does not replace progress during practice; the session save then wins', async () => {
    vi.useFakeTimers();
    const local = appWith('Local', 100), acc = new FakeAccount(appWith('Remote', 200));
    const st = new Store(new DeviceAdapter(memKV()), local), h = hooks(true);
    await st.attach(acc, h);
    expect(st.data.profiles[st.data.current!].name).toBe('Local');
    expect(h.onReplaced).not.toHaveBeenCalled();
    vi.setSystemTime(10_000); st.save();
    await vi.advanceTimersByTimeAsync(1300);
    expect(acc.saved.at(-1)!.profiles[local.current!].name).toBe('Local');
    expect(acc.saved.at(-1)!.updated).toBe(10_000);
  });

  test('test_F20_AC2: account saves are debounced and retried when the service is briefly unavailable', async () => {
    vi.useFakeTimers();
    const acc = new FakeAccount(null), st = new Store(new DeviceAdapter(memKV()), appWith('A', 0));
    await st.attach(acc, hooks()); // pushes the existing local learner
    const before = acc.saved.length;
    st.save(); st.save(); st.save();
    await vi.advanceTimersByTimeAsync(1300);
    expect(acc.saved.length).toBe(before + 1);
    acc.fail = 'unavailable'; st.save();
    await vi.advanceTimersByTimeAsync(1300);
    expect(acc.saved.length).toBe(before + 1);
    await vi.advanceTimersByTimeAsync(3500);
    expect(acc.saved.length).toBe(before + 2);
    // A hard failure drops back to device storage only.
    acc.fail = 'permission_denied'; st.save();
    await vi.advanceTimersByTimeAsync(1300);
    expect(st.mode).toBe('device');
  });
});
