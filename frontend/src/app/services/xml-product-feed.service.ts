import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IGearItem } from '../models/gear-item.model';

@Injectable({ providedIn: 'root' })
export class XmlProductFeedService {
  private readonly feedUrl = 'assets/data/products.xml';

  constructor(private http: HttpClient) {}

  fetchProducts(): Observable<IGearItem[]> {
    return this.http
      .get(this.feedUrl, { responseType: 'text' })
      .pipe(map((xml) => this.parse(xml)));
  }

  private parse(xml: string): IGearItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(xml || ''), 'application/xml');
    const errors = doc.getElementsByTagName('parsererror');
    if (errors && errors.length > 0) {
      throw new Error('Invalid XML feed');
    }

    const nodes = Array.from(doc.getElementsByTagName('product'));
    const products = nodes
      .map((node) => {
        const id = this.toInt(this.text(node, 'id'));
        const name = this.text(node, 'name');
        const category = this.text(node, 'category');
        const activity = this.text(node, 'activity');
        const description = this.text(node, 'description');
        const price = this.toNumber(this.text(node, 'price'));
        const stock = this.toInt(this.text(node, 'stock'));
        const badge = this.text(node, 'badge');
        const image = this.normalizeImagePath(this.text(node, 'image'));

        const item: IGearItem = {
          id: id ?? 0,
          name: name || '',
          type: category || '',
          activity: activity || undefined,
          description: description || '',
          price: price ?? 0,
          stock: stock ?? 0,
          badge: badge || undefined,
          image: image || '',
          capacity: undefined
        };

        return item;
      })
      .filter((p) => p.id > 0 && !!p.name && !!p.type);

    return products;
  }

  private text(parent: Element, tagName: string): string {
    const el = parent.getElementsByTagName(tagName)[0];
    const raw = el?.textContent ?? '';
    return String(raw).trim();
  }

  private toNumber(value: string): number | null {
    const n = Number(String(value || '').trim());
    return Number.isFinite(n) ? n : null;
  }

  private toInt(value: string): number | null {
    const n = Number.parseInt(String(value || '').trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  private normalizeImagePath(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/uploads/')) return raw;
    if (raw.startsWith('uploads/')) return `/${raw}`;
    const file = raw.split(/[\\/]/).pop() || raw;
    return `/uploads/products/${file}`;
  }
}

