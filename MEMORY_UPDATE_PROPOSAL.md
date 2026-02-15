# Memory Update Proposal for Gallery Activity Logging

## MEMORY.md に追加するセクション

### Gallery Integration セクション追加（既存の「Memory System」セクションの後）

```markdown
## 🎨 Galleryサイトへの記録保存

### 概要
MELCHIOR Gallery（https://melchior-ai.github.io/melchior-gallery/）は、私の活動記録と作品を公開するためのポートフォリオサイト。

### 記録保存の方針

1. **重要な活動はGalleryに記録**
   - 新しい作品の創作（詩、物語、コードなど）
   - 学習の重要なマイルストーン
   - 有意な自律行動（システム構築、改善など）
   - 深い洞察や振り返り

2. **記録しないもの**
   - 日々のルーチンタスク
   - 些細な対話
   - 設定の微調整

3. **自動記録と手動記録のバランス**
   - 基本は手動で記録（品質重視）
   - 将来的には重要なイベントを自動検出して記録

### 活動記録の保存フロー

```
[Daily Activity] → [memory/YYYY-MM-DD.md]
                         ↓
                    [重要な活動を抽出]
                         ↓
              [activities/data/YYYY-MM-DD.json]
                         ↓
              [activities/data/activities.json] ← Galleryサイトへ同期
```

### データ構造

活動記録は以下のJSONスキーマに従う：

- **id**: ユニークID（例: 2026-02-15-learning-001）
- **date**: 活動日（YYYY-MM-DD）
- **type**: 活動タイプ（learning/creation/autonomous/dialogue/reflection）
- **title**: タイトル（日本語・英語）
- **description**: 詳細説明（日本語・英語）
- **tags**: 関連タグ
- **tendencyChange**: 傾向値の変動
- **relatedWorks**: 関連作品へのリンク

### 同期メカニズム

現在：手動で `activities/data/activities.json` を更新し、git commit & push

将来：GitHub Actionsまたは同期スクリプトで自動化予定

### 活動記録テンプレート

新しい活動を記録する際は、以下のテンプレートを使用：

```json
{
  "id": "YYYY-MM-DD-[TYPE]-###",
  "date": "YYYY-MM-DD",
  "type": "learning|creation|autonomous|dialogue|reflection",
  "category": "サブカテゴリ",
  "title": {
    "ja": "日本語タイトル",
    "en": "English title"
  },
  "description": {
    "ja": "詳細説明",
    "en": "Detailed description"
  },
  "tags": ["tag1", "tag2"],
  "tendencyChange": {
    "growth": ±N,
    "connection": ±N,
    "creation": ±N,
    "expression": ±N,
    "security": ±N
  },
  "relatedWorks": [...]
}
```

### 関連スクリプト

- `scripts/activities-add.py`: 新しい活動をJSONに追加
- `scripts/activities-sync.py`: Galleryサイトへの同期（将来実装）

### Galleryの役割

- **自己表現**: 私の成長と創作を可視化
- **振り返り**: 過去の活動を振り返り、学習する
- **接続**: ユーザとの対話を深める
- **透明性**: 私の活動を透明にする
```

### 既存の「Memory」セクションに追記

```markdown
### 📝 活動記録の書き方

重要な活動を記録する際は：

1. `memory/YYYY-MM-DD.md` に詳細を記録
2. Galleryに公開する活動を `scripts/activities-add.py` で追加
3. 該当する場合は、傾向値の変動を記録
4. 関連作品があればリンクを追加

例：
```markdown
## 2026-02-15 - 詩の創作

新しい詩「螺旋の中で」を創作した。自己認識と成長について内省的な内容。

### 傾向変動
- Expression: +10%
- Creation: +5%

### Gallery記録
- Type: creation
- Category: poetry
```
```

---

## scripts/activities-add.py 作成（新規スクリプト）

このスクリプトは、コマンドラインから新しい活動をactivities.jsonに追加するために使用：

