import { Component, HostListener } from '@angular/core';

type BlogPost = {
  id: string;
  title: string;
  date: string;
  category: 'Guides' | 'Gear' | 'Safety';
  readTime: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  content: string[];
};

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  posts: BlogPost[] = [
    {
      id: 'blue-mountain-pack',
      title: 'Blue Mountain Day Hike: The 10 Essentials',
      date: 'March 2026',
      category: 'Guides',
      readTime: '4 min read',
      image: '/assets/media/Hiking.webp',
      imageAlt: 'Hikers crossing a stream in a forest',
      excerpt:
        'A simple packing list for steep climbs, changing weather, and long descents—tested on Jamaica’s most popular route.',
      content: [
        'Start with footwear that grips wet rock and mud—your day is only as good as your traction.',
        'Pack water, a headlamp, a lightweight rain layer, and a small first-aid kit. Weather can flip quickly at elevation.',
        'Bring a compact backpack with dry storage so your phone and layers stay protected during stream crossings.',
        'If you are unsure what to bring, message us with your route and we will recommend the right kit.'
      ]
    },
    {
      id: 'rain-season-ready',
      title: 'Rain Season Ready: How to Keep Gear Dry',
      date: 'March 2026',
      category: 'Safety',
      readTime: '3 min read',
      image: '/assets/media/home.jpeg',
      imageAlt: 'Outdoor gear on a table ready for a trip',
      excerpt:
        'From roll-top packs to tent seam checks, these quick steps prevent soaked clothing and ruined electronics.',
      content: [
        'Use a waterproof liner or dry bag for your essentials. Even “water-resistant” packs can leak under heavy rain.',
        'Check tent seams and stakes before you leave—most failures happen during setup when wind and rain hit together.',
        'Keep a small microfiber cloth in your bag to wipe condensation before packing up.'
      ]
    },
    {
      id: 'choose-your-tent',
      title: 'Choosing a Tent: 2-Person vs Basecamp',
      date: 'March 2026',
      category: 'Gear',
      readTime: '5 min read',
      image: '/assets/media/tent.webp',
      imageAlt: 'A tent set up at a campsite',
      excerpt:
        'A quick guide to space, weight, and setup time—so you choose a shelter that fits your trip.',
      content: [
        'If you are moving daily, choose the lighter option with a faster pitch—your energy matters at the end of a long hike.',
        'For group trips or longer stays, a basecamp tent provides comfort and storage but weighs more.',
        'Match the tent to your weather window: ventilation for humid nights, stronger poles for windy ridgelines.'
      ]
    }
  ];

  selectedPost: BlogPost | null = null;
  isPostOpen = false;

  openPost(post: BlogPost) {
    this.selectedPost = post;
    this.isPostOpen = true;
  }

  closePost() {
    this.isPostOpen = false;
    this.selectedPost = null;
  }

  trackById(_: number, post: BlogPost) {
    return post.id;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isPostOpen) this.closePost();
  }
}

