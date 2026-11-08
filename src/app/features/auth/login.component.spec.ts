import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthBackend } from '../../core/data/auth-backend';
import { LoginComponent } from './login.component';

class FakeBackend extends AuthBackend {
  calls: [string, string][] = [];
  error: { code: string } | null = null;
  onChange() {
    return () => undefined;
  }
  async signIn(email: string, pw: string) {
    this.calls.push([email, pw]);
    if (this.error) {
      throw this.error;
    }
    return 'u1';
  }
  async signOut() {
    return;
  }
}

describe('LoginComponent', () => {
  let backend: FakeBackend;
  let root: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>;

  const fill = (email: string, pw: string) => {
    (root.querySelector('#email') as HTMLInputElement).value = email;
    (root.querySelector('#pwd') as HTMLInputElement).value = pw;
  };
  const submit = async () => {
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    backend = new FakeBackend();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthBackend, useValue: backend }],
    });
    fixture = TestBed.createComponent(LoginComponent);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('toggles Show/Hide on the password field', async () => {
    const pwd = root.querySelector('#pwd') as HTMLInputElement;
    const btn = root.querySelector('.text-btn') as HTMLButtonElement;
    expect(pwd.type).toBe('password');
    expect(btn.textContent?.trim()).toBe('Show');
    btn.click();
    await fixture.whenStable();
    expect(pwd.type).toBe('text');
    expect(btn.textContent?.trim()).toBe('Hide');
  });

  it('has no registration, reset or keep-signed-in controls', () => {
    expect(root.querySelectorAll('a').length).toBe(0);
    expect(root.querySelectorAll('input[type=checkbox]').length).toBe(0);
  });

  it('signs in and navigates to /categories', async () => {
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fill(' a@b.c ', 'pw');
    await submit();
    expect(backend.calls).toEqual([['a@b.c', 'pw']]);
    expect(nav).toHaveBeenCalledWith('/categories');
  });

  it('shows a mapped inline error and does not navigate', async () => {
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    backend.error = { code: 'auth/invalid-credential' };
    fill('a@b.c', 'bad');
    await submit();
    const alert = root.querySelector('[role=alert]');
    expect(alert?.textContent).toContain('Email or password is not correct.');
    expect(nav).not.toHaveBeenCalled();
  });
});
