import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnackbarComponent } from './shared/snackbar.component';
import { ThemeService } from './shared/theme.service';

@Component({
  imports: [RouterOutlet, SnackbarComponent],
  selector: 'memo-root',
  template: '<router-outlet /><memo-snackbar />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    inject(ThemeService); // applies the saved theme as soon as the app starts
  }
}
