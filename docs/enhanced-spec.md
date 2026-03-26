# PDF編集Webアプリケーション — 拡張仕様書 v2.0

> 本ドキュメントは `docs/Saisyo.md`（初期仕様書）の内容を精査・確認した上で、ライブラリの最適化、追加機能の提案、セキュリティ対策、アーキテクチャ設計をまとめた拡張仕様書です。

---

## 目次

1. [初期仕様の確認と整理](#1-初期仕様の確認と整理)
2. [ライブラリ選定の最適化](#2-ライブラリ選定の最適化)
3. [追加機能の提案](#3-追加機能の提案)
4. [npmサプライチェーンセキュリティ対策](#4-npmサプライチェーンセキュリティ対策)
5. [アーキテクチャ設計方針](#5-アーキテクチャ設計方針)
6. [データモデル拡張](#6-データモデル拡張)
7. [開発フェーズとロードマップ](#7-開発フェーズとロードマップ)
8. [付録](#付録)

---

## 1. 初期仕様の確認と整理

### 1.1 技術スタック（確定）

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フレームワーク | Next.js (App Router) | React Server Components活用 |
| スタイリング | Tailwind CSS + shadcn/ui | コンポーネントライブラリとして最適 |
| データベース | Turso (SQLite) + Drizzle ORM | エッジ対応のSQLite |
| 認証 | Better Auth | TypeScript-first、プラグインエコシステム充実 |
| ホスティング | Vercel | Edge Functions + ISR対応 |
| ファイルストレージ | Vercel Blob | PDFの一時保存・管理 |
| PDF処理 | pdf-lib | 結合・分割・編集のコア処理 |

### 1.2 コア機能（確認済み）

以下の機能はSaisyo.mdの要件通り実装する：

1. **認証・ユーザー管理** — メール/パスワード、Google OAuth、ダッシュボード
2. **PDF結合（Merge）** — 複数PDFのドラッグ&ドロップ順序変更と結合
3. **PDF分割（Split）** — ページ範囲指定による分割・抽出
4. **ページ削除・回転** — プレビュー付きでの操作
5. **パスワード保護の設定/解除**
6. **ウォーターマーク（透かし）追加**
7. **UI/UX** — Dropzone、ローディング状態、エラーハンドリング、レスポンシブ

### 1.3 初期仕様に対する補足・注意点

- **pdf-libのパスワード機能の制限:** pdf-libは暗号化PDFの読み込みに制限があるため、パスワード解除機能にはサーバーサイド処理（`mupdf-wasm`等）の併用を検討する必要がある。
- **プレビュー用ライブラリ:** 初期仕様では「react-pdf またはブラウザネイティブのビューア」と記載されているが、後述の通り `react-pdf` v10.x を採用する。

---

## 2. ライブラリ選定の最適化

### 2.1 PDFビューア / プレビュー

| ライブラリ | 評価 | 推奨度 |
|-----------|------|--------|
| `react-pdf` (wojtekmaj) v10.x | PDF.jsベース、活発にメンテナンス、シンプルなAPI | **採用** |
| `@react-pdf-viewer/core` v3.x | 高機能だが3年間更新なし | 非推奨 |

**決定:** `react-pdf` v10.x を採用。PDF.js (Mozilla) のReactラッパーとして最も安定しており、サムネイル生成やページ単位のレンダリングに対応。

### 2.2 ドラッグ&ドロップ

| ライブラリ | 評価 | 推奨度 |
|-----------|------|--------|
| `@dnd-kit/react` | モダンで軽量、アクセシビリティ対応 | **採用** |
| `@atlaskit/pragmatic-drag-and-drop` | Atlassian製、大規模向け | 候補 |
| `react-beautiful-dnd` | Atlassianが非推奨宣言済み | 不採用 |

**決定:** `@dnd-kit/react` を採用。ソート可能リスト（PDF結合時の順序変更）やグリッドレイアウト（ページサムネイル並べ替え）の両方に対応。キーボード操作・スクリーンリーダーのサポートも充実。

### 2.3 ファイルアップロード

**決定:** `react-dropzone` v15.x を採用。shadcn/uiのカスタムDropzoneコンポーネントと組み合わせて使用。ファイルタイプ制限（`.pdf`のみ）、サイズ制限、複数ファイル対応をpropsで簡潔に設定可能。

### 2.4 トースト通知

**決定:** `sonner` を採用。shadcn/uiが公式にSonnerコンポーネントを提供しており、`npx shadcn-ui@latest add sonner` でシームレスに導入可能。

### 2.5 PDF処理（コア + 補完）

| ライブラリ | 用途 | 推奨度 |
|-----------|------|--------|
| `pdf-lib` | 結合・分割・回転・メタデータ編集・ウォーターマーク | **コア採用** |
| `mupdf-wasm` | パスワード付きPDFの解除・高度なレンダリング | 補完候補 |
| `jsPDF` | 画像からPDF生成 | 補完採用 |

### 2.6 OCR（光学文字認識）

**決定:** `tesseract.js` v7.x をPhase 2の拡張機能として採用。日本語OCRに対応。Web Worker上で実行しUIスレッドをブロックしない設計とする。

### 2.7 状態管理

**決定:** `zustand` を採用。PDF編集の操作履歴（Undo/Redo）、アップロード中ファイルの管理、UIの状態を一元管理する。React Contextでは複雑になりすぎる状態を軽量に扱える。

### 2.8 その他ユーティリティ

| ライブラリ | 用途 |
|-----------|------|
| `file-saver` | クライアントサイドでのファイルダウンロード |
| `next-themes` | ダークモード切り替え |
| `zod` | フォーム・APIバリデーション |
| `date-fns` | 日付フォーマット（ダッシュボード表示） |

---

## 3. 追加機能の提案

### Phase 1（MVP — 初期仕様 + 基本拡張）

#### 3.1 ダークモード
- `next-themes` でシステム/ライト/ダークの切り替え
- Tailwind CSSの `dark:` プレフィックスで対応
- ユーザー設定をlocalStorageに保存

#### 3.2 キーボードショートカット
- `Ctrl/Cmd + Z` — 元に戻す
- `Ctrl/Cmd + Shift + Z` — やり直し
- `Delete` — 選択ページの削除
- `Ctrl/Cmd + S` — 保存・ダウンロード
- `Ctrl/Cmd + A` — 全ページ選択
- `?` キー — ショートカット一覧表示

#### 3.3 ページ並べ替え（サムネイルプレビュー付き）
- `react-pdf` でページごとのサムネイルを生成
- `@dnd-kit/react` でドラッグ&ドロップ並べ替え
- グリッド表示とリスト表示の切り替え

### Phase 2（拡張機能）

#### 3.4 PDF圧縮・最適化
- 画像の再圧縮（品質設定: 低/中/高）
- 不要なメタデータの除去
- 圧縮前後のファイルサイズ比較表示

#### 3.5 PDF → 画像変換 / 画像 → PDF変換
- **PDF → 画像:** `react-pdf`のcanvasレンダリングで各ページをPNG/JPEGとして出力。解像度選択（72/150/300 DPI）。
- **画像 → PDF:** `jsPDF` で複数画像をPDFに結合。ページサイズの自動調整（A4/レター/元画像サイズ）。

#### 3.6 アノテーション・スタンプの追加
- テキスト注釈の追加（フォント、サイズ、色の指定）
- 日付スタンプ（「受領済み」「承認済み」等の定型スタンプ）
- フリーハンド描画（Canvas API利用）
- `pdf-lib` でPDFに埋め込み

#### 3.7 PDFメタデータ編集
- タイトル、作成者、サブタイトル、キーワードの表示・編集
- `pdf-lib` の `setTitle()`, `setAuthor()` 等を使用

#### 3.8 OCR（テキスト認識）
- `tesseract.js` v7.x による画像ベースPDFのテキスト抽出
- 対応言語: 日本語、英語
- 処理進捗のプログレスバー表示
- 抽出テキストのコピー・エクスポート

#### 3.9 バッチ処理
- 複数PDFに対する一括操作（結合、圧縮、ウォーターマーク追加等）
- キュー管理UI（処理待ち / 処理中 / 完了）
- Web Workerでバックグラウンド処理

### Phase 3（付加価値機能）

#### 3.10 編集履歴・エクスポート履歴
- ダッシュボードに処理履歴の一覧表示
- 操作タイプ別フィルタリング
- 処理済みファイルの再ダウンロード（Vercel Blobから一定期間保持）
- CSV/JSONでの履歴エクスポート

#### 3.11 テンプレート機能
- よく使うウォーターマークやスタンプの設定をテンプレートとして保存
- ワンクリックでテンプレートを適用

---

## 4. npmサプライチェーンセキュリティ対策

> `docs/npmwormTaisaku.md` の「Shai-Hulud」ワーム対策を踏まえた包括的なセキュリティ方針。

### 4.1 package.json のセキュリティ方針

- **バージョン固定:** `^` や `~` を使用せず厳密なバージョンを指定
- `.npmrc` に以下を設定:
  ```
  save-exact=true
  ignore-scripts=true
  engine-strict=true
  audit=true
  ```

### 4.2 ロックファイルの管理と監査

```bash
# lockfile-lintによるロックファイル検証
npx lockfile-lint \
  --path package-lock.json \
  --type npm \
  --allowed-hosts npm \
  --validate-https
```

- `package-lock.json` を必ずGitにコミット
- 不正なレジストリURLの混入を検知

### 4.3 CI/CDでの自動セキュリティ監査

```yaml
# .github/workflows/security-audit.yml
name: Security Audit
on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜9時

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci --ignore-scripts
      - run: npm audit --audit-level=high
      - run: npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https
```

### 4.4 Socket.dev の導入

- Socket GitHubアプリをリポジトリにインストールし、PRごとに自動スキャン
- 新規依存関係追加時にリスクスコアを自動チェック
- ネットワークアクセス・環境変数読み取りの異常パターンを検知

### 4.5 依存関係の最小化方針

導入前に各npmパッケージの以下を確認する：
- メンテナンス状況（最終更新日）
- ダウンロード数と信頼性
- Socket.devのリスクスコア
- GitHub Starsとコントリビューター数
- ライセンス互換性

### 4.6 シークレット管理

- `.env` ファイルは `.gitignore` に必ず含める
- Vercelの環境変数機能でシークレットを管理
- 定期的な認証情報のローテーション
- Shai-Hulud感染の兆候が見られた場合、即座に全APIキー・トークンを再発行

---

## 5. アーキテクチャ設計方針

### 5.1 ファイルサイズ制限とアップロード戦略

| プラン | ファイルサイズ上限 | 同時アップロード数 |
|--------|-------------------|-------------------|
| 無料 | 20MB / ファイル | 5ファイル |
| 将来有料プラン | 100MB / ファイル | 20ファイル |

- 5MB以下 → 単一リクエストで直接アップロード
- 5MB超 → チャンク分割（5MB単位）で段階的にアップロード
- アップロード進捗をリアルタイム表示
- アップロード完了後にファイル整合性チェック（SHA-256ハッシュ比較）

### 5.2 Web Worker によるPDF処理

```
[メインスレッド (UI)]
  ├── ユーザー操作の受付
  ├── プレビュー表示 (react-pdf)
  └── 処理結果の表示・ダウンロード

[Worker スレッド]
  ├── pdf-lib による PDF処理（結合/分割/回転/ウォーターマーク）
  ├── tesseract.js による OCR 処理
  ├── 画像変換処理
  └── 圧縮処理
```

- 重い処理はWeb Workerで実行し、UIスレッドをブロックしない
- `postMessage` + `Transferable Objects` で効率的にデータ転送
- 処理進捗をWorkerからメインスレッドに逐次報告しプログレスバーに反映

### 5.3 キャッシュ戦略

- **処理済みPDF:** Vercel Blobに一時保存（24時間後に自動削除）
- **サムネイルキャッシュ:** IndexedDBにページサムネイルをキャッシュし再表示を高速化
- **ライブラリキャッシュ:** PDF.jsのWorkerファイル、tesseract.jsの言語データはService Worker + Cache APIでキャッシュ

### 5.4 ディレクトリ構成

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # 認証必須エリア
│   │   ├── dashboard/
│   │   ├── merge/
│   │   ├── split/
│   │   ├── edit/
│   │   ├── compress/
│   │   ├── convert/
│   │   └── ocr/
│   ├── api/                      # API Routes
│   │   ├── auth/[...all]/
│   │   └── upload/
│   ├── layout.tsx
│   └── page.tsx                  # ランディングページ
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   ├── pdf/                      # PDF関連コンポーネント
│   │   ├── pdf-viewer.tsx
│   │   ├── page-thumbnail.tsx
│   │   ├── page-grid.tsx
│   │   └── pdf-dropzone.tsx
│   ├── layout/                   # レイアウト
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── shared/                   # 共有コンポーネント
├── lib/
│   ├── pdf/                      # PDF処理ユーティリティ
│   │   ├── merge.ts
│   │   ├── split.ts
│   │   ├── rotate.ts
│   │   ├── watermark.ts
│   │   ├── compress.ts
│   │   └── metadata.ts
│   ├── auth.ts                   # Better Auth設定
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORMスキーマ
│   │   ├── index.ts             # DB接続
│   │   └── migrations/
│   └── utils.ts
├── stores/                       # Zustand ストア
│   ├── pdf-store.ts
│   └── ui-store.ts
├── hooks/                        # カスタムフック
│   ├── use-pdf-processor.ts
│   ├── use-file-upload.ts
│   └── use-keyboard-shortcuts.ts
├── types/                        # TypeScript型定義
│   └── pdf.ts
└── workers/                      # Web Workers
    ├── pdf-worker.ts
    └── ocr-worker.ts
```

---

## 6. データモデル拡張

### Drizzle ORMスキーマ

```typescript
// users: Better Authの標準スキーマ（Better Authが自動生成）

// documents: 処理したPDFの履歴
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  filename: text('filename').notNull(),
  originalSize: integer('original_size'),
  processedSize: integer('processed_size'),
  fileUrl: text('file_url'),
  operationType: text('operation_type').notNull(),
  // merge, split, rotate, compress, watermark, ocr, convert
  operationDetails: text('operation_details'),  // JSON
  status: text('status').default('completed'),
  // pending, processing, completed, failed
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

// templates: ユーザー保存のテンプレート（Phase 3）
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(),      // watermark, stamp, annotation
  config: text('config').notNull(),  // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

// usage_stats: 利用統計（将来の課金対応）
export const usageStats = sqliteTable('usage_stats', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  month: text('month').notNull(),    // YYYY-MM
  operationCount: integer('operation_count').default(0),
  totalBytesProcessed: integer('total_bytes_processed').default(0),
});
```

---

## 7. 開発フェーズとロードマップ

### Phase 1: 基盤構築 + MVP

| ステップ | 内容 |
|---------|------|
| 1-1 | プロジェクト初期化、npmセキュリティ設定（.npmrc, lockfile-lint） |
| 1-2 | Next.js + Tailwind + shadcn/ui セットアップ |
| 1-3 | Turso + Drizzle ORM接続、スキーマ定義、マイグレーション |
| 1-4 | Better Auth設定（メール/パスワード + Google OAuth） |
| 1-5 | UIレイアウト（ヘッダー、サイドバー、ダッシュボード、ダークモード） |
| 1-6 | PDFアップロード（react-dropzone）+ Vercel Blob連携 |
| 1-7 | PDF結合・分割・回転・ページ削除（pdf-lib + Web Worker） |
| 1-8 | ページ並べ替えUI（react-pdf サムネイル + @dnd-kit） |
| 1-9 | パスワード保護・ウォーターマーク |
| 1-10 | キーボードショートカット、エラーハンドリング、レスポンシブ調整 |

### Phase 2: 拡張機能

| ステップ | 内容 |
|---------|------|
| 2-1 | PDF圧縮・最適化 |
| 2-2 | PDF → 画像 / 画像 → PDF 変換 |
| 2-3 | アノテーション・スタンプ |
| 2-4 | PDFメタデータ編集 |
| 2-5 | OCR（tesseract.js） |
| 2-6 | バッチ処理UI + キュー管理 |

### Phase 3: 付加価値 + 品質向上

| ステップ | 内容 |
|---------|------|
| 3-1 | 編集履歴・エクスポート履歴 |
| 3-2 | テンプレート機能 |
| 3-3 | E2Eテスト（Playwright） |
| 3-4 | パフォーマンス最適化、Lighthouse監査 |
| 3-5 | 本番デプロイ、監視設定 |

---

## 付録A: パッケージ一覧

```json
{
  "dependencies": {
    "next": "15.x.x",
    "react": "19.x.x",
    "react-dom": "19.x.x",
    "pdf-lib": "1.17.1",
    "react-pdf": "10.x.x",
    "react-dropzone": "15.x.x",
    "@dnd-kit/react": "0.x.x",
    "sonner": "2.x.x",
    "better-auth": "1.x.x",
    "@libsql/client": "latest",
    "drizzle-orm": "latest",
    "zustand": "latest",
    "jspdf": "latest",
    "tesseract.js": "7.x.x",
    "next-themes": "latest",
    "zod": "latest",
    "file-saver": "latest",
    "date-fns": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "typescript": "latest",
    "tailwindcss": "latest",
    "@playwright/test": "latest",
    "lockfile-lint": "latest"
  }
}
```

> **注意:** `save-exact=true` の設定により、インストール時に自動的に固定バージョンとなる。

## 付録B: セキュリティチェックリスト

- [ ] `.npmrc` に `save-exact=true`, `ignore-scripts=true` を設定
- [ ] `lockfile-lint` をCIに組み込み
- [ ] Socket.dev GitHubアプリをインストール
- [ ] `npm audit` をCIパイプラインに追加
- [ ] `.env` が `.gitignore` に含まれていることを確認
- [ ] Vercel環境変数に全シークレットを移行
- [ ] Content Security Policyヘッダーの設定
- [ ] ファイルアップロードのMIMEタイプ検証（`application/pdf` のみ許可）
- [ ] アップロードファイルのマジックバイト検証（`%PDF-` ヘッダー）
- [ ] レート制限の設定（API Routes）
