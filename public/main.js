document.addEventListener('DOMContentLoaded', () => {
    const revealTargets = document.querySelectorAll('.reveal');
    const reportForm = document.querySelector('[data-report-form]');
    const reportStatus = reportForm ? reportForm.querySelector('.form-status') : null;

    const marketGrid = document.querySelector('[data-market-grid]');
    const marketSummary = document.querySelector('[data-market-summary]');
    const exchangeGrid = document.querySelector('[data-exchange-grid]');
    const newsGrid = document.querySelector('[data-news-grid]');

    const API_CONFIG = {
        coinpaprikaBase: 'https://api.coinpaprika.com/v1',
        newsEndpoint: 'https://newsapi.org/v2/everything',
        newsQuery: 'bitcoin OR crypto OR blockchain',
        newsApiKey: '',
    };

    const MARKET_COINS = [
        { id: 'btc-bitcoin', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'eth-ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'sol-solana', name: 'Solana', symbol: 'SOL' },
        { id: 'xrp-xrp', name: 'XRP', symbol: 'XRP' },
        { id: 'ada-cardano', name: 'Cardano', symbol: 'ADA' },
    ];

    const SAMPLE_MARKET = [
        { name: 'Bitcoin', symbol: 'BTC', price: 42850, change: 2.6 },
        { name: 'Ethereum', symbol: 'ETH', price: 2450, change: -1.4 },
        { name: 'Solana', symbol: 'SOL', price: 96, change: 3.1 },
        { name: 'XRP', symbol: 'XRP', price: 0.62, change: 0.8 },
        { name: 'Cardano', symbol: 'ADA', price: 0.52, change: -0.4 },
    ];

    const SAMPLE_EXCHANGES = [
        { name: 'Binance', volume: 12800000000 },
        { name: 'Coinbase', volume: 4200000000 },
        { name: 'Upbit', volume: 2400000000 },
    ];

    const SAMPLE_NEWS = [
        {
            tag: 'Market Watch',
            title: 'BTC 변동성 확대, 단기 수급 체크 필요',
            summary: '급격한 체결량 변화가 감지되어 단기 리스크 관리 필요.',
            meta: '샘플 · 20분 전',
            source: '출처: 공개 기사 링크',
        },
        {
            tag: 'Global Pulse',
            title: '미국 ETF 자금 흐름 변화',
            summary: '유입 둔화 구간에서 장기 포지션 전략 점검.',
            meta: '샘플 · 45분 전',
            source: '출처: 공개 기사 링크',
        },
        {
            tag: 'Beginner Tip',
            title: '초보자 리스크 컷 기준 정리',
            summary: '손절선 설정과 심리 흔들림 방지 핵심 포인트.',
            meta: '샘플 · 1시간 전',
            source: '출처: 공개 기사 링크',
        },
    ];

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach((item) => item.classList.add('is-visible'));
        setupReportForm();
        loadMarketData();
        loadNews();
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );

    revealTargets.forEach((item) => observer.observe(item));
    setupReportForm();
    loadMarketData();
    loadNews();

    function setupReportForm() {
        if (!reportForm) return;

        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (reportStatus) reportStatus.textContent = '신고를 전송 중입니다...';

            try {
                const response = await fetch(reportForm.action, {
                    method: 'POST',
                    body: new FormData(reportForm),
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (response.ok) {
                    reportForm.reset();
                    if (reportStatus) {
                        reportStatus.textContent = '신고가 접수되었습니다. 감사합니다.';
                    }
                    return;
                }

                if (reportStatus) {
                    reportStatus.textContent = '접수에 실패했습니다. 잠시 후 다시 시도해주세요.';
                }
            } catch (error) {
                if (reportStatus) {
                    reportStatus.textContent = '네트워크 오류가 발생했습니다.';
                }
            }
        });
    }

    async function loadMarketData() {
        if (!marketGrid || !marketSummary || !exchangeGrid) return;

        try {
            const base = API_CONFIG.coinpaprikaBase;
            const globalPromise = fetch(`${base}/global`).then((res) => res.json());
            const tickerPromises = MARKET_COINS.map((coin) =>
                fetch(`${base}/tickers/${coin.id}`).then((res) => res.json())
            );
            const exchangePromise = fetch(`${base}/exchanges`).then((res) => res.json());

            const [globalData, tickers, exchanges] = await Promise.all([
                globalPromise,
                Promise.all(tickerPromises),
                exchangePromise,
            ]);

            renderMarketSummary(globalData);
            renderMarketCards(
                tickers.map((item) => ({
                    name: item.name,
                    symbol: item.symbol,
                    price: item.quotes?.USD?.price || 0,
                    change: item.quotes?.USD?.percent_change_24h || 0,
                }))
            );

            const topExchanges = Array.isArray(exchanges)
                ? [...exchanges]
                      .sort((a, b) => (b.reported_volume_24h || 0) - (a.reported_volume_24h || 0))
                      .slice(0, 3)
                : [];

            renderExchanges(
                topExchanges.map((item) => ({
                    name: item.name,
                    volume: item.reported_volume_24h || 0,
                }))
            );
        } catch (error) {
            renderMarketSummary({ market_cap_usd: 1.3e12, volume_24h_usd: 6.8e10, bitcoin_dominance_percentage: 49.2 });
            renderMarketCards(SAMPLE_MARKET);
            renderExchanges(SAMPLE_EXCHANGES);
        }
    }

    function renderMarketSummary(globalData) {
        const cards = marketSummary.querySelectorAll('.summary-card strong');
        if (cards.length < 3) return;
        cards[0].textContent = formatUSD(globalData.market_cap_usd || globalData.market_cap_usd_24h || 0);
        cards[1].textContent = formatUSD(globalData.volume_24h_usd || 0);
        cards[2].textContent = `${(globalData.bitcoin_dominance_percentage || 0).toFixed(1)}%`;
    }

    function renderMarketCards(items) {
        marketGrid.innerHTML = '';
        items.forEach((item) => {
            const changeClass = item.change >= 0 ? 'up' : 'down';
            const card = document.createElement('article');
            card.className = 'market-card';
            card.innerHTML = `
                <h4>${item.name} · ${item.symbol}</h4>
                <div class="market-price">${formatUSD(item.price)}</div>
                <div class="market-change ${changeClass}">${formatChange(item.change)}</div>
            `;
            marketGrid.appendChild(card);
        });
    }

    function renderExchanges(items) {
        exchangeGrid.innerHTML = '';
        items.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'exchange-card';
            card.innerHTML = `
                <span>Top Exchange</span>
                <strong>${item.name}</strong>
                <div>24H Volume: ${formatUSD(item.volume)}</div>
            `;
            exchangeGrid.appendChild(card);
        });
    }

    async function loadNews() {
        if (!newsGrid) return;

        if (!API_CONFIG.newsApiKey) {
            renderNews(SAMPLE_NEWS);
            return;
        }

        try {
            const url = `${API_CONFIG.newsEndpoint}?q=${encodeURIComponent(
                API_CONFIG.newsQuery
            )}&pageSize=6&sortBy=publishedAt&apiKey=${API_CONFIG.newsApiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (!data.articles || !Array.isArray(data.articles)) {
                renderNews(SAMPLE_NEWS);
                return;
            }

            const items = data.articles.slice(0, 6).map((article) => ({
                tag: article.source?.name || 'NEWS',
                title: article.title || '제목 없음',
                summary: article.description || '요약 정보가 없습니다.',
                meta: article.publishedAt ? formatDate(article.publishedAt) : '최근',
                source: article.url || '#',
            }));

            renderNews(items);
        } catch (error) {
            renderNews(SAMPLE_NEWS);
        }
    }

    function renderNews(items) {
        newsGrid.innerHTML = '';
        items.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'news-card';
            const tag = document.createElement('span');
            tag.className = 'news-tag';
            tag.textContent = item.tag;

            const title = document.createElement('h3');
            title.textContent = item.title;

            const summary = document.createElement('p');
            summary.textContent = item.summary;

            const meta = document.createElement('div');
            meta.className = 'news-meta';
            meta.textContent = item.meta;

            const source = document.createElement('div');
            source.className = 'news-source';
            if (item.source && item.source !== '#') {
                const link = document.createElement('a');
                link.className = 'text-link';
                link.href = safeUrl(item.source);
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '원문 보기';
                source.append('출처: ');
                source.appendChild(link);
            } else {
                source.textContent = '출처: 공개 기사 링크';
            }

            card.append(tag, title, summary, meta, source);
            newsGrid.appendChild(card);
        });
    }

    function formatUSD(value) {
        if (!Number.isFinite(value)) return '$0';
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toFixed(2)}`;
    }

    function formatChange(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}% (24H)`;
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '최근';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
            date.getDate()
        ).padStart(2, '0')}`;
    }

    function safeUrl(url) {
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.toString();
            }
        } catch (error) {
            return '#';
        }
        return '#';
    }
});
