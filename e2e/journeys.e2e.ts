import { expect, test } from '@playwright/test';
import { addItem, clearFirestore, createCategory, createUser, openCategory, setDeadline, signIn } from './support';

test.beforeAll(clearFirestore);

test('UJ-1 capture an Item', async ({ page }) => {
  await signIn(page, await createUser());
  await createCategory(page, 'Groceries');
  await openCategory(page, 'Groceries');
  await addItem(page, 'Buy milk');
  await expect(page.getByText('Buy milk')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Buy milk')).toBeVisible();
});

test('UJ-2 tick Items, Undo, clear Done', async ({ page }) => {
  await signIn(page, await createUser());
  await createCategory(page, 'Chores');
  await openCategory(page, 'Chores');
  await addItem(page, 'Dishes');
  await addItem(page, 'Laundry');

  await page.getByRole('button', { name: /Dishes/ }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: /Dishes/ })).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: /Dishes/ }).click();
  await expect(page.getByRole('button', { name: /Dishes/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Category menu' }).click();
  await page.getByRole('link', { name: 'Category settings' }).click();
  await page.getByRole('button', { name: 'Clear done items' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Clear/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await openCategory(page, 'Chores');
  await expect(page.getByText('Dishes')).toHaveCount(0);
  await expect(page.getByText('Laundry')).toBeVisible();
});

test('UJ-3 overdue flag', async ({ page }) => {
  await signIn(page, await createUser());
  await createCategory(page, 'Bills');
  await openCategory(page, 'Bills');
  await addItem(page, 'Rent', (p) => setDeadline(p, Date.now() - 3 * 24 * 3600 * 1000));
  await expect(page.locator('.row-chip.overdue')).toBeVisible();
  await page.goto('/#/categories');
  await expect(page.getByRole('region', { name: 'Summary' }).locator('.headline')).toContainText('1');
  await expect(page.getByRole('region', { name: 'Due soon' }).getByText('Rent')).toBeVisible();
});

test('UJ-3 in-app Deadline alert when a Deadline arrives', async ({ page }) => {
  const user = await createUser();
  await page.clock.install({ time: Date.now() });
  await signIn(page, user);
  await createCategory(page, 'Calls');
  await openCategory(page, 'Calls');
  const due = Math.ceil((Date.now() + 90_000) / 60_000) * 60_000;
  await addItem(page, 'Call mum', (p) => setDeadline(p, due));
  await page.clock.fastForward(due - Date.now() + 20_000);
  await expect(page.locator('.alert')).toContainText('Call mum');
});

test('UJ-4 enter a Value and read the Report', async ({ page }) => {
  await signIn(page, await createUser());
  await createCategory(page, 'Weight');
  await openCategory(page, 'Weight');
  await page.getByRole('button', { name: 'Category menu' }).click();
  await page.getByRole('link', { name: 'Category settings' }).click();
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Changes saved')).toBeVisible();
  await openCategory(page, 'Weight');
  await addItem(page, 'Monday', async (p) => {
    await p.getByLabel('Value').fill('81.5');
  });
  await page.getByRole('link', { name: 'Report' }).first().click();
  await expect(page.getByRole('heading', { name: 'Report', level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: /Weight/ })).toBeVisible();
  await page.locator('details summary').click();
  await expect(page.locator('table')).toContainText('81.5');
});

test('UJ-5 a second User sees none of the first User data', async ({ browser }) => {
  const first = await createUser();
  const second = await createUser();

  const a = await browser.newContext();
  const b = await browser.newContext();
  try {
    const pageA = await a.newPage();
    await signIn(pageA, first);
    await createCategory(pageA, 'Secret plans');
    await openCategory(pageA, 'Secret plans');
    await addItem(pageA, 'Hidden item');

    const pageB = await b.newPage();
    await signIn(pageB, second);
    await expect(pageB.getByText('Secret plans')).toHaveCount(0);
    await expect(pageB.getByText('Nothing here yet')).toBeVisible();
    await pageB.goto('/#/report');
    await expect(pageB.getByText('Hidden item')).toHaveCount(0);
    // A deep link to the other User's Category falls back to Categories.
    await pageB.goto(pageA.url());
    await expect(pageB.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible();
    await expect(pageB.getByText('Hidden item')).toHaveCount(0);
    await expect(pageB.getByText('Secret plans')).toHaveCount(0);
  } finally {
    await a.close();
    await b.close();
  }
});
