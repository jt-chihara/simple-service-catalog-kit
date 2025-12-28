import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchBar } from '../../src/components/Search/SearchBar'

describe('SearchBar', () => {
  it('検索ボックスに入力できる', () => {
    const onSearch = vi.fn()
    render(<SearchBar value="" onChange={onSearch} matchedCount={0} relatedCount={0} />)

    const input = screen.getByPlaceholderText(/検索/i)
    fireEvent.change(input, { target: { value: 'user' } })

    expect(onSearch).toHaveBeenCalledWith('user')
  })

  it('マッチ件数が表示される', () => {
    render(<SearchBar value="user" onChange={() => {}} matchedCount={1} relatedCount={2} />)

    expect(screen.getByText('1件')).toBeInTheDocument()
  })

  it('関連件数が表示される', () => {
    render(<SearchBar value="user" onChange={() => {}} matchedCount={1} relatedCount={2} />)

    expect(screen.getByText('（関連: 2件）')).toBeInTheDocument()
  })

  it('関連件数が0の場合は表示されない', () => {
    render(<SearchBar value="user" onChange={() => {}} matchedCount={1} relatedCount={0} />)

    expect(screen.queryByText(/関連/)).not.toBeInTheDocument()
  })

  it('クリアボタンで検索をクリアできる', () => {
    const onSearch = vi.fn()
    render(<SearchBar value="user" onChange={onSearch} matchedCount={1} relatedCount={2} />)

    const clearButton = screen.getByRole('button', { name: /クリア/i })
    fireEvent.click(clearButton)

    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('検索値が空の場合はクリアボタンが表示されない', () => {
    render(<SearchBar value="" onChange={() => {}} matchedCount={0} relatedCount={0} />)

    expect(screen.queryByRole('button', { name: /クリア/i })).not.toBeInTheDocument()
  })

  it('検索値が空の場合は結果カウントが表示されない', () => {
    render(<SearchBar value="" onChange={() => {}} matchedCount={0} relatedCount={0} />)

    expect(screen.queryByText('0件')).not.toBeInTheDocument()
  })
})
