/**
 * マイクロサービスの定義
 * YAMLファイルから読み込まれるサービス情報
 */
export interface Service {
  /** サービス名（ファイル名から導出） */
  name: string
  /** サービスの概要説明 */
  description: string
  /** 責任者・チーム名 */
  owner: string
  /** GitHubリポジトリURL */
  github: string
  /** 依存先サービス名のリスト */
  dependencies: string[]
}

/**
 * サービス間の依存関係
 * グラフのエッジとして表現される
 */
export interface Dependency {
  /** 依存元サービス名 */
  source: string
  /** 依存先サービス名 */
  target: string
}

/**
 * 警告情報
 * 循環依存や未定義参照などの問題を表す
 */
export interface Warning {
  /** 警告タイプ: 'cycle'（循環依存）または 'missing'（未定義参照） */
  type: 'cycle' | 'missing'
  /** ユーザー向けメッセージ */
  message: string
  /** 関連するサービス名のリスト */
  services: string[]
}

/**
 * React Flow用のサービスノード
 */
export interface ServiceNode {
  /** サービス名（一意のID） */
  id: string
  /** ノードタイプ（カスタムノード識別用） */
  type: 'service'
  /** サービスデータ */
  data: Service
  /** 画面上の位置（dagreで自動計算） */
  position: { x: number; y: number }
}

/**
 * React Flow用の依存エッジ
 */
export interface DependencyEdge {
  /** エッジID（`${source}->${target}` 形式） */
  id: string
  /** 依存元サービス名 */
  source: string
  /** 依存先サービス名 */
  target: string
  /** エッジタイプ（カスタムエッジ識別用） */
  type: 'dependency'
  /** 循環依存時のアニメーション表示フラグ */
  animated: boolean
}

/**
 * サービス依存関係グラフ
 * React Flowへの入力データ
 */
export interface ServiceGraph {
  /** サービスノードの配列 */
  nodes: ServiceNode[]
  /** 依存エッジの配列 */
  edges: DependencyEdge[]
  /** 検出された警告 */
  warnings: Warning[]
}
