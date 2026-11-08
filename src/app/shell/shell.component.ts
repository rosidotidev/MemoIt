import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/data/auth.service';
import { ReminderService } from '../core/data/reminder.service';
import { LanguageService } from '../shared/language.service';
import { LayoutService } from '../shared/layout.service';
import { IconComponent } from '../shared/icon.component';
import { SignOutService } from '../shared/sign-out.service';

@Component({
  selector: 'memo-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly signOutService = inject(SignOutService);
  protected readonly reminder = inject(ReminderService);
  protected readonly strings = inject(LanguageService).strings;
  protected readonly windowClass = inject(LayoutService).windowClass;
  protected readonly session = this.auth.session;

  constructor() {
    effect(() => {
      if (this.session().kind === 'signedOut') {
        void this.router.navigateByUrl('/login');
      }
    });
    // The snackbar sits above the bottom bar only while the shell shows one.
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      if (this.windowClass() === 'compact') {
        root.style.setProperty('--snackbar-bottom', 'calc(var(--nav-bar-height) + 16px)');
      } else {
        root.style.removeProperty('--snackbar-bottom');
      }
    });
    inject(DestroyRef).onDestroy(() => root.style.removeProperty('--snackbar-bottom'));
  }

  protected alertText(title: string): string {
    return this.strings().reminder.dueNow.replace('{title}', () => title);
  }

  protected openAlert(categoryId: string, itemId: string): void {
    this.reminder.dismiss();
    void this.router.navigate(['/c', categoryId, 'i', itemId]);
  }

  protected signOut(): Promise<void> {
    return this.signOutService.signOut();
  }
}
