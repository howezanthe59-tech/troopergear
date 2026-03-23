import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private seo: SeoService
  ) {}

  ngOnInit() {
    const updateSeo = () => {
      const data = this.getActiveRouteData(this.route);
      const title = typeof data['title'] === 'string' ? data['title'] : null;
      const description = typeof data['description'] === 'string' ? data['description'] : null;
      this.seo.update({
        title,
        description
      });
    };

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(updateSeo);

    updateSeo();
  }

  skipToContent(event: Event) {
    event.preventDefault();
    const el = document.getElementById('main-content');
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: 'start' });
  }

  private getActiveRouteData(route: ActivatedRoute): Record<string, unknown> {
    let current: ActivatedRoute | null = route;
    let lastWithData: Record<string, unknown> = {};
    while (current) {
      const data = current.snapshot?.data || {};
      if (data && (data['title'] || data['description'])) {
        lastWithData = data;
      }
      current = current.firstChild || null;
    }
    return lastWithData;
  }
}
