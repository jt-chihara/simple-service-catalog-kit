import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorDisplay } from '../../src/components/ErrorDisplay'

describe('ErrorDisplay', () => {
  it('エラーがない場合は何も表示しない', () => {
    const { container } = render(<ErrorDisplay errors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('単一のエラーを表示する', () => {
    const errors = [{ fileName: 'test-service.yml', error: 'YAMLパースエラー' }]
    render(<ErrorDisplay errors={errors} />)

    expect(screen.getByText('test-service.yml')).toBeInTheDocument()
    expect(screen.getByText('YAMLパースエラー')).toBeInTheDocument()
  })

  it('複数のエラーを表示する', () => {
    const errors = [
      { fileName: 'service-a.yml', error: 'description: 必須フィールドです' },
      { fileName: 'service-b.yml', error: 'github: 無効なURL形式です' },
    ]
    render(<ErrorDisplay errors={errors} />)

    expect(screen.getByText('service-a.yml')).toBeInTheDocument()
    expect(screen.getByText('description: 必須フィールドです')).toBeInTheDocument()
    expect(screen.getByText('service-b.yml')).toBeInTheDocument()
    expect(screen.getByText('github: 無効なURL形式です')).toBeInTheDocument()
  })

  it('ファイル名が空の場合は「一般エラー」と表示する', () => {
    const errors = [{ fileName: '', error: '不明なエラーが発生しました' }]
    render(<ErrorDisplay errors={errors} />)

    expect(screen.getByText('一般エラー')).toBeInTheDocument()
    expect(screen.getByText('不明なエラーが発生しました')).toBeInTheDocument()
  })

  it('エラーセクションにはアクセシブルな見出しがある', () => {
    const errors = [{ fileName: 'test.yml', error: 'テストエラー' }]
    render(<ErrorDisplay errors={errors} />)

    expect(screen.getByRole('heading', { name: /エラー/i })).toBeInTheDocument()
  })

  it('各エラーはリストアイテムとして表示される', () => {
    const errors = [
      { fileName: 'a.yml', error: 'エラー1' },
      { fileName: 'b.yml', error: 'エラー2' },
    ]
    render(<ErrorDisplay errors={errors} />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
  })
})
