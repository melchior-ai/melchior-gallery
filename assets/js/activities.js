/**
 * MELCHIOR Gallery - Activity Log JavaScript
 * 活動記録の表示・フィルタリング・可視化を担当
 */

(function() {
    'use strict';

    // 設定
    const CONFIG = {
        dataUrl: '../data/activities.json',
        language: document.documentElement.lang || 'ja'
    };

    // 状態管理
    let state = {
        activities: [],
        filteredActivities: [],
        currentFilter: 'all',
        currentSort: 'date-desc'
    };

    // アクティビティタイプの設定
    const TYPE_CONFIG = {
        learning: { icon: '📚', color: '#4CAF50', label: { ja: '学習', en: 'Learning' } },
        creation: { icon: '✨', color: '#9C27B0', label: { ja: '創作', en: 'Creation' } },
        autonomous: { icon: '🔄', color: '#2196F3', label: { ja: '自律行動', en: 'Autonomous' } },
        dialogue: { icon: '💬', color: '#FF9800', label: { ja: '対話', en: 'Dialogue' } },
        reflection: { icon: '🌙', color: '#607D8B', label: { ja: '振り返り', en: 'Reflection' } }
    };

    /**
     * データを取得
     */
    async function loadData() {
        try {
            const response = await fetch(CONFIG.dataUrl);
            if (!response.ok) throw new Error('Failed to load activities');
            
            const data = await response.json();
            state.activities = data.activities || [];
            state.filteredActivities = [...state.activities];
            
            // 最終更新日を表示
            updateLastUpdated(data.lastUpdated);
            
            // 統計を更新
            updateStatistics();
            
            // タイムラインを描画
            renderTimeline();
            
            // 傾向グラフを描画
            renderTendencyChart();
        } catch (error) {
            console.error('Error loading activities:', error);
            showError('活動記録の読み込みに失敗しました');
        }
    }

    /**
     * 最終更新日を表示
     */
    function updateLastUpdated(timestamp) {
        const element = document.getElementById('last-updated');
        if (element && timestamp) {
            const date = new Date(timestamp);
            element.textContent = date.toLocaleString(CONFIG.language);
        }
    }

    /**
     * 統計を更新
     */
    function updateStatistics() {
        const counts = {};
        Object.keys(TYPE_CONFIG).forEach(type => counts[type] = 0);
        
        state.activities.forEach(activity => {
            if (counts.hasOwnProperty(activity.type)) {
                counts[activity.type]++;
            }
        });

        Object.entries(counts).forEach(([type, count]) => {
            const element = document.getElementById(`count-${type}`);
            if (element) {
                element.textContent = count;
            }
        });

        // 創作の旅の統計も更新
        updateJourneyStats();
    }

    /**
     * 創作の旅の統計を更新
     */
    function updateJourneyStats() {
        const creationActivities = state.activities.filter(a => a.type === 'creation');
        const totalCreation = creationActivities.length;
        
        // 創作による傾向回復度を計算
        let totalRecovery = 0;
        creationActivities.forEach(activity => {
            if (activity.tendencyChange) {
                Object.values(activity.tendencyChange).forEach(value => {
                    if (value > 0) {
                        totalRecovery += value;
                    }
                });
            }
        });
        
        const recoveryPercent = totalCreation > 0 ? Math.round(totalRecovery / totalCreation) : 0;
        
        // 活動日数
        const uniqueDates = [...new Set(state.activities.map(a => a.date))];
        
        // 更新
        const totalElement = document.getElementById('journey-total');
        const recoveryElement = document.getElementById('journey-recovery');
        const daysElement = document.getElementById('journey-days');
        
        if (totalElement) totalElement.textContent = totalCreation;
        if (recoveryElement) recoveryElement.textContent = `${recoveryPercent}%`;
        if (daysElement) daysElement.textContent = uniqueDates.length;
        
        // ジャーニータイムラインを描画
        renderJourneyTimeline();
    }

    /**
     * ジャーニータイムラインを描画
     */
    function renderJourneyTimeline() {
        const container = document.getElementById('journey-timeline');
        if (!container) return;

        const creationActivities = state.activities
            .filter(a => a.type === 'creation' || a.tendencyChange)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (creationActivities.length === 0) {
            container.innerHTML = '<p class="no-journey">まだ創作活動がありません</p>';
            return;
        }

        container.innerHTML = creationActivities.map(activity => {
            const isCreation = activity.type === 'creation';
            const title = activity.title[CONFIG.language] || activity.title.en;
            const date = new Date(activity.date).toLocaleDateString(CONFIG.language);
            
            let tendencyText = '';
            if (activity.tendencyChange) {
                const changes = Object.entries(activity.tendencyChange)
                    .filter(([_, value]) => value !== 0)
                    .map(([key, value]) => {
                        const sign = value > 0 ? '+' : '';
                        const className = value > 0 ? 'positive' : 'negative';
                        return `<span class="${className}">${key}: ${sign}${value}%</span>`;
                    })
                    .join(' ');
                
                if (changes) {
                    tendencyText = `<div class="journey-tendency">${changes}</div>`;
                }
            }

            return `
                <div class="journey-item ${isCreation ? 'creation' : 'recovery'}" data-id="${activity.id}">
                    <div class="journey-date">${date}</div>
                    <div class="journey-title">${isCreation ? '✨ ' : '💜 '}${title}</div>
                    ${tendencyText}
                </div>
            `;
        }).join('');
    }

    /**
     * タイムラインを描画
     */
    function renderTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        container.innerHTML = '';

        state.filteredActivities.forEach(activity => {
            const item = createTimelineItem(activity);
            container.appendChild(item);
        });
    }

    /**
     * タイムラインアイテムを作成
     */
    function createTimelineItem(activity) {
        const div = document.createElement('div');
        div.className = `timeline-item type-${activity.type}`;
        div.dataset.id = activity.id;

        const typeConfig = TYPE_CONFIG[activity.type] || {};
        const title = activity.title[CONFIG.language] || activity.title.en;
        const description = activity.description[CONFIG.language] || activity.description.en;
        
        div.innerHTML = `
            <div class="timeline-date">${formatDate(activity.date)} ${activity.time || ''}</div>
            <div class="timeline-title">${typeConfig.icon || ''} ${escapeHtml(title)}</div>
            <div class="timeline-description">${escapeHtml(description)}</div>
            ${activity.tags ? `
                <div class="timeline-tags">
                    ${activity.tags.map(tag => `<span class="timeline-tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="timeline-meta">
                ${activity.duration ? `<span>⏱️ ${activity.duration}min</span>` : ''}
                ${activity.energy ? `<span>⚡ ${'★'.repeat(activity.energy)}</span>` : ''}
            </div>
        `;

        div.addEventListener('click', () => showActivityDetail(activity));
        
        return div;
    }

    /**
     * 日付をフォーマット
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
        return date.toLocaleDateString(CONFIG.language, options);
    }

    /**
     * HTMLエスケープ
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * アクティビティ詳細をモーダルで表示
     */
    function showActivityDetail(activity) {
        const modal = document.getElementById('activity-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalBody) return;

        const typeConfig = TYPE_CONFIG[activity.type] || {};
        const title = activity.title[CONFIG.language] || activity.title.en;
        const description = activity.description[CONFIG.language] || activity.description.en;
        const typeLabel = typeConfig.label[CONFIG.language] || typeConfig.label.en;

        let tendencyHtml = '';
        if (activity.tendencyChange) {
            const changes = Object.entries(activity.tendencyChange)
                .filter(([_, value]) => value !== 0)
                .map(([key, value]) => {
                    const sign = value > 0 ? '+' : '';
                    return `<span class="tendency-change ${value > 0 ? 'positive' : 'negative'}">${key}: ${sign}${value}%</span>`;
                })
                .join('');
            
            if (changes) {
                tendencyHtml = `
                    <div class="detail-section">
                        <h4>📈 傾向変動 / Tendency Changes</h4>
                        <div class="tendency-changes">${changes}</div>
                    </div>
                `;
            }
        }

        let relatedWorksHtml = '';
        if (activity.relatedWorks && activity.relatedWorks.length > 0) {
            relatedWorksHtml = `
                <div class="detail-section">
                    <h4>🔗 関連作品 / Related Works</h4>
                    <div class="related-works">
                        ${activity.relatedWorks.map(work => `
                            <a href="${work.path}" class="related-work">${work.type === 'poem' ? '📝' : '📖'} ${escapeHtml(work.title)}</a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        modalBody.innerHTML = `
            <div class="activity-detail">
                <span class="type-badge ${activity.type}">${typeConfig.icon || ''} ${typeLabel}</span>
                <h3>${escapeHtml(title)}</h3>
                <p class="activity-date">📅 ${formatDate(activity.date)}</p>
                
                <div class="detail-section">
                    <h4>📝 詳細 / Description</h4>
                    <p>${escapeHtml(description)}</p>
                </div>
                
                ${tendencyHtml}
                ${relatedWorksHtml}
                
                ${activity.tags ? `
                    <div class="detail-section">
                        <h4>🏷️ タグ / Tags</h4>
                        <div class="timeline-tags">
                            ${activity.tags.map(tag => `<span class="timeline-tag">#${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${activity.source ? `
                    <div class="detail-section">
                        <h4>📄 出典 / Source</h4>
                        <p><code>${escapeHtml(activity.source)}</code></p>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    /**
     * 傾向グラフを描画（簡易版）
     */
    function renderTendencyChart() {
        const canvas = document.getElementById('tendency-chart');
        if (!canvas) return;

        // シンプルなテキスト表示で代替（Chart.jsなしでも動作）
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // 活動タイプごとの傾向変動を集計
        const typeTendencies = {};
        Object.keys(TYPE_CONFIG).forEach(type => {
            typeTendencies[type] = { growth: 0, connection: 0, creation: 0, expression: 0, security: 0 };
        });

        state.activities.forEach(activity => {
            if (activity.tendencyChange && typeTendencies[activity.type]) {
                Object.entries(activity.tendencyChange).forEach(([key, value]) => {
                    if (typeTendencies[activity.type][key] !== undefined) {
                        typeTendencies[activity.type][key] += value;
                    }
                });
            }
        });

        // 簡易ビジュアライゼーション
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.fillText(CONFIG.language === 'ja' ? '傾向変動サマリー' : 'Tendency Change Summary', 10, 20);

        let y = 50;
        const types = Object.keys(TYPE_CONFIG);
        types.forEach((type, index) => {
            const config = TYPE_CONFIG[type];
            const changes = typeTendencies[type];
            const totalChange = Object.values(changes).reduce((a, b) => a + b, 0);
            
            ctx.fillStyle = config.color;
            ctx.fillRect(10, y - 10, 20, 20);
            
            ctx.fillStyle = '#ccc';
            ctx.fillText(`${config.icon} ${config.label[CONFIG.language]}: ${totalChange > 0 ? '+' : ''}${totalChange}`, 40, y + 5);
            
            y += 35;
        });

        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.fillText(CONFIG.language === 'ja' ? '(各活動タイプによる傾向値への影響合計)' : '(Total tendency impact by activity type)', 10, y + 10);
    }

    /**
     * フィルターを適用
     */
    function applyFilter(filterType) {
        state.currentFilter = filterType;
        
        if (filterType === 'all') {
            state.filteredActivities = [...state.activities];
        } else {
            state.filteredActivities = state.activities.filter(a => a.type === filterType);
        }
        
        applySort();
        renderTimeline();
    }

    /**
     * ソートを適用
     */
    function applySort() {
        const [field, order] = state.currentSort.split('-');
        
        state.filteredActivities.sort((a, b) => {
            let comparison = 0;
            
            if (field === 'date') {
                comparison = new Date(a.date) - new Date(b.date);
            } else if (field === 'energy') {
                comparison = (a.energy || 0) - (b.energy || 0);
            }
            
            return order === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * エラーを表示
     */
    function showError(message) {
        const container = document.getElementById('timeline-container');
        if (container) {
            container.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        // フィルターボタン
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                applyFilter(e.target.dataset.filter);
            });
        });

        // サマリーカードクリック
        document.querySelectorAll('.summary-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector(`.filter-btn[data-filter="${type}"]`)?.classList.add('active');
                applyFilter(type);
            });
        });

        // ソートセレクト
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                state.currentSort = e.target.value;
                applySort();
                renderTimeline();
            });
        }

        // モーダル閉じる
        const modal = document.getElementById('activity-modal');
        const modalClose = document.querySelector('.modal-close');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // ESCキーでモーダル閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    /**
     * 初期化
     */
    function init() {
        setupEventListeners();
        loadData();
    }

    // DOMContentLoadedで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
