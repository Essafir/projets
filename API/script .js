const conteneurResultats = document.getElementById('resultats');
const API_BASE = 'https://api.coingecko.com/api/v3';

// 1. Top 10 cryptomonnaies par market cap
async function chargerTopCryptos() {
    try {
        conteneurResultats.innerHTML = '<p>🔄 Chargement des cryptos...</p>';
        
        const reponse = await fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`);
        
        if (!reponse.ok) throw new Error('Erreur API Crypto');
        
        const cryptos = await reponse.json();
        
        let html = '<h2>🏆 Top 10 Cryptomonnaies</h2>';
        
        cryptos.forEach((crypto, index) => {
            const variation = crypto.price_change_percentage_24h;
            const couleurVariation = variation >= 0 ? 'green' : 'red';
            const emoji = getEmojiRang(index + 1);
            
            html += `
                <div style="border: 1px solid #ccc; margin: 10px 0; padding: 10px;">
                    <h3>${emoji} ${index + 1}. ${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
                    <ul>
                        <li><strong>💰 Prix:</strong> $${crypto.current_price.toLocaleString()}</li>
                        <li><strong>📈 Variation 24h:</strong> <span style="color: ${couleurVariation}">${variation ? variation.toFixed(2) : 'N/A'}%</span></li>
                        <li><strong>🏦 Market Cap:</strong> $${crypto.market_cap.toLocaleString()}</li>
                        <li><strong>📊 Volume 24h:</strong> $${crypto.total_volume.toLocaleString()}</li>
                        <li><strong>🎯 Rang:</strong> ${crypto.market_cap_rank}</li>
                    </ul>
                </div>
            `;
        });
        
        conteneurResultats.innerHTML = html;
        
    } catch (erreur) {
        conteneurResultats.innerHTML = `<p style="color: red;">❌ Erreur: ${erreur.message}</p>`;
    }
}

// 2. Détails Bitcoin
async function chargerBitcoin() {
    try {
        conteneurResultats.innerHTML = '<p>🔄 Chargement Bitcoin...</p>';
        
        const reponse = await fetch(`${API_BASE}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
        
        if (!reponse.ok) throw new Error('Erreur Bitcoin');
        
        const bitcoin = await reponse.json();
        
        const html = `
            <h2>₿ Détails Bitcoin</h2>
            <div style="border: 2px solid gold; padding: 15px;">
                <h3>${bitcoin.name} (${bitcoin.symbol.toUpperCase()})</h3>
                <p><strong>💰 Prix actuel:</strong> $${bitcoin.market_data.current_price.usd.toLocaleString()}</p>
                <p><strong>📈 Plus haut 24h:</strong> $${bitcoin.market_data.high_24h.usd.toLocaleString()}</p>
                <p><strong>📉 Plus bas 24h:</strong> $${bitcoin.market_data.low_24h.usd.toLocaleString()}</p>
                <p><strong>🎯 Variation 24h:</strong> ${bitcoin.market_data.price_change_percentage_24h.toFixed(2)}%</p>
                <p><strong🏦> Market Cap:</strong> $${bitcoin.market_data.market_cap.usd.toLocaleString()}</p>
                <p><strong>📊 Rang:</strong> ${bitcoin.market_cap_rank}</p>
                <p><strong>🔗 Site web:</strong> <a href="${bitcoin.links.homepage[0]}" target="_blank">${bitcoin.links.homepage[0]}</a></p>
            </div>
        `;
        
        conteneurResultats.innerHTML = html;
        
    } catch (erreur) {
        conteneurResultats.innerHTML = `<p style="color: red;">❌ Erreur: ${erreur.message}</p>`;
    }
}

// 3. Détails Ethereum
async function chargerEthereum() {
    try {
        conteneurResultats.innerHTML = '<p>🔄 Chargement Ethereum...</p>';
        
        const reponse = await fetch(`${API_BASE}/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
        
        if (!reponse.ok) throw new Error('Erreur Ethereum');
        
        const ethereum = await reponse.json();
        
        const html = `
           h2>Ξ Détails Ethereum</h2>
            <div style="border: 2px solid silver; padding: 15px;">
                <h3>${ethereum.name} (${ethereum.symbol.toUpperCase()})</h3>
                <p><strong>💰 Prix actuel:</strong> $${ethereum.market_data.current_price.usd.toLocaleString()}</p>
                <p><strong>📈 Plus haut 24h:</strong> $${ethereum.market_data.high_24h.usd.toLocaleString()}</p>
                <p><strong>📉 Plus bas 24h:</strong> $${ethereum.market_data.low_24h.usd.toLocaleString()}</p>
                <p><strong>🎯 Variation 24h:</strong> ${ethereum.market_data.price_change_percentage_24h.toFixed(2)}%</p>
                <p><strong>🏦 Market Cap:</strong> $${ethereum.market_data.market_cap.usd.toLocaleString()}</p>
                <p><strong>📊 Rang:</strong> ${ethereum.market_cap_rank}</p>
                <p><strong>🔗 Site web:</strong> <a href="${ethereum.links.homepage[0]}" target="_blank">${ethereum.links.homepage[0]}</a></p>
            </div>
        `;
        
        conteneurResultats.innerHTML = html;
        
    } catch (erreur) {
        conteneurResultats.innerHTML = `<p style="color: red;">❌ Erreur: ${erreur.message}</p>`;
    }
}

// 4. Cryptos tendances
async function chargerTrending() {
    try {
        conteneurResultats.innerHTML = '<p>🔄 Chargement des tendances...</p>';
        
        const reponse = await fetch(`${API_BASE}/search/trending`);
        
        if (!reponse.ok) throw new Error('Erreur tendances');
        
        const trending = await reponse.json();
        
        let html = '<h2>🚀 Cryptos Tendances du Moment</h2>';
        
        trending.coins.slice(0, 7).forEach((crypto, index) => {
            const coin = crypto.item;
            html += `
                <div style="border: 1px solid #ddd; margin: 8px 0; padding: 10px;">
                    <h3>${index + 1}. ${coin.name} (${coin.symbol})</h3>
                    <p><strong>🎯 Rang Market Cap:</strong> ${coin.market_cap_rank || 'N/A'}</p>
                    <p><strong>📊 Score de tendance:</strong> ${crypto.score}</p>
                </div>
            `;
        });
        
        conteneurResultats.innerHTML = html;
        
    } catch (erreur) {
        conteneurResultats.innerHTML = `<p style="color: red;">❌ Erreur: ${erreur.message}</p>`;
    }
}

// Fonction utilitaire pour les emojis de rang
function getEmojiRang(rang) {
    switch(rang) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🔸';
    }
}

// Charger automatiquement le top 10 au démarrage
window.addEventListener('load', chargerTopCryptos);