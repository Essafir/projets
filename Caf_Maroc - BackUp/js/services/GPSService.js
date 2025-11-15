// js/services/GPSService.js
export class GPSService {
  static openInMaps(lat, lng) {
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isiOS
      ? `maps://?q=${lat},${lng}`
      : `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  }
}
// Expose globally for inline onclick (optional – better with event delegation)
window.GPSService = GPSService;