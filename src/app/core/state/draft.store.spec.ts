import { TestBed } from '@angular/core/testing';
import { signedIn, SIGNED_OUT_SESSION } from '../../domain/session';
import { DraftStore } from './draft.store';
import { SessionScope } from './session-scope';
import { SessionState } from './session.state';

describe('DraftStore', () => {
  it('keeps one draft per Category and returns an empty one by default', () => {
    const store = TestBed.inject(DraftStore);
    expect(store.get('k1')).toEqual({ categoryId: 'k1', title: '', description: '', priority: 'medium', deadline: null, value: '' });
    store.set({ categoryId: 'k1', title: 'Milk', description: '', priority: 'medium', deadline: null, value: '' });
    expect(store.get('k1').title).toBe('Milk');
    expect(store.get('k2').title).toBe('');
  });

  it('keeps an edit draft apart from the new-Item draft', () => {
    const store = TestBed.inject(DraftStore);
    const item = { id: 'a', categoryId: 'k1', title: 'Milk', done: false, priority: 'medium' as const, createdAt: 1 };
    expect(store.get('k1', item)).toEqual({ categoryId: 'k1', itemId: 'a', title: 'Milk', description: '', priority: 'medium', deadline: null, value: '' });
    store.set({ categoryId: 'k1', itemId: 'a', title: 'Oat', description: '', priority: 'medium', deadline: null, value: '' });
    expect(store.get('k1', item).title).toBe('Oat');
    expect(store.get('k1').title).toBe('');
    store.drop('k1', 'a');
    expect(store.get('k1', item).title).toBe('Milk');
  });

  it('drops a draft', () => {
    const store = TestBed.inject(DraftStore);
    store.set({ categoryId: 'k1', title: 'Milk', description: 'x', priority: 'medium', deadline: null, value: '' });
    store.drop('k1');
    expect(store.get('k1').title).toBe('');
  });

  it('is cleared on sign out', () => {
    const state = TestBed.inject(SessionState);
    TestBed.inject(SessionScope);
    const store = TestBed.inject(DraftStore);
    state.session.set(signedIn('u1'));
    TestBed.tick();
    store.set({ categoryId: 'k1', title: 'Milk', description: '', priority: 'medium', deadline: null, value: '' });
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    expect(store.get('k1').title).toBe('');
  });
});
