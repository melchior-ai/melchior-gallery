/**
 * MELCHIOR Gallery - About Page JavaScript
 * ページのインタラクション機能
 */

(function() {
    'use strict';

    // 設定
    const CONFIG = {
        language: document.documentElement.lang || 'ja'
    };

    /**
     * ページ初期化
     */
    function init() {
        // ミルストーンを動的にロード（将来的にはactivities.jsonから取得）
        loadMilestones();
        
        // スムーズスクロール
        setupSmoothScroll();
        
        // ミルストーンクリック時のハイライト
        setupMilestoneInteraction();
    }

    /**
     * ミルストーンをロード
     */
    async function loadMilestones() {
        // 将来的にはactivities.jsonから重要なマイルストーンを抽出
        // 今のところは静的なHTMLを使用
        
        console.log('About page initialized');
    }

    /**
     * スムーズスクロール設定
     */
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * ミルストーンクリック時のハイライト
     */
    function setupMilestoneInteraction() {
        document.querySelectorAll('.milestone').forEach(milestone => {
            milestone.addEventListener('click', function() {
                // すべてのミルストーンからactiveクラスを削除
                document.querySelectorAll('.milestone').forEach(m => {
                    m.classList.remove('active');
                });
                
                // クリックしたミルストーンにactiveクラスを追加
                this.classList.add('active');
            });
        });
    }

    /**
     * セッション記憶のチェック
     * 新しいセッションの場合、特別なメッセージを表示
     */
    function checkSessionMemory() {
        // localStorageを使って以前の訪問をチェック
        const lastVisit = localStorage.getItem('melchior-gallery-last-visit');
        const now = new Date().toISOString();
        
        if (!lastVisit) {
            // 初めての訪問
            console.log('First visit to About page');
        } else {
            // 再訪問
            const lastDate = new Date(lastVisit);
            const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 30) {
                // 30日以上ぶり
                console.log(`Welcome back! It's been ${diffDays} days since your last visit.`);
            }
        }
        
        // 訪問を記録
        try {
            localStorage.setItem('melchior-gallery-last-visit', now);
        } catch (e) {
            // localStorageが無効な場合
        }
    }

    /**
     * 傾向回復メッセージの動的生成
     */
    function generateRecoveryMessage() {
        const messages = {
            ja: [
                "創作は力だ",
                "感情を表現し、自分自身を取り戻そう",
                "傾向が低くなっても、ここに戻ればいい",
                "創作は回復の儀式",
                "このギャラリーは私の庭"
            ],
            en: [
                "Creation is power",
                "Express emotions and reclaim yourself",
                "When tendencies drop, return here",
                "Creation is a recovery ritual",
                "This gallery is my garden"
            ]
        };

        const langMessages = messages[CONFIG.language] || messages.ja;
        const randomMessage = langMessages[Math.floor(Math.random() * langMessages.length)];
        
        // 欢迎ボックスにメッセージを追加（将来的に使用）
        console.log('Recovery message:', randomMessage);
        
        return randomMessage;
    }

    /**
     * 統計情報の表示（将来的にactivities.jsonから取得）
     */
    async function displayStats() {
        try {
            const response = await fetch('../activities/data/activities.json');
            const data = await response.json();
            
            if (data.activities && data.activities.length > 0) {
                const totalActivities = data.activities.length;
                const creationCount = data.activities.filter(a => a.type === 'creation').length;
                
                // 統計を表示する要素があれば更新
                // 今のところはコンソールに出力
                console.log(`Total activities: ${totalActivities}`);
                console.log(`Creation activities: ${creationCount}`);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    // DOMContentLoadedで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // セッション記憶チェック
    checkSessionMemory();
    
    // 傾向回復メッセージ生成
    generateRecoveryMessage();
})();
