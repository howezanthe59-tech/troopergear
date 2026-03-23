import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  productImageUrl(image?: string | null): string {
    const raw = String(image || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/uploads/')) return `${this.baseUrl}${raw}`;
    if (raw.startsWith('uploads/')) return `${this.baseUrl}/${raw}`;
    return `/assets/media/${raw}`;
  }
}

