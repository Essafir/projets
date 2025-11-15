const inputRecherche = document.getElementById("recherche");
const divResultat = document.getElementById("resultat");

function show(msg) {
  divResultat.innerHTML = `<p>${msg}</p>`;
}

async function chercherCrypto() {
  const q = inputRecherche.value.trim().toLowerCase();
  if (!q) {
    show("Veuillez entrer le nom d'une crypto (ex: bitcoin)");
    return;
  }

  show("Recherche...");

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
      q
    )}`;
    const reponse = await fetch(url);
    if (!reponse.ok) {
      throw new Error(`HTTP ${reponse.status}`);
    }
    const crypto = await reponse.json();

    divResultat.innerHTML = `
            <h2>${crypto.name} (${crypto.symbol.toUpperCase()})</h2>
            <p><strong>Prix actuel:</strong> $${
              crypto.market_data.current_price.usd
            }</p>
            <p><strong>Plus haut 24h:</strong> $${
              crypto.market_data.high_24h.usd
            }</p>
            <p><strong>Plus bas 24h:</strong> $${
              crypto.market_data.low_24h.usd
            }</p>
            <p><strong>Market Cap:</strong> $${
              crypto.market_data.market_cap.usd
            }</p>
        `;
  } catch (err) {
    console.error("Erreur chercherCrypto:", err);
    show(
      "Crypto non trouvée ou erreur réseau. Vérifiez la console pour détails."
    );
  }
}

// Permet lancer la recherche avec Enter
if (inputRecherche) {
  inputRecherche.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      chercherCrypto();
    }
  });
}
