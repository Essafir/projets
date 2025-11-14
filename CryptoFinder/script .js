function chercherCrypto() {
    const nom = document.getElementById('recherche').value;
    const resultat = document.getElementById('resultat');
    
    if (!nom) {
        resultat.innerHTML = "Écrivez un nom de crypto";
        return;
    }
    
    resultat.innerHTML = "Recherche en cours...";
    
    // Testez d'abord si l'API répond
    fetch(`https://api.coingecko.com/api/v3/ping`)
    .then(() => {
        // Si le ping fonctionne, faire la recherche
        return fetch(`https://api.coingecko.com/api/v3/coins/${nom.toLowerCase()}`);
    })
    .then(reponse => {
        if (!reponse.ok) throw new Error('Non trouvé');
        return reponse.json();
    })
    .then(data => {
        resultat.innerHTML = `
            <h3>${data.name} (${data.symbol.toUpperCase()})</h3>
            <p>💰 Prix: $${data.market_data.current_price.usd}</p>
            <p>📈 24h: ${data.market_data.price_change_percentage_24h}%</p>
        `;
    })
    .catch(erreur => {
        resultat.innerHTML = `Erreur: ${nom} non trouvé ou problème API`;
        console.error('Erreur:', erreur);
    });
}

// Entrée pour rechercher
document.getElementById('recherche').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') chercherCrypto();
});