import { AccountMenuComponent } from '../../shared/account-menu.component';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { AuthService } from '../../core/data/auth.service';
import type { Appearance, Scheme } from '../../domain/preferences';
import { IconComponent, type IconName } from '../../shared/icon.component';
import { PreferencesStore } from '../../shared/preferences.store';
import { LanguageService } from '../../shared/language.service';
import type { Language } from '../../shared/strings';
import { ACCENT_PRESETS, CHROMA_MAX, HUE_MAX, accentOf, tone } from '../../shared/theme';

@Component({
  selector: 'memo-settings',
  imports: [AccountMenuComponent, IconComponent],
  template: `
    <header class="appbar">
      <div class="appbar__row"><h1 class="appbar__title">{{ strings().settings.title }}</h1><memo-account-menu /></div>
    </header>
    <div class="shell__content shell__content--wide">
      <section class="head-card">
        <span class="avatar avatar--round who-avatar" aria-hidden="true">{{ initial() }}</span>
        <div class="head-card__body">
          <h2>{{ profile()?.name || profile()?.email }}</h2>
          @if (profile()?.name) {
            <p class="body-md muted who-email">{{ profile()?.email }}</p>
          }
        </div>
      </section>

      <div class="cols cols--2 grid">
        <div>
          <section class="panel" aria-labelledby="th-t">
            <h3 id="th-t">{{ strings().settings.accentLabel }}</h3>
            <p class="body-md muted hint">{{ strings().settings.accentHint }}</p>
            <div role="radiogroup" class="swatches" [attr.aria-label]="strings().settings.accentLabel">
              @for (s of swatches(); track s.id) {
                <button
                  type="button"
                  role="radio"
                  class="swatch"
                  [attr.aria-label]="s.label"
                  [attr.aria-pressed]="appearance().accent === s.id"
                  [attr.aria-checked]="appearance().accent === s.id"
                  (click)="chooseAccent(s.id)"
                >
                  <span class="swatch__dot" [style.background]="s.color"><memo-icon name="check" /></span>{{ s.label }}
                </button>
              }
            </div>
            <h4 class="label-lg hue-h">{{ strings().settings.hueLabel }}</h4>
            <input
              class="hue"
              type="range"
              min="0"
              [max]="hueMax"
              step="1"
              [attr.aria-label]="strings().settings.hueLabel"
              [value]="custom().hue"
              (input)="onSlide('hue', $event, false)"
              (change)="onSlide('hue', $event, true)"
            />
            @if (isCustom()) {
              <label class="slider">
                <span class="label-lg">{{ strings().settings.chromaLabel }}</span>
                <input
                  class="chroma"
                  type="range"
                  min="0"
                  [max]="chromaMax"
                  step="0.005"
                  [value]="custom().chroma"
                  (input)="onSlide('chroma', $event, false)"
                  (change)="onSlide('chroma', $event, true)"
                />
              </label>
            }
          </section>

          <section class="panel" aria-labelledby="ap-t">
            <h3 id="ap-t">{{ strings().settings.appearanceLabel }}</h3>
            <div role="radiogroup" class="segmented" [attr.aria-label]="strings().settings.appearanceLabel">
              @for (opt of schemes(); track opt.value) {
                <button
                  type="button"
                  role="radio"
                  class="seg"
                  [attr.aria-pressed]="appearance().scheme === opt.value"
                  [attr.aria-checked]="appearance().scheme === opt.value"
                  (click)="chooseScheme(opt.value)"
                >
                  <memo-icon [name]="opt.icon" />{{ opt.label }}
                </button>
              }
            </div>
          </section>

          <section class="panel" aria-labelledby="lg-t">
            <h3 id="lg-t">{{ strings().settings.languageLabel }}</h3>
            <div role="radiogroup" class="segmented" [attr.aria-label]="strings().settings.languageLabel">
              @for (opt of options(); track opt.value) {
                <button
                  type="button"
                  role="radio"
                  class="seg"
                  [attr.aria-pressed]="language() === opt.value"
                  [attr.aria-checked]="language() === opt.value"
                  (click)="choose(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
            <p class="body-md muted hint2">{{ strings().settings.languageHint }}</p>
          </section>
        </div>

        <aside class="sticky">
          <section class="panel" [attr.aria-label]="strings().settings.previewLabel">
            <h3>{{ strings().settings.previewLabel }}</h3>
            <div class="mini" aria-hidden="true">
              <div class="mini__bar">
                <span class="grow">{{ strings().settings.previewTitle }}</span>
                <span class="chip chip--sel pv-chip">{{ strings().settings.previewChip }}</span>
              </div>
              <div class="mini__body">
                <div class="row item pv-row">
                  <span class="check"></span>
                  <span class="row__body"><span class="row__title title-md">{{ strings().settings.previewSamples[0] }}</span><br /><span class="row__sub">{{ strings().settings.previewSamples[1] }}</span></span>
                </div>
                <div class="row item pv-row">
                  <span class="check"></span>
                  <span class="row__body"
                    ><span class="row__title title-md">{{ strings().settings.previewSamples[2] }}</span
                    ><span class="chips pv-chips"><span class="chip chip--overdue">{{ strings().settings.previewSamples[3] }}</span><span class="chip chip--high">{{ strings().settings.previewSamples[4] }}</span></span></span
                  >
                </div>
                <div class="row item is-done pv-row">
                  <span class="check"><memo-icon name="check" /></span>
                  <span class="row__body"><span class="row__title title-md">{{ strings().settings.previewSamples[5] }}</span></span>
                </div>
              </div>
              <div class="mini__fab"><memo-icon name="add" /></div>
              <div class="mini__nav"><i class="on"></i><i></i><i></i></div>
            </div>
            <div class="btns" aria-hidden="true">
              <span class="btn btn--filled">{{ strings().settings.btnFilled }}</span>
              <span class="btn btn--tonal">{{ strings().settings.btnTonal }}</span>
              <span class="btn btn--outlined">{{ strings().settings.btnOutlined }}</span>
            </div>
            <div class="roles" aria-hidden="true">
              <div class="r1">{{ strings().settings.roles[0] }}</div>
              <div class="r2">{{ strings().settings.roles[1] }}</div>
              <div class="r3">{{ strings().settings.roles[2] }}</div>
              <div class="r4">{{ strings().settings.roles[3] }}</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: `
    .who-avatar { width: 56px; height: 56px; font-size: 22px; }
    .who-email { margin: 2px 0 0; }
    .head-card { margin-top: 8px; }
    .grid { margin-top: 16px; }
    .hint { margin: -8px 0 16px; }
    .hint2 { margin: 12px 0 0; }
    button.swatch { cursor: pointer; background: transparent; border: 0; font: inherit; font-size: 12px; }
    .hue-h { margin: 20px 0 12px; color: var(--on-surface-variant); }
    .sliders { display: grid; gap: 8px; margin-top: 20px; }
    .slider { display: grid; grid-template-columns: 96px 1fr; align-items: center; min-height: var(--target); gap: 12px; color: var(--on-surface-variant); }
    .slider input { width: 100%; accent-color: var(--primary); }
    .seg { cursor: pointer; background: transparent; border-top: 0; border-right: 0; border-bottom: 0; font: inherit; font-size: 14px; font-weight: 500; }
    .seg:first-child { border-left: 0; }
    .mini { position: relative; }
    .grow { flex: 1; }
    .pv-chip { height: 24px; }
    .mini__body { padding: 0 8px 72px; }
    .pv-chips { margin-top: 4px; }
    .pv-row { min-height: 60px; padding: 8px; }
    .mini__nav { position: absolute; left: 0; right: 0; bottom: 0; }
    .btns { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
    .r1 { background: var(--primary); color: var(--on-primary); }
    .r2 { background: var(--primary-container); color: var(--on-primary-container); }
    .r3 { background: var(--secondary-container); color: var(--on-secondary-container); }
    .r4 { background: var(--tertiary-container); color: var(--on-tertiary-container); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly lang = inject(LanguageService);
  private readonly store = inject(PreferencesStore);
  protected readonly profile = inject(AuthService).profile;
  protected readonly initial = computed(
    () => ([...(this.profile()?.name?.trim() || this.profile()?.email || '')][0] ?? '').toUpperCase(),
  );
  protected readonly strings = this.lang.strings;
  protected readonly language = this.lang.language;
  protected readonly appearance = this.store.appearance;
  protected readonly hueMax = HUE_MAX;
  protected readonly chromaMax = CHROMA_MAX;

  constructor() {
    // leaving mid-drag must not keep an unsaved preview on screen
    inject(DestroyRef).onDestroy(() => this.store.revertPreview());
  }

  protected readonly isCustom = computed(() => this.appearance().accent === 'custom');
  protected readonly custom = computed(() => accentOf(this.appearance()));
  protected readonly customColor = computed(() => tone(this.custom().hue, this.custom().chroma, 60));
  protected readonly swatches = computed(() =>
    ACCENT_PRESETS.map((p) => ({
      id: p.id,
      color: tone(p.hue, p.chroma, 60),
      label: this.strings().settings.accents[p.id],
    })),
  );

  protected options(): { value: Language; label: string }[] {
    const s = this.strings().settings;
    return [
      { value: 'en', label: s.english },
      { value: 'it', label: s.italian },
    ];
  }

  protected schemes(): { value: Scheme; label: string; icon: IconName }[] {
    const s = this.strings().settings;
    return [
      { value: 'light', label: s.schemeLight, icon: 'sun' },
      { value: 'dark', label: s.schemeDark, icon: 'moon' },
      { value: 'system', label: s.schemeSystem, icon: 'auto' },
    ];
  }

  protected choose(l: Language): void {
    void this.store.setLanguage(l);
  }

  protected chooseScheme(scheme: Scheme): void {
    void this.store.setAppearance({ ...this.appearance(), scheme });
  }

  protected chooseAccent(accent: string): void {
    const scheme = this.appearance().scheme;
    if (accent === 'custom') {
      const { hue, chroma } = this.custom();
      void this.store.setAppearance({ accent, hue, chroma, scheme });
    } else {
      void this.store.setAppearance({ accent, scheme });
    }
  }

  /** The slider previews live on `input` and saves on `change` (release). */
  protected onSlide(which: 'hue' | 'chroma', event: Event, save: boolean): void {
    const value = Number((event.target as HTMLInputElement).value);
    const { hue, chroma } = this.custom();
    const next: Appearance = {
      accent: 'custom',
      hue: which === 'hue' ? value : hue,
      chroma: which === 'chroma' ? value : chroma,
      scheme: this.appearance().scheme,
    };
    if (save) {
      void this.store.setAppearance(next);
    } else {
      this.store.previewAppearance(next);
    }
  }
}
