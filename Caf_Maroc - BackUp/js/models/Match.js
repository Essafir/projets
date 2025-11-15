// js/models/Match.js
export class Match {
  constructor(data) {
    this.id = data.id;
    this.date = new Date(data.date);
    this.teamA = data.teamA;
    this.teamB = data.teamB;
    this.stade = data.stade;
    this.logoA = data.logoA || `https://via.placeholder.com/40?text=${data.teamA.charAt(0)}`;
    this.logoB = data.logoB || `https://via.placeholder.com/40?text=${data.teamB.charAt(0)}`;
  }

  getFormattedDate() {
    return this.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getFormattedTime() {
    return this.date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}