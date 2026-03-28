# 🎮 RoWiki JP — Roblox最強Wiki & コード

Roblox人気ゲーム100本以上のコード・攻略・ランキングを掲載する日本語Wikiサイトです。
Claude APIを使ってコードを毎日自動収集・更新します。

## 📁 ファイル構成

```
roblox-wiki/
├── index.html          ← メインサイト（SEO対応・Claude AI統合）
├── data/
│   ├── games.json      ← ゲームデータ（コード含む）
│   └── update-log.json ← 更新ログ（自動生成）
├── api/
│   └── update-codes.js ← コード自動更新スクリプト
└── package.json
```

## 🚀 セットアップ

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
export ANTHROPIC_API_KEY=sk-ant-あなたのAPIキー
```

### 3. ローカルで確認
```bash
npm run dev
# → http://localhost:3000 で確認
```

## 🔄 コードの自動更新

### 手動で今すぐ更新
```bash
node api/update-codes.js
```

### 毎日自動更新（cron設定）
```bash
# crontab -e で以下を追加（毎朝6時に実行）
0 6 * * * ANTHROPIC_API_KEY=sk-ant-xxx node /path/to/roblox-wiki/api/update-codes.js

# または毎朝6時と18時
0 6,18 * * * ANTHROPIC_API_KEY=sk-ant-xxx node /path/to/roblox-wiki/api/update-codes.js
```

## 🌐 デプロイ（無料）

### Vercelにデプロイ（推奨）
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
1. GitHubにリポジトリを作成
2. `index.html`と`data/`フォルダをpush
3. Settings → Pages → main ブランチを有効化
4. `https://yourusername.github.io/roblox-wiki/` でアクセス可能に！

### Netlify
1. netlify.comにログイン
2. フォルダをドラッグ&ドロップするだけでデプロイ完了

## 📊 ゲームの追加方法

`data/games.json` に以下の形式で追加するだけ：

```json
{
  "id": "game-slug",
  "name": "ゲーム名",
  "nameJp": "日本語名",
  "genre": "ジャンル",
  "icon": "🎮",
  "rank": 100,
  "visits": "1億+",
  "concurrent": "10万+",
  "rating": 4,
  "hot": true,
  "updated": "2026-03-28",
  "desc": "短い説明文",
  "longDesc": "詳細な説明文",
  "howto": ["手順1", "手順2", "手順3"],
  "codes": [
    { "code": "CODENAME", "reward": "報酬の説明", "new": true }
  ],
  "tags": ["タグ1", "タグ2"]
}
```

その後、`api/update-codes.js` の `GAMES_TO_CHECK` にも追加してください。

## 🎯 SEO対策

このサイトは以下のSEO対策が実装済みです：
- `<title>` タグに主要キーワードを含む
- `<meta description>` でゲーム名・コードをキーワードに
- `<meta keywords>` を設定
- `<link rel="canonical">` でURLの正規化
- semantic HTML（article, h1, h2, section）を使用
- ページ内検索対応（Googleにインデックスされやすい）

### さらにSEOを強化するには
1. 各ゲームを個別ページ（`/blox-fruits/`など）にする
2. `sitemap.xml` を作成して Google Search Console に登録
3. `robots.txt` を設定
4. Google Analytics / Search Console を導入

## 💡 今後の拡張アイデア

- [ ] 各ゲームの個別ページ（`/games/blox-fruits.html`）
- [ ] Vercel Cron JobsでAPIを毎日自動実行
- [ ] Supabase/Airtableでデータをクラウド管理
- [ ] Discord Bot連携（新コードを通知）
- [ ] ユーザーコメント機能
- [ ] SNSシェアボタン

## 📝 ライセンス

MIT License - 自由に使用・改変・配布可能です。
