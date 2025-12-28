# サービス定義ファイル

このディレクトリにマイクロサービスの依存関係を定義するYAMLファイルを配置します。

## ファイル形式

ファイル名がサービス名になります（例: `user-service.yml` → サービス名: `user-service`）

## YAMLスキーマ

```yaml
# 必須フィールド
description: サービスの概要説明（1-500文字）
owner: 責任者・チーム名（1-100文字）
github: GitHubリポジトリURL（https://github.com/で始まる）

# オプションフィールド
dependencies:
  - 依存先サービス名1
  - 依存先サービス名2
```

## 例

```yaml
# services/order-service.yml
description: 注文処理を担当するサービス
owner: commerce-team
github: https://github.com/example/order-service
dependencies:
  - user-service
  - payment-service
  - notification-service
```

## バリデーションルール

- `description`: 必須、1-500文字
- `owner`: 必須、1-100文字
- `github`: 必須、`https://github.com/`で始まるURL
- `dependencies`: オプション、存在するサービス名のリスト
  - 存在しないサービス名を指定すると警告が表示されます
  - 循環依存がある場合は警告が表示されます
