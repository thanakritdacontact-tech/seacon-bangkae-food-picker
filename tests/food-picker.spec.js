const { test, expect } = require('@playwright/test');

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
}

test('search, filters, quick pick, and responsive layout', async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.shop')).toHaveCount(111);
    await expectNoOverflow(page);
  }

  await expect(page.getByRole('button', { name: 'เครื่องดื่ม', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'เครื่องดื่มและคาเฟ่', exact: true })).toHaveCount(1);

  await page.locator('#search').fill('SUSHIRO');
  await expect(page.locator('.shop')).toHaveCount(1);
  await expect(page.locator('.shop h3')).toContainText('SUSHIRO');

  for (const name of ['BEARHOUSE', 'FUKU MATCHA', 'MIXUE', 'Inthanin', 'YODCHA', 'Kita Tea Stand']) {
    await page.locator('#search').fill(name);
    await expect(page.locator('.shop')).toHaveCount(1);
    await expect(page.locator('.shop .tag').first()).toHaveText('เครื่องดื่มและคาเฟ่');
  }
  for (const name of ['Bun', 'Dunkin', 'โดเช่ (Dolce Gelatino)']) {
    await page.locator('#search').fill(name);
    await expect(page.locator('.shop')).toHaveCount(1);
    await expect(page.locator('.shop .tag').first()).toHaveText('ขนมและเบเกอรี');
  }
  await page.locator('#search').fill('MUJI');
  await expect(page.locator('.shop')).toHaveCount(0);

  await page.locator('#search').fill('ตำตำ');
  await expect(page.locator('.shop')).toHaveCount(1);
  await expect(page.locator('.shop .detail')).toHaveAttribute('href', /wongnai\.com\/restaurants\/146789IE/);
  await expect(page.locator('.shop img')).toHaveAttribute('src', /\/assets\/tamtam-wongnai\.jpg$/);

  await page.locator('#search').fill('Mungkornbin');
  await expect(page.locator('.shop')).toHaveCount(1);
  await expect(page.locator('.shop .detail')).toHaveAttribute('href', 'https://maps.app.goo.gl/DhRgaPBapmjbCw7aA');
  await expect(page.locator('.shop img')).toHaveAttribute('src', /AHRPTWk1XUg2RIe5HQIup0_IsvxiLIv/);

  await page.locator('#search').fill('Dairy Queen');
  await expect(page.locator('.shop')).toHaveCount(1);
  await expect(page.locator('.shop .detail')).toHaveAttribute('href', 'https://maps.app.goo.gl/8a5VN76oJT6SmFBF6');

  await page.locator('#search').fill('โอ้กะจู๋');
  await expect(page.locator('.shop .detail')).toHaveAttribute('href', 'https://maps.app.goo.gl/mzFZvAK3MmrsiNCaA');

  await page.locator('#search').fill('Grainey');
  await expect(page.locator('.shop .detail')).toHaveAttribute('href', 'https://grainey.com/soft-cookie-shop/');
  await page.locator('#search').fill('');

  await page.locator('#floor').selectOption('B');
  await expect(page.locator('.shop')).not.toHaveCount(0);
  await expect(page.locator('.floor-badge').first()).toHaveText('BF');
  await page.locator('#floor').selectOption('all');

  await page.getByRole('button', { name: 'อาหารญี่ปุ่น', exact: true }).click();
  await expect(page.locator('.shop')).not.toHaveCount(0);
  await expect(page.locator('.tag').first()).toHaveText('อาหารญี่ปุ่น');

  await page.locator('#quick').click();
  await expect(page.locator('#randomDialog')).toBeVisible();
  await expect(page.locator('#randomWinner h2')).toBeVisible();
  await page.locator('#randomDialog .close-action').click();
  await expect(page.locator('#randomDialog')).not.toBeVisible();
});

test('wheel spins, repeats, and cancels safely', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 5; i += 1) await page.locator('.pick').nth(i).click();
  await expect(page.locator('#selectedCount')).toHaveText('5');
  await page.locator('.pick').nth(5).click();
  await expect(page.locator('#selectedCount')).toHaveText('5');
  await expect(page.locator('#openWheel')).toBeEnabled();
  await page.locator('#openWheel').click();
  await page.locator('#spin').click();
  await expect(page.locator('#winner a')).toBeVisible({ timeout: 6_000 });
  await page.locator('#spin').click();
  await expect(page.locator('#winner a')).toBeVisible({ timeout: 6_000 });

  await page.locator('#spin').click();
  await page.waitForTimeout(120);
  await page.locator('#wheelDialog .close').click();
  await expect(page.locator('#wheelDialog')).not.toBeVisible();
  await page.locator('#openWheel').click();
  await expect(page.locator('#spin')).toBeEnabled();
});

test('reduced motion keeps a visible spin and winner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.pick').nth(0).click();
  await page.locator('.pick').nth(1).click();
  await page.locator('#openWheel').click();
  const started = Date.now();
  await page.locator('#spin').click();
  await expect(page.locator('#winner a')).toBeVisible({ timeout: 3_000 });
  expect(Date.now() - started).toBeGreaterThanOrEqual(500);
});

test('all restaurant images either load or reveal the fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  });
  await page.waitForTimeout(2_000);
  const result = await page.evaluate(() => {
    const images = [...document.querySelectorAll('.image img')];
    return {
      total: images.length,
      uncoveredBroken: images.filter((img) => img.complete && img.naturalWidth === 0 && !img.hidden).length,
      fallbackNames: images.filter((img) => img.hidden).filter((img) => !img.parentElement.querySelector('.fallback')?.textContent.trim()).length,
    };
  });
  expect(result.total).toBe(111);
  expect(result.uncoveredBroken).toBe(0);
  expect(result.fallbackNames).toBe(0);
});

test('closed records never render', async ({ page }) => {
  await page.goto('/');
  const closedNames = await page.evaluate(async () => {
    const text = await fetch('restaurants.csv').then((response) => response.text());
    return text.split('\n').filter((line) => line.includes(',closed,')).map((line) => line.split(',')[1]);
  });
  expect(closedNames.length).toBe(1);
  for (const name of closedNames) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  const needsReviewCount = await page.evaluate(async () => {
    const text = await fetch('restaurants.csv').then((response) => response.text());
    return text.split('\n').filter((line) => line.includes(',needs-review,')).length;
  });
  expect(needsReviewCount).toBe(0);
});
