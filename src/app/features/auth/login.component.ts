import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/data/auth.service';
import type { AuthErrorCode } from '../../domain/session';
import { IconComponent } from '../../shared/icon.component';
import { LanguageService } from '../../shared/language.service';
import type { Language } from '../../shared/strings';

@Component({
  selector: 'memo-login',
  imports: [IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);
  protected readonly strings = this.lang.strings;
  protected readonly language = this.lang.language;
  protected readonly busy = this.auth.busy;
  protected readonly showPassword = signal(false);
  protected readonly error = signal<AuthErrorCode | null>(null);

  protected setLanguage(l: Language): void {
    this.lang.language.set(l);
    try {
      localStorage.setItem('memoit.language', l);
    } catch {
      /* the mirror is optional */
    }
  }

  protected toggleShow(): void {
    this.showPassword.update((v) => !v);
  }

  protected async submit(event: Event, email: string, password: string): Promise<void> {
    event.preventDefault();
    if (this.busy()) {
      return;
    }
    this.error.set(null);
    const result = await this.auth.signIn(email.trim(), password);
    if (result.ok) {
      await this.router.navigateByUrl('/categories');
    } else {
      this.error.set(result.error);
    }
  }
}
