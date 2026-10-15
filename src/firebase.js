// Kết nối Firebase (Auth email + mật khẩu, Firestore có bộ nhớ offline)
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, getDocs, query, limit,
} from 'firebase/firestore';
import BUILTIN from '../firebase-config.json';
import { ls } from './util.js';

const KEY = 'mml.fbconfig';
let app, auth, db;

export function getConfig() {
  return ls.get(KEY) || BUILTIN || null;
}
export const hasBuiltinConfig = () => !!BUILTIN;

// Đọc đoạn cấu hình copy từ Firebase console (dạng JS hoặc JSON)
export function parseConfig(text) {
  const pick = (k) => { const m = String(text).match(new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`)); return m ? m[1] : undefined; };
  const cfg = {
    apiKey: pick('apiKey'), authDomain: pick('authDomain'), projectId: pick('projectId'),
    storageBucket: pick('storageBucket'), messagingSenderId: pick('messagingSenderId'), appId: pick('appId'),
  };
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  return cfg;
}
export function saveConfig(cfg) { ls.set(KEY, cfg); }
export function clearConfig() { ls.del(KEY); }

export function initFirebase() {
  if (app) return true;
  const cfg = getConfig();
  if (!cfg) return false;
  try {
    app = initializeApp(cfg);
    auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) });
    return true;
  } catch (e) {
    console.error('Firebase init', e);
    return false;
  }
}

export const fb = {
  ready: () => !!app,
  onUser: (cb) => onAuthStateChanged(auth, cb),
  signIn: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  signUp: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
  resetPass: (email) => sendPasswordResetEmail(auth, email),
  signOut: () => signOut(auth),
  currentUser: () => auth?.currentUser || null,

  watch(uid, onGroups, onTx, onErr) {
    const u1 = onSnapshot(collection(db, 'users', uid, 'groups'), (s) => onGroups(s.docs.map((d) => ({ ...d.data(), id: d.id }))), onErr);
    const u2 = onSnapshot(collection(db, 'users', uid, 'tx'), (s) => onTx(s.docs.map((d) => ({ ...d.data(), id: d.id }))), onErr);
    return () => { u1(); u2(); };
  },
  async isEmpty(uid) {
    const s = await getDocs(query(collection(db, 'users', uid, 'groups'), limit(1)));
    return s.empty;
  },
  set: (uid, col, id, data) => setDoc(doc(db, 'users', uid, col, id), data),
  update: (uid, col, id, data) => updateDoc(doc(db, 'users', uid, col, id), data),
  remove: (uid, col, id) => deleteDoc(doc(db, 'users', uid, col, id)),
  // ops: [{type:'set'|'update'|'delete', col, id, data}]
  async batch(uid, ops) {
    for (let i = 0; i < ops.length; i += 450) {
      const b = writeBatch(db);
      for (const o of ops.slice(i, i + 450)) {
        const ref = doc(db, 'users', uid, o.col, o.id);
        if (o.type === 'set') b.set(ref, o.data);
        else if (o.type === 'update') b.update(ref, o.data);
        else b.delete(ref);
      }
      await b.commit();
    }
  },
};
