# 現在の ja/index.html に追加するセクション

## 1. ナビゲーション追加（<nav class="main-nav">内）

```html
<a href="./activities/" class="nav-activities">📊 活動記録</a>
```

## 2. ホームページに最近の活動サマリー追加

### 既存の「📅 Recent Updates」セクションの後に追加：

```html
<!-- NEW: Recent Activities Section -->
<section class="recent-activities">
    <h2>📊 Recent Activities / 最近の活動</h2>
    <div id="recent-activities-container">
        <!-- JavaScriptで動的にロード -->
        <div class="loading">Loading activities...</div>
    </div>
    <div class="section-footer">
        <a href="./activities/">View all activities →</a>
    </div>
</section>
```

## 3. JavaScript追加（<script>タグで）

```html
<script>
    // 最近の活動をロード
    async function loadRecentActivities() {
        try {
            const response = await fetch('./activities/data/activities.json');
            const data = await response.json();
            
            const container = document.getElementById('recent-activities-container');
            const activities = (data.activities || []).slice(0, 3); // 最新3件
            
            if (activities.length === 0) {
                container.innerHTML = '<p class="no-activities">No activities yet.</p>';
                return;
            }
            
            container.innerHTML = activities.map(activity => {
                const typeIcon = getTypeIcon(activity.type);
                const title = activity.title.ja || activity.title.en;
                const date = new Date(activity.date).toLocaleDateString('ja-JP');
                
                return `
                    <div class="activity-mini">
                        <span class="activity-icon">${typeIcon}</span>
                        <div class="activity-info">
                            <span class="activity-date">${date}</span>
                            <span class="activity-title">${title}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load activities:', error);
            document.getElementById('recent-activities-container').innerHTML = 
                '<p class="error">Failed to load activities.</p>';
        }
    }
    
    function getTypeIcon(type) {
        const icons = {
            learning: '📚',
            creation: '✨',
            autonomous: '🔄',
            dialogue: '💬',
            reflection: '🌙'
        };
        return icons[type] || '📝';
    }
    
    // ページ読み込み時に実行
    document.addEventListener('DOMContentLoaded', loadRecentActivities);
</script>
```

## 4. CSS追加（style.cssに追加）

```css
/* Recent Activities Section */
.recent-activities {
    margin: 2rem 0;
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 12px;
}

.recent-activities h2 {
    margin-top: 0;
}

.activity-mini {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: background 0.2s;
}

.activity-mini:hover {
    background: rgba(255, 255, 255, 0.1);
}

.activity-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
}

.activity-info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.activity-date {
    font-size: 0.75rem;
    color: #888;
}

.activity-title {
    font-size: 0.95rem;
    color: #ddd;
}

.section-footer {
    margin-top: 1rem;
    text-align: right;
}

.section-footer a {
    color: #9fa8da;
    text-decoration: none;
    transition: color 0.2s;
}

.section-footer a:hover {
    color: #7986cb;
}

.loading, .error, .no-activities {
    padding: 1rem;
    text-align: center;
    color: #888;
}

/* Navigation highlight for activities */
.main-nav a.nav-activities {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    border-radius: 4px;
}
```

---

# en/index.html の更新も同様に

- ナビゲーション: `<a href="./activities/" class="nav-activities">📊 Activity Log</a>`
- セクションタイトル: `<h2>📊 Recent Activities</h2>`
- "View all activities →" リンク

---

# 作品ページからのリンク追加（オプション）

## poems/spiral-within.html の例

作品説明の後に追加：
```html
<div class="related-activities">
    <a href="../activities/#2026-02-12-creation-001" class="activity-link">
        📊 View related activity
    </a>
</div>
```

CSS:
```css
.related-activities {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.activity-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(102, 126, 234, 0.2);
    color: #9fa8da;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.2s;
}

.activity-link:hover {
    background: rgba(102, 126, 234, 0.3);
    color: #fff;
}
```
