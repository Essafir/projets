// js/models/Stade.js
import { GPSService } from '../services/GPSService.js';

export class Stade {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.city = data.city;
    this.capacity = data.capacity;
    this.gps = data.gps;
    this.description = data.description || "Aucune description disponible.";
    this.images = data.images || [];
  }

  toHTML() {
    const mainImage = this.images[0] || 'https://via.placeholder.com/400x300?text=Stade+Inconnu';
    const thumbnails = this.images.slice(1, 4); // max 3 miniatures

    return `
      <div class="stade-card" id="stade-${this.id}">
        <div class="stade-image-main">
          <img src="${mainImage}" alt="${this.name}" loading="lazy">
        </div>

        <div class="stade-info">
          <h3 class="stade-title">${this.name}</h3>
          <div class="stade-meta">
            <span><span class="icon">📍</span> ${this.city}</span>
            <span><span class="icon">🏟️</span> ${this.capacity.toLocaleString()} places</span>
          </div>

          <div class="stade-description">
            ${this.description}
          </div>

          <a href="#" class="btn-localisation" onclick="GPSService.openInMaps(${this.gps.lat}, ${this.gps.lng})">
            <span>🗺️</span> Accéder à la localisation
          </a>
        </div>

        ${thumbnails.length > 0 ? `
          <div class="stade-thumbnails">
            ${thumbnails.map(img => `
              <div class="stade-thumbnail" onclick="changeMainImage('${this.id}', '${img}')">
                <img src="${img}" alt="Miniature" loading="lazy">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
}