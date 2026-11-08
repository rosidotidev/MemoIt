import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ConfirmDialogComponent>>;
  let el: HTMLElement;
  let opener: HTMLButtonElement;
  let confirmed = 0;
  let cancelled = 0;

  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
  };

  beforeEach(async () => {
    confirmed = 0;
    cancelled = 0;
    opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('heading', 'Delete item?');
    fixture.componentRef.setInput('body', 'Milk will be deleted. This cannot be undone.');
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.componentRef.setInput('cancelLabel', 'Cancel');
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    await settle();
  });

  afterEach(() => {
    el.remove();
    opener.remove();
  });

  const dialog = () => el.querySelector('[role=dialog]')!;
  const press = (key: string, shiftKey = false) => {
    const e = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    dialog().dispatchEvent(e);
    return e;
  };

  it('is modal, shows the heading and body, and focuses Cancel', () => {
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(el.querySelector('h2')!.textContent).toContain('Delete item?');
    expect(el.textContent).toContain('This cannot be undone.');
    expect(document.activeElement).toBe(el.querySelector('button.text'));
  });

  it('emits confirmed from the destructive button', () => {
    el.querySelector<HTMLButtonElement>('button.destructive')!.click();
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(0);
  });

  it('cancels on Escape, Cancel and the scrim', () => {
    press('Escape');
    el.querySelector<HTMLButtonElement>('button.text')!.click();
    el.querySelector<HTMLButtonElement>('button.scrim')!.click();
    expect(cancelled).toBe(3);
    expect(confirmed).toBe(0);
  });

  it('traps Tab and Shift+Tab inside the dialog', () => {
    const cancel = el.querySelector<HTMLButtonElement>('button.text')!;
    const confirm = el.querySelector<HTMLButtonElement>('button.destructive')!;
    confirm.focus();
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(cancel);
    expect(press('Tab', true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(confirm);
  });

  it('ignores every dismissal and confirm while busy', async () => {
    fixture.componentRef.setInput('busy', true);
    await settle();
    press('Escape');
    el.querySelector<HTMLButtonElement>('button.scrim')!.click();
    el.querySelector<HTMLButtonElement>('button.text')!.click();
    el.querySelector<HTMLButtonElement>('button.destructive')!.click();
    expect(cancelled).toBe(0);
    expect(confirmed).toBe(0);
  });

  it('restores focus to the opener when destroyed', () => {
    expect(document.activeElement).not.toBe(opener);
    fixture.destroy();
    expect(document.activeElement).toBe(opener);
  });
});
