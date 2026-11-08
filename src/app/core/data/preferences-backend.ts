import { doc, getDoc, serverTimestamp, setDoc, type DocumentData, type Firestore } from 'firebase/firestore';
import { DEFAULT_PREFERENCES, isLanguage, type Preferences, type Scheme } from '../../domain/preferences';

/** Swappable storage for the User's preferences (one document). */
export abstract class PreferencesBackend {
  /** Null when the User has no preferences document yet. */
  abstract load(uid: string): Promise<Preferences | null>;
  /** Writes the full document. */
  abstract save(uid: string, prefs: Preferences): Promise<void>;
}

export function toPrefsDoc(p: Preferences): DocumentData {
  const d: DocumentData = { accent: p.accent, scheme: p.scheme, language: p.language, updatedAt: serverTimestamp() };
  if (p.accent === 'custom') {
    d['hue'] = p.hue ?? 0;
    d['chroma'] = p.chroma ?? 0;
  }
  return d;
}

export function fromPrefsDoc(d: DocumentData): Preferences {
  const scheme: Scheme = d['scheme'] === 'light' || d['scheme'] === 'dark' ? d['scheme'] : 'system';
  const accent = typeof d['accent'] === 'string' && d['accent'] ? d['accent'] : DEFAULT_PREFERENCES.accent;
  const base: Preferences = {
    accent,
    scheme,
    language: isLanguage(d['language']) ? d['language'] : DEFAULT_PREFERENCES.language,
  };
  return accent === 'custom' && typeof d['hue'] === 'number' && typeof d['chroma'] === 'number'
    ? { ...base, hue: d['hue'], chroma: d['chroma'] }
    : base;
}

const refFor = (db: Firestore, uid: string) => doc(db, `users/${uid}/preferences/app`);

export class FirestorePreferencesBackend extends PreferencesBackend {
  constructor(private readonly db: Firestore) {
    super();
  }

  async load(uid: string): Promise<Preferences | null> {
    const snap = await getDoc(refFor(this.db, uid));
    return snap.exists() ? fromPrefsDoc(snap.data()) : null;
  }

  async save(uid: string, prefs: Preferences): Promise<void> {
    await setDoc(refFor(this.db, uid), toPrefsDoc(prefs));
  }
}
