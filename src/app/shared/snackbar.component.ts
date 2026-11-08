import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SnackbarService } from './snackbar.service';

/** The single polite live region; the element stays in the DOM so announcements work. */
@Component({
  selector: 'memo-snackbar',
  template: `
    <div class="live" role="status" aria-live="polite" aria-atomic="true">
      @if (snackbar.message(); as text) {
        <p class="snack snackbar show">
          <span class="snack-text">{{ text }}</span>
          @if (snackbar.action(); as action) {
            <button type="button" class="snack-action" (click)="snackbar.runAction()">{{ action.label }}</button>
          }
        </p>
      }
    </div>
  `,
  styles: `
    /* Look and animation come from the global .snackbar; only the offset above the navbar is local. */
    .snack {
      margin: 0;
      bottom: var(--snackbar-bottom, 24px);
    }
    .snack-text {
      flex: 1;
    }
    .snack-action {
      min-height: var(--target);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarComponent {
  protected readonly snackbar = inject(SnackbarService);
}
