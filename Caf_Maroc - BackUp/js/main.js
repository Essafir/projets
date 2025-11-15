// js/main.js
import { Match } from './models/Match.js';
import { Stade } from './models/Stades.js'; // ✅ Correction : Stade.js (pas Stades.js)
import { GPSService } from './services/GPSService.js';

// ✅ Rendre les fonctions accessibles depuis le HTML
window.GPSService = GPSService;
window.changeMainImage = function(stadeId, newImageUrl) {
  const card = document.getElementById(`stade-${stadeId}`);
  if (!card) return;
  const mainImage = card.querySelector('.stade-image-main img');
  if (mainImage) {
    mainImage.style.opacity = '0';
    setTimeout(() => {
      mainImage.src = newImageUrl;
      mainImage.style.opacity = '1';
    }, 150);
  }
};

const page = window.location.pathname.split('/').pop();

document.addEventListener('DOMContentLoaded', async () => {
  if (page === 'matches.html') {
    const res = await fetch('data/matches.json');
    const matchesData = await res.json();
    const matches = matchesData.map(m => new Match(m));

    function formatTime(date) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    function filterMatches(filter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (filter) {
        case 'today': return matches.filter(m => new Date(m.date).toDateString() === today.toDateString());
        case 'tomorrow': return matches.filter(m => new Date(m.date).toDateString() === tomorrow.toDateString());
        case 'week': return matches.filter(m => {
          const d = new Date(m.date);
          return d >= today && d <= nextWeek;
        });
        default: return matches;
      }
    }

    function renderMatches(filteredMatches) {
      const container = document.getElementById('matches-list');
      if (filteredMatches.length === 0) {
        container.innerHTML = '<p>Aucun match trouvé pour ce filtre.</p>';
        return;
      }

      container.innerHTML = filteredMatches.map(match => `
        <div class="match-item">
          <div class="team">
            <img src="${match.logoA}" alt="${match.teamA}" loading="lazy">
            <span>${match.teamA}</span>
          </div>
          <div class="time-status">
            <div class="time">${formatTime(match.date)}</div>
            <div class="status">${match.stade}</div>
            <div class="competition">${match.date.toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="team">
          <span>${match.teamB}</span>
            <img src="${match.logoB}" alt="${match.teamB}" loading="lazy">
            
          </div>
        </div>
      `).join('');
    }

    renderMatches(filterMatches('today'));

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMatches(filterMatches(btn.dataset.filter));
      });
    });
  }

  else if (page === 'stades.html') {
    const res = await fetch('data/stades.json');
    const stadesData = await res.json();
    const container = document.getElementById('stades-list');
    container.innerHTML = stadesData.map(s => new Stade(s).toHTML()).join('');
  }
});