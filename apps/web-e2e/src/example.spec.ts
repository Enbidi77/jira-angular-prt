import { test, expect } from '@playwright/test';

test.describe('Kite Project Management Platform', () => {
  test('should navigate to workspaces dashboard', async ({ page }) => {
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toContainText('Workspaces & Projects');
  });

  test('should open kanban board and display columns', async ({ page }) => {
    await page.goto('/project/b0000000-0000-0000-0000-000000000001/board');
    await expect(page.locator('text=Kanban')).toBeVisible();
    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('should navigate to backlog and sprints view', async ({ page }) => {
    await page.goto('/project/b0000000-0000-0000-0000-000000000001/backlog');
    await expect(page.locator('h1')).toContainText('Backlog & Sprints');
    await expect(page.locator('text=+ Create Sprint')).toBeVisible();
  });

  test('should navigate to reports and velocity dashboard', async ({
    page,
  }) => {
    await page.goto('/project/b0000000-0000-0000-0000-000000000001/reports');
    await expect(page.locator('h1')).toContainText(
      'Project Reports & Analytics',
    );
    await expect(page.locator('text=Total Issues')).toBeVisible();
  });
});
