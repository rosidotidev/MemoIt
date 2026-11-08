import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addItem, clearFirestore, createCategory, createUser, openCategory, setDeadline, signIn } from './support';

test.beforeAll(clearFirestore);

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page, screen: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `axe violations on ${screen}`).toEqual([]);
}

/** A reportable Category with two Items (one with a Value and a Deadline), so every screen has content. */
async function seed(page: Page): Promise<void> {
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
    await setDeadline(p, Date.now() + 2 * 24 * 3600 * 1000);
  });
  await addItem(page, 'Tuesday', async (p) => {
    await p.getByLabel('Value').fill('81');
    await setDeadline(p, Date.now() - 24 * 3600 * 1000);
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test(`every screen has no AA violation (${scheme})`, async ({ page }) => {
      await page.goto('/#/login');
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expectNoViolations(page, 'login');

      await seed(page);
      await page.goto('/#/categories');
      await expect(page.locator('a.card', { hasText: 'Weight' })).toBeVisible();
      await expectNoViolations(page, 'categories');

      await page.getByRole('button', { name: 'New category' }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoViolations(page, 'new category dialog');
      await page.keyboard.press('Escape');

      await page.locator('button.avatar').click();
      await expectNoViolations(page, 'account menu');
      await page.keyboard.press('Escape');

      await openCategory(page, 'Weight');
      await expect(page.getByText('Monday')).toBeVisible();
      await expectNoViolations(page, 'items');

      await page.getByRole('button', { name: 'Sort items' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoViolations(page, 'sort sheet');
      await page.keyboard.press('Escape');

      await page.getByRole('link', { name: 'Add item' }).first().click();
      await expect(page.getByLabel('Title')).toBeVisible();
      await expectNoViolations(page, 'new item');

      await openCategory(page, 'Weight');
      await page.getByRole('link', { name: /Edit item: Monday/ }).click();
      await expect(page.getByLabel('Title')).toHaveValue('Monday');
      await expectNoViolations(page, 'edit item');
      await page.getByRole('button', { name: 'Delete item', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoViolations(page, 'delete dialog');
      await page.keyboard.press('Escape');

      await openCategory(page, 'Weight');
      await page.getByRole('button', { name: 'Category menu' }).click();
      await page.getByRole('link', { name: 'Category settings' }).click();
      await expect(page.getByRole('heading', { name: 'Category settings', level: 1 })).toBeVisible();
      await expectNoViolations(page, 'category settings');

      await page.goto('/#/report');
      await expect(page.getByRole('img', { name: /Weight/ })).toBeVisible();
      await expectNoViolations(page, 'report');
      await page.locator('details summary').click();
      await expectNoViolations(page, 'report table');

      await page.goto('/#/settings');
      await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
      await expectNoViolations(page, 'settings');
    });
  });
}

test.describe('accessibility floor', () => {
  test('targets, rows, focus, motion and reflow', async ({ page }) => {
    await seed(page);

    // 72 px rows: Category cards and Item rows.
    await page.goto('/#/categories');
    const card = page.locator('a.card').first();
    await expect(card).toBeVisible();
    expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(72);

    // 48 px targets on the main screens.
    const small = async (screen: string): Promise<string[]> =>
      page.evaluate((name) => {
        const out: string[] = [];
        const sel = 'button, a[href], [role="switch"], select, input:not([type="hidden"]), summary';
        for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || style.visibility === 'hidden') {
            continue;
          }
          if (el.tabIndex < 0 && el.classList.contains('scrim')) {
            continue;
          }
          if (r.width < 47.5 || r.height < 47.5) {
            out.push(`${name}: ${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        }
        return out;
      }, screen);

    const tooSmall: string[] = [];
    tooSmall.push(...(await small('categories')));
    await openCategory(page, 'Weight');
    await expect(page.getByText('Monday')).toBeVisible();
    tooSmall.push(...(await small('items')));
    const row = page.locator('li.row').first();
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(72);
    await page.getByRole('link', { name: 'Add item' }).first().click();
    await expect(page.getByLabel('Title')).toBeVisible();
    tooSmall.push(...(await small('new item')));
    await page.goto('/#/report');
    await expect(page.getByRole('img', { name: /Weight/ })).toBeVisible();
    tooSmall.push(...(await small('report')));
    await page.goto('/#/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    tooSmall.push(...(await small('settings')));
    expect(tooSmall).toEqual([]);
  });

  test('dialogs and the account menu trap and restore focus, Escape closes them', async ({ page }) => {
    await seed(page);
    await page.goto('/#/categories');

    // New category dialog.
    const fab = page.getByRole('button', { name: 'New category' }).first();
    await fab.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(fab).toBeFocused();

    // Confirm dialog (delete an Item).
    await openCategory(page, 'Weight');
    await page.getByRole('link', { name: /Edit item: Monday/ }).click();
    const del = page.getByRole('button', { name: 'Delete item', exact: true });
    await del.click();
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(del).toBeFocused();

    // Account menu: Escape closes and returns focus to the avatar.
    const avatar = page.locator('button.avatar');
    await avatar.click();
    await expect(page.locator('#account-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#account-menu')).toHaveCount(0);
    await expect(avatar).toBeFocused();
  });

  test('reduced motion is honored', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page);
    await page.goto('/#/categories');
    const offenders = await page.evaluate(() => {
      const ms = (v: string) => v.split(',').every((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000) <= 1);
      return Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const s = getComputedStyle(el);
          return !ms(s.animationDuration) || !ms(s.transitionDuration);
        })
        .map((el) => el.tagName.toLowerCase() + '.' + el.className);
    });
    expect(offenders).toEqual([]);
  });

  test('the layout reflows at 200% text without horizontal scrolling', async ({ page }) => {
    await seed(page);
    // 200% zoom on a 640 px window is the 320 px reflow width of WCAG 1.4.10.
    await page.setViewportSize({ width: 640, height: 900 });
    for (const path of ['/#/categories', '/#/settings', '/#/report']) {
      await page.goto(path);
      await page.addStyleTag({ content: 'html { zoom: 2; }' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
