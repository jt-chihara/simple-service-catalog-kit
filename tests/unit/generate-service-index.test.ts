import { describe, expect, it } from 'vitest'
import {
  generateIndex,
  getServiceFiles,
} from '../../scripts/generate-service-index'

describe('getServiceFiles', () => {
  it('YAMLファイルのみを抽出する', () => {
    const files = ['user-service.yml', 'api-gateway.yml', 'README.md', 'config.json']
    const result = getServiceFiles(files)
    expect(result).toEqual(['api-gateway.yml', 'user-service.yml'])
  })

  it('.yamlと.ymlの両方をサポート', () => {
    const files = ['service-a.yml', 'service-b.yaml']
    const result = getServiceFiles(files)
    expect(result).toEqual(['service-a.yml', 'service-b.yaml'])
  })

  it('空配列を処理', () => {
    const result = getServiceFiles([])
    expect(result).toEqual([])
  })

  it('ソートされた順序で返す', () => {
    const files = ['z-service.yml', 'a-service.yml', 'm-service.yml']
    const result = getServiceFiles(files)
    expect(result).toEqual(['a-service.yml', 'm-service.yml', 'z-service.yml'])
  })
})

describe('generateIndex', () => {
  it('JSONインデックスを生成する', () => {
    const files = ['user-service.yml', 'api-gateway.yml']
    const result = generateIndex(files)
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({
      services: ['user-service.yml', 'api-gateway.yml'],
    })
  })

  it('空配列でも正しく生成する', () => {
    const result = generateIndex([])
    const parsed = JSON.parse(result)
    expect(parsed).toEqual({ services: [] })
  })

  it('整形されたJSONを出力する', () => {
    const files = ['service.yml']
    const result = generateIndex(files)
    expect(result).toContain('\n')
  })
})