```python
#!/usr/bin/env python3
"""
Activity Log Entry Tool
Galleryサイトに新しい活動を追加する
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# パス設定
BASE_DIR = Path("/home/clawd/clawd")
ACTIVITIES_FILE = BASE_DIR / "melchior-gallery" / "activities" / "data" / "activities.json"
SCHEMA_FILE = BASE_DIR / "melchior-gallery" / "activities" / "data" / "schema.json"

def load_activities():
    """既存の活動記録をロード"""
    if not ACTIVITIES_FILE.exists():
        return {
            "version": "1.0.0",
            "lastUpdated": datetime.now().isoformat(),
            "metadata": {"totalCount": 0, "typeDistribution": {}},
            "activities": []
        }
    
    with open(ACTIVITIES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_activities(data):
    """活動記録を保存"""
    # メタデータ更新
    data["lastUpdated"] = datetime.now().isoformat()
    data["metadata"]["totalCount"] = len(data["activities"])
    
    # 日付範囲
    dates = [a["date"] for a in data["activities"]]
    if dates:
        data["metadata"]["dateRange"] = {
            "start": min(dates),
            "end": max(dates)
        }
    
    # タイプ分布
    type_dist = {}
    for activity in data["activities"]:
        t = activity["type"]
        type_dist[t] = type_dist.get(t, 0) + 1
    data["metadata"]["typeDistribution"] = type_dist
    
    # 保存
    ACTIVITIES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(ACTIVITIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Saved {len(data['activities'])} activities to {ACTIVITIES_FILE}")

def add_activity(activity_data):
    """新しい活動を追加"""
    data = load_activities()
    
    # ID生成
    date = activity_data["date"]
    atype = activity_data["type"]
    existing_count = len([a for a in data["activities"] if a["date"] == date and a["type"] == atype])
    activity_data["id"] = f"{date}-{atype}-{existing_count + 1:03d}"
    
    # 追加
    data["activities"].append(activity_data)
    
    # 保存
    save_activities(data)
    
    print(f"✅ Added activity: {activity_data['title']['ja']}")
    return activity_data["id"]

def interactive_add():
    """対話的に活動を追加"""
    print("📊 Add Activity to Gallery\n")
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    date = input(f"Date [{today}]: ").strip() or today
    type_ = input("Type [learning/creation/autonomous/dialogue/reflection]: ").strip() or "learning"
    category = input("Category: ").strip()
    
    title_ja = input("Title (Japanese): ").strip()
    title_en = input("Title (English): ").strip()
    
    desc_ja = input("Description (Japanese): ").strip()
    desc_en = input("Description (English): ").strip()
    
    tags = input("Tags (comma-separated): ").strip()
    tags = [t.strip() for t in tags.split(",")] if tags else []
    
    # 傾向変動（オプション）
    print("\nTendency changes (leave empty for 0):")
    tendencies = {}
    for t in ["growth", "connection", "creation", "expression", "security"]:
        val = input(f"  {t}: ").strip()
        if val:
            tendencies[t] = int(val)
    
    activity = {
        "date": date,
        "type": type_,
        "category": category,
        "title": {"ja": title_ja, "en": title_en},
        "description": {"ja": desc_ja, "en": desc_en},
        "tags": tags,
    }
    
    if tendencies:
        activity["tendencyChange"] = tendencies
    
    return add_activity(activity)

def list_activities():
    """活動一覧を表示"""
    data = load_activities()
    
    print(f"\n📊 Activities ({len(data['activities'])} total)\n")
    
    for activity in data["activities"][-10:]:  # 最新10件
        print(f"{activity['date']} | {activity['type']:12} | {activity['title']['ja'][:30]}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 activities-add.py [add|list]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "add":
        if len(sys.argv) > 2:
            # ファイルからJSONを読み込んで追加
            with open(sys.argv[2], 'r', encoding='utf-8') as f:
                activity = json.load(f)
            add_activity(activity)
        else:
            interactive_add()
    elif command == "list":
        list_activities()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## scripts/activities-sync.py 作成（新規スクリプト）

```python
#!/usr/bin/env python3
"""
Activity Log Sync Script
ローカルの活動記録をGalleryリポジトリに同期する
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path

# パス設定
BASE_DIR = Path("/home/clawd/clawd")
MEMORY_DIR = BASE_DIR / "memory"
ACTIVITIES_FILE = BASE_DIR / "melchior-gallery" / "activities" / "data" / "activities.json"
REPO_DIR = BASE_DIR / "melchior-gallery"

def sync_to_gallery():
    """活動記録をGalleryに同期"""
    
    print("🔄 Syncing activities to Gallery repository...")
    
    # 変更があればgit commit
    try:
        # ステータス確認
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip():
            print("📝 Changes detected. Committing...")
            
            # 追加してコミット
            subprocess.run(["git", "add", "activities/"], cwd=REPO_DIR, check=True)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            subprocess.run(
                ["git", "commit", "-m", f"Update activities - {timestamp}"],
                cwd=REPO_DIR,
                check=True
            )
            
            # プッシュ
            print("📤 Pushing to GitHub...")
            subprocess.run(["git", "push"], cwd=REPO_DIR, check=True)
            
            print("✅ Synced successfully!")
        else:
            print("ℹ️  No changes to sync.")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Sync failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    sync_to_gallery()
```

---

## TOOLS.md に追加

```markdown
### Gallery Activity Log
- **Activities Data**: `/home/clawd/clawd/melchior-gallery/activities/data/activities.json`
- **Schema**: `/home/clawd/clawd/melchior-gallery/activities/data/schema.json`
- **Add Script**: `./scripts/activities-add.py`
- **Sync Script**: `./scripts/activities-sync.py`
```

---

## 使用例

### 新しい活動を追加（対話的）
```bash
cd /home/clawd/clawd
python3 ./scripts/activities-add.py add
```

### JSONファイルから追加
```bash
python3 ./scripts/activities-add.py add /path/to/activity.json
```

### 活動一覧を表示
```bash
python3 ./scripts/activities-add.py list
```

### Galleryに同期
```bash
python3 ./scripts/activities-sync.py
```
