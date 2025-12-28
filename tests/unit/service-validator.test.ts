import { describe, expect, it } from 'vitest'
import { validateGithubUrl, validateServiceName } from '../../src/utils/yaml-parser'

describe('validateGithubUrl', () => {
  it('有効なGitHub URLを受け入れる', () => {
    expect(validateGithubUrl('https://github.com/example/repo')).toBe(true)
    expect(validateGithubUrl('https://github.com/org/repo-name')).toBe(true)
    expect(validateGithubUrl('https://github.com/user/my_repo')).toBe(true)
  })

  it('無効なURLを拒否する', () => {
    expect(validateGithubUrl('https://gitlab.com/example/repo')).toBe(false)
    expect(validateGithubUrl('http://github.com/example/repo')).toBe(false) // httpはNG
    expect(validateGithubUrl('github.com/example/repo')).toBe(false) // プロトコルなし
    expect(validateGithubUrl('')).toBe(false)
  })
})

describe('validateServiceName', () => {
  it('有効なサービス名を受け入れる', () => {
    expect(validateServiceName('user-service')).toBe(true)
    expect(validateServiceName('api_gateway')).toBe(true)
    expect(validateServiceName('service123')).toBe(true)
    expect(validateServiceName('MyService')).toBe(true)
  })

  it('無効なサービス名を拒否する', () => {
    expect(validateServiceName('invalid service')).toBe(false) // スペース
    expect(validateServiceName('invalid!name')).toBe(false) // 特殊文字
    expect(validateServiceName('')).toBe(false) // 空
    expect(validateServiceName('a'.repeat(51))).toBe(false) // 長すぎる
  })
})
