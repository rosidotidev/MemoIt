import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/data/auth.service';
import { LanguageService } from './language.service';
import { SnackbarService } from './snackbar.service';

/** Signs the User out and returns to the login screen. Shared by the navigation and the account menu. */
@Injectable({ providedIn: 'root' })
export class SignOutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly strings = inject(LanguageService).strings;
  private busy = false;

  async signOut(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      await this.auth.signOut();
    } catch {
      this.snackbar.show(this.strings().authErrors.unknown);
      this.busy = false;
      return;
    }
    try {
      await this.router.navigateByUrl('/login');
      this.snackbar.show(this.strings().snackbar.signedOut);
    } finally {
      this.busy = false;
    }
  }
}
