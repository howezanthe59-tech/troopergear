import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

type SeoConfig = {
  title?: string | null;
  description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly brand = 'TrooperGear';

  constructor(private title: Title, private meta: Meta) {}

  update(config: SeoConfig = {}) {
    const title = this.buildTitle(config.title);
    this.title.setTitle(title);

    const description = String(config.description || '').trim();
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    }
  }

  private buildTitle(pageTitle?: string | null) {
    const raw = String(pageTitle || '').trim();
    if (!raw) return this.brand;
    if (raw.toLowerCase().includes(this.brand.toLowerCase())) return raw;
    return `${raw} | ${this.brand}`;
  }
}

