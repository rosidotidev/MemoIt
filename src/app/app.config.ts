import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthBackend, FirebaseAuthBackend } from './core/data/auth-backend';
import { CategoryBackend, FirestoreCategoryBackend } from './core/data/category-backend';
import { ItemBackend, FirestoreItemBackend } from './core/data/item-backend';
import { AuthService } from './core/data/auth.service';
import { FirestorePreferencesBackend, PreferencesBackend } from './core/data/preferences-backend';
import { PreferencesStore } from './shared/preferences.store';
import { initFirebase } from './core/data/firebase';
import { SessionScope } from './core/state/session-scope';
import { LanguageService } from './shared/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    { provide: AuthBackend, useFactory: () => new FirebaseAuthBackend(initFirebase(environment).auth) },
    { provide: CategoryBackend, useFactory: () => new FirestoreCategoryBackend(initFirebase(environment).db) },
    { provide: ItemBackend, useFactory: () => new FirestoreItemBackend(initFirebase(environment).db) },
    { provide: PreferencesBackend, useFactory: () => new FirestorePreferencesBackend(initFirebase(environment).db) },
    provideAppInitializer(() => {
      // Start the session listener, the epoch tracking and the <html lang> sync.
      inject(AuthService);
      inject(SessionScope);
      inject(LanguageService);
      inject(PreferencesStore);
    }),
  ],
};
