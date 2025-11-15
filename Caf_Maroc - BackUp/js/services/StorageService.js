// js/services/StorageService.js
export class StorageService {
  static get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static add(key, item) {
    const items = this.get(key);
    items.push(item);
    this.set(key, items);
  }
}