import { Component } from '@angular/core';
import { IGearItem } from '../../models/gear-item.model';
import { UIStateService } from '../../services/uistate.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  featuredProducts: IGearItem[] = [
    {
      id: 1,
      name: "SummitGuard Hiking Shoe",
      type: "Footwear",
      description: "A high-performance hiking shoe offering stability and protection on tough terrain. Features reinforced sole and water-resistant membrane.",
      price: 179.59,
      stock: 25,
      badge: "Bestseller",
      image: "/uploads/products/shoe.png",
      capacity: 0
    },
    {
      id: 6,
      name: "Riverstone DryPack 35L",
      type: "Backpack",
      description: "Waterproof roll-top pack built for river crossings and sudden tropical rain.",
      price: 89.00,
      stock: 28,
      image: "/uploads/products/bag1.png"
    },
    {
      id: 3,
      name: "StormGuard Adventure Tent",
      type: "Camping Tent",
      description: "Lightweight 2-person tent, easy to set up for hikers and campers. Wind resistant and UV protected for Jamaican conditions.",
      price: 69.00,
      stock: 20,
      badge: "New",
      image: "/uploads/products/tent3.png"
    }
  ];

  constructor(private uiService: UIStateService) { }

  openSignup() {
    this.uiService.openLoginModal('register');
  }
}
