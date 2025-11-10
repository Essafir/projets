const resultats = document.getElementById('resultats');
const recherche = document.getElementById('recherche');

// Afficher le top 10
async function chargerTop10() {
    try {
        resultats.innerHTML = '<p>Chargement...</p>';
        
        const reponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10');
        const cryptos = await reponse.json();
        
        let html = '<h2>Top 10 Cryptos</h2>';
        
        cryptos.forEach((crypto, index) => {
            html += `
                <div>
                    <h3>${index + 1}. ${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
                    <p>Prix: $${crypto.current_price}</p>
                    <p>Variation 24h: ${crypto.price_change_percentage_24h}%</p>
                    <p>Market Cap: $${crypto.market_cap}</p>
                    <button onclick="afficherDetails('${crypto.id}')">Détails</button>
                    <hr>
                </div>
            `;
        });
        
        resultats.innerHTML = html;
        
    } catch (erreur) {
        resultats.innerHTML = '<p>Erreur de chargement</p>';
    }
}

// Rechercher une crypto
async function rechercherCrypto() {
    const nomCrypto = recherche.value.toLowerCase().trim();
    
    if (!nomCrypto) {
        chargerTop10();
        return;
    }
    
    try {
        resultats.innerHTML = '<p>Recherche...</p>';
        
        const reponse = await fetch(`https://api.coingecko.com/api/v3/coins/${nomCrypto}`);
        const crypto = await reponse.json();
        
        const html = `
            <h2>${crypto.name} (${crypto.symbol.toUpperCase()})</h2>
            <p><strong>Prix actuel:</strong> $${crypto.market_data.current_price.usd}</p>
            <p><strong>Plus haut 24h:</strong> $${crypto.market_data.high_24h.usd}</p>
            <p><strong>Plus bas 24h:</strong> $${crypto.market_data.low_24h.usd}</p>
            <p><strong>Market Cap:</strong> $${crypto.market_data.market_cap.usd}</p>
            <p><strong>Rang:</strong> ${crypto.market_cap_rank}</p>
            <button onclick="chargerTop10()">Retour au Top 10</button>
        `;
        
        resultats.innerHTML = html;
        
    } catch (erreur) {
        resultats.innerHTML = '<p>Crypto non trouvée</p>';
    }
}

// Afficher détails d'une crypto
async function afficherDetails(idCrypto) {
    try {
        resultats.innerHTML = '<p>Chargement détails...</p>';
        
        const reponse = await fetch(`https://api.coingecko.com/api/v3/coins/${idCrypto}`);
        const crypto = await reponse.json();
        
        const html = `
            <h2>${crypto.name} (${crypto.symbol.toUpperCase()})</h2>
            <p><strong>Prix actuel:</strong> $${crypto.market_data.current_price.usd}</p>
            <p><strong>Plus haut 24h:</strong> $${crypto.market_data.high_24h.usd}</p>
            <p><strong>Plus bas 24h:</strong> $${crypto.market_data.low_24h.usd}</p>
            <p><strong>Market Cap:</strong> $${crypto.market_data.market_cap.usd}</p>
            <p><strong>Rang:</strong> ${crypto.market_cap_rank}</p>
            <button onclick="chargerTop10()">Retour au Top 10</button>
        `;
        
        resultats.innerHTML = html;
        
    } catch (erreur) {
        resultats.innerHTML = '<p>Erreur détails</p>';
    }
}

// Recherche avec Entrée
recherche.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        rechercherCrypto();
    }
});

// Charger au début
chargerTop10();