import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/data/auth.service';
import { IconComponent } from './icon.component';
import { SignOutService } from './sign-out.service';
import { LanguageService } from './language.service';
import { LayoutService } from './layout.service';

@Component({
  selector: 'memo-account-menu',
  imports: [RouterLink, IconComponent],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class AccountMenuComponent {
  private readonly profile = inject(AuthService).profile;
  /** Defaults to the signed-in User; screens just place `<memo-account-menu />`. */
  protected readonly name = computed(() => this.profile()?.name ?? '');
  protected readonly email = computed(() => this.profile()?.email ?? '');
  readonly signOut = output<void>();
  private readonly signOutService = inject(SignOutService);
  protected readonly top = signal(0);
  protected readonly right = signal(8);

  protected readonly strings = inject(LanguageService).strings;
  protected readonly open = signal(false);
  protected readonly initial = computed(() => ([...(this.name().trim() || this.email())][0] ?? '').toUpperCase());
  private readonly avatar = viewChild.required<ElementRef<HTMLButtonElement>>('avatar');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const layout = inject(LayoutService);
    effect(() => {
      layout.windowClass();
      untracked(() => this.open.set(false));
    });
  }

  protected toggle(): void {
    const win = this.host.nativeElement.ownerDocument.defaultView;
    const r = this.avatar().nativeElement.getBoundingClientRect();
    this.top.set(r.bottom + 6);
    this.right.set(Math.max(8, (win?.innerWidth ?? r.right) - r.right));
    this.open.update((v) => !v);
  }

  protected onEscape(): void {
    if (this.open()) {
      this.open.set(false);
      this.avatar().nativeElement.focus();
    }
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected choseSignOut(): void {
    this.open.set(false);
    this.signOut.emit();
    void this.signOutService.signOut();
  }
}
