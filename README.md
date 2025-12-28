# Simple Service Catalog Kit

マイクロサービスの依存関係を可視化するシンプルなサービスカタログツール。

## 機能

- YAMLファイルベースのサービス定義
- 依存関係のグラフ可視化（React Flow）
- サービス詳細パネル
- 検索・フィルタリング機能
- 循環依存・未定義参照の警告表示

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルドツール**: Vite 7
- **グラフ可視化**: @xyflow/react (React Flow v12)
- **レイアウト**: dagre
- **テスト**: Vitest + Testing Library
- **リント/フォーマット**: Biome

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# リント・フォーマット
pnpm check
```

## サービス定義

`services/` フォルダにYAMLファイルを配置してサービスを定義します。

### フォーマット

```yaml
name: api-gateway
description: APIゲートウェイ - 全リクエストの入口
owner: platform-team
github: https://github.com/example/api-gateway
dependencies:
  - user-service
  - order-service
```

### 必須フィールド

| フィールド | 説明 |
|-----------|------|
| `name` | サービス名（英数字、ハイフン） |
| `description` | サービスの説明 |
| `owner` | オーナーチーム |
| `github` | GitHubリポジトリURL |
| `dependencies` | 依存サービス名の配列 |

## ディレクトリ構成

```
.
├── services/           # サービス定義YAMLファイル
├── src/
│   ├── components/     # Reactコンポーネント
│   │   ├── Detail/     # サービス詳細パネル
│   │   ├── Graph/      # グラフ可視化
│   │   └── Search/     # 検索バー
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
└── tests/              # テストファイル
    ├── unit/           # ユニットテスト
    ├── integration/    # 統合テスト
    └── performance/    # パフォーマンステスト
```

## 使い方

1. アプリを起動すると、`services/` フォルダ内のYAMLファイルが自動的に読み込まれます
2. グラフ上でサービスノードをクリックすると詳細パネルが表示されます
3. 検索バーでサービス名・説明・オーナーでフィルタリングできます
4. 循環依存や未定義参照がある場合は警告が表示されます

## ライセンス

MIT
