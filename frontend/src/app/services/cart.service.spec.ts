import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { IGearItem } from '../models/gear-item.model';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add items to cart', () => {
    const gearData: IGearItem = { id: 1, name: 'Test Product', price: 10, type: 'Test', description: 'Test', stock: 10, image: 'test.jpg' };
    service.addItem(gearData);
    const items = service.getItems();
    expect(items.length).toBe(1);
    expect(items[0].gearData.id).toBe(1);
    expect(items[0].quantity).toBe(1);
  });

  it('should increment quantity if same gearData added twice', () => {
    const gearData: IGearItem = { id: 1, name: 'Test Product', price: 10, type: 'Test', description: 'Test', stock: 10, image: 'test.jpg' };
    service.addItem(gearData);
    service.addItem(gearData);
    const items = service.getItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should calculate total correctly', () => {
    const p1: IGearItem = { id: 1, name: 'P1', price: 10, type: 'A', description: 'D', stock: 5, image: 'p1.jpg' };
    const p2: IGearItem = { id: 2, name: 'P2', price: 20, type: 'B', description: 'D', stock: 5, image: 'p2.jpg' };
    service.addItem(p1);
    service.addItem(p2);
    expect(service.getTotal()).toBe(30);
  });
});
