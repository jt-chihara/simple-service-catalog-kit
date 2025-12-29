import { expect, test } from '@playwright/test'

test.describe('Service Catalog App', () => {
  test('ページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/')

    // ヘッダーが表示される
    await expect(page.getByText('Simple Service Catalog Kit')).toBeVisible()

    // グラフエリアが表示される
    await expect(page.locator('.react-flow')).toBeVisible()
  })

  test('サービスノードが表示される', async ({ page }) => {
    await page.goto('/')

    // サービスノードが表示されるまで待機
    await expect(page.locator('.service-node').first()).toBeVisible({ timeout: 10000 })

    // 複数のノードが存在する
    const nodes = page.locator('.service-node')
    await expect(nodes).toHaveCount(await nodes.count())
    expect(await nodes.count()).toBeGreaterThan(0)
  })

  test('サービスをクリックすると詳細パネルが表示される', async ({ page }) => {
    await page.goto('/')

    // サービスノードが表示されるまで待機
    const firstNode = page.locator('.service-node').first()
    await expect(firstNode).toBeVisible({ timeout: 10000 })

    // サービス名を取得
    const serviceName = await firstNode.locator('.service-name').textContent()

    // クリック
    await firstNode.click()

    // 詳細パネルが表示される
    await expect(page.locator('.service-detail')).toBeVisible()
    await expect(page.locator('.service-detail h2')).toContainText(serviceName || '')
  })

  test('詳細パネルを閉じることができる', async ({ page }) => {
    await page.goto('/')

    // サービスノードをクリック
    const firstNode = page.locator('.service-node').first()
    await expect(firstNode).toBeVisible({ timeout: 10000 })
    await firstNode.click()

    // 詳細パネルが表示される
    await expect(page.locator('.service-detail')).toBeVisible()

    // 閉じるボタンをクリック
    await page.getByRole('button', { name: '閉じる' }).click()

    // 詳細パネルが非表示になる
    await expect(page.locator('.service-detail')).not.toBeVisible()
  })

  test('検索機能が動作する', async ({ page }) => {
    await page.goto('/')

    // 検索バーが表示されるまで待機
    const searchInput = page.getByPlaceholder('サービスを検索...')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    // 検索を実行
    await searchInput.fill('api')

    // 検索結果カウントが表示される
    await expect(page.locator('.search-result-count')).toBeVisible()
  })

  test('検索をクリアできる', async ({ page }) => {
    await page.goto('/')

    // 検索を実行
    const searchInput = page.getByPlaceholder('サービスを検索...')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await searchInput.fill('test')

    // クリアボタンが表示される
    const clearButton = page.getByRole('button', { name: 'クリア' })
    await expect(clearButton).toBeVisible()

    // クリア
    await clearButton.click()

    // 検索入力がクリアされる
    await expect(searchInput).toHaveValue('')
  })

  test('React Flowのコントロールが表示される', async ({ page }) => {
    await page.goto('/')

    // コントロールが表示される
    await expect(page.locator('.react-flow__controls')).toBeVisible({ timeout: 10000 })
  })

  test('詳細パネルから依存サービスに遷移できる', async ({ page }) => {
    await page.goto('/')

    // 依存関係があるサービスを探す
    const nodes = page.locator('.service-node')
    await expect(nodes.first()).toBeVisible({ timeout: 10000 })

    // 最初のノードをクリック
    await nodes.first().click()

    // 詳細パネルが表示される
    await expect(page.locator('.service-detail')).toBeVisible()

    // 依存先リストにサービスがあればクリック
    const dependencyButton = page.locator('.service-detail .service-list button').first()
    if (await dependencyButton.isVisible()) {
      const depName = await dependencyButton.textContent()
      await dependencyButton.click()

      // 詳細パネルのタイトルが変わる
      await expect(page.locator('.service-detail h2')).toContainText(depName || '')
    }
  })
})
