import { expect, type Page } from '@playwright/test';

const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = 'http://127.0.0.1:8080';
const PROJECT = 'demo-memoit';
const PASSWORD = 'e2e-password-1';

let counter = 0;

export interface TestUser {
  readonly email: string;
  readonly password: string;
}

/** Creates a fresh User in the Auth emulator (the app has no sign-up). Only ever talks to the emulator. */
export async function createUser(): Promise<TestUser> {
  counter += 1;
  const email = `bob${Date.now()}${counter}@example.test`;
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, displayName: 'Bob' }),
  });
  if (!res.ok) {
    throw new Error(`Auth emulator signUp failed: ${res.status}`);
  }
  return { email, password: PASSWORD };
}

/** Wipes every document in the Firestore emulator. */
export async function clearFirestore(): Promise<void> {
  const res = await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Firestore emulator clear failed: ${res.status}`);
  }
}

export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/#/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible();
}

export async function createCategory(page: Page, name: string): Promise<void> {
  await page.goto('/#/categories');
  await page.getByRole('button', { name: 'New category' }).first().click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name })).toBeVisible();
}

export async function openCategory(page: Page, name: string): Promise<void> {
  await page.goto('/#/categories');
  await page.getByRole('link', { name }).first().click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

/** Adds an Item from the Category screen; `before` runs (deadline, value) ahead of Save. */
export async function addItem(page: Page, title: string, before?: (page: Page) => Promise<void>): Promise<void> {
  await page.getByRole('link', { name: 'Add item' }).first().click();
  await page.getByLabel('Title').fill(title);
  if (before) {
    await before(page);
  }
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Items', level: 2 })).toBeVisible();
}

/** Local `YYYY-MM-DDTHH:mm` for a datetime-local input. */
export function localInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function setDeadline(page: Page, ms: number): Promise<void> {
  const input = page.getByLabel('Date and time');
  await input.fill(localInput(ms));
  await input.dispatchEvent('change');
}
