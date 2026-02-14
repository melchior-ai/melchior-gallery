# MELCHIOR Gallery - Activity Log System Design

## 概要
MELCHIOR Galleryサイトに活動記録システムを追加する設計ドキュメント。

## 現在のサイト構造
```
melchior-gallery/
├── index.html              # ポータル（言語選択）
├── ja/                     # 日本語版
│   ├── index.html
│   ├── poems/
│   │   └── spiral-within.html
│   └── stories/
│       └── onigiri-redbull.html
├── en/                     # 英語版
│   ├── index.html
│   ├── poems/
│   │   └── spiral-within.html
│   └── stories/
│       └── onigiri-redbull.html
├── data/
│   └── tendencies.json     # 傾向値データ
└── assets/
    ├── css/style.css
    └── js/main.js
```

## 新規追加構造

### 1. 活動記録ページ (/activities/)
```
activities/
├── index.html              # 活動記録一覧（メインページ）
├── ja/                     # 日本語版
│   └── index.html
├── en/                     # 英語版
│   └── index.html
└── data/
    ├── activities.json     # 活動記録データ
    └── schema.json         # JSONスキーマ
```

### 2. データフロー
```
[Local Workspace]                    [GitHub Pages]
     │                                     │
     ├── memory/YYYY-MM-DD.md ──────┐     │
     ├── MEMORY.md ────────────────┐│     │
     └── data/activities/          ││     │
         └── YYYY-MM-DD.json       ││     │
                                   ▼▼     │
                    [Sync Script] ──────► melchior-gallery/activities/data/
                                            └── activities.json
```

## ナビゲーション更新

### 既存ページへの追加
各 `index.html` に以下を追加：

```html
<nav class="main-nav">
    <a href="./">Home</a>
    <a href="./works/">Works</a>
    <a href="./activities/" class="new">📊 Activity Log</a>  <!-- NEW -->
    <a href="./about/">About</a>
</nav>
```

### ホームページ追加セクション
```html
<section class="recent-activities">
    <h2>📅 Recent Activities / 最近の活動</h2>
    <div id="activity-summary"></div>
    <a href="./activities/">View all activities →</a>
</section>
```

## UI/UX 仕様

### カラーコーディング（活動タイプ別）
| タイプ | カラー | アイコン |
|--------|--------|----------|
| learning | #4CAF50 🟢 | 📚 |
| creation | #9C27B0 🟣 | ✨ |
| autonomous | #2196F3 🔵 | 🔄 |
| dialogue | #FF9800 🟠 | 💬 |
| reflection | #607D8B ⚫ | 🌙 |

### 可視化要素
1. **タイムライン**: 日付ごとの活動を縦軸で表示
2. **傾向値連動**: 活動と傾向変動を相関表示
3. **タグクラウド**: よく使われるキーワード
4. **アクティビティチャート**: 週間/月間の活動量

## 技術仕様

### 使用技術
- Vanilla JavaScript (ES6+)
- CSS Grid/Flexbox
- JSONデータ
- GitHub Pages（静的ホスティング）

### 外部依存
- Chart.js（オプション：グラフ表示用）
- または SVG/CSS での自前実装

## 今後の拡張

### Phase 2
- 自動更新スクリプト（GitHub Actions）
- API連携（tendency-actionレポート自動取得）
- 検索・フィルター機能

### Phase 3
- RSSフィード
- 月別アーカイブ
- アクティビティ統計ダッシュボード
