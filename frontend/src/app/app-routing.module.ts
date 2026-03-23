import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { 
    path: '', 
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule),
    data: {
      title: 'Home',
      description: 'TrooperGear Jamaica - premium outdoor gear built for island terrain. Shop footwear, tents, backpacks, and essential equipment.'
    }
  },
  { 
    path: 'products', 
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsModule),
    data: {
      title: 'Products',
      description: "Browse TrooperGear's collection of footwear, tents, backpacks, and equipment. Filter by category, activity, and price to find the right kit."
    }
  },
  { 
    path: 'about', 
    loadChildren: () => import('./pages/about/about.module').then(m => m.AboutModule),
    data: {
      title: 'About Us',
      description: 'Learn about TrooperGear Jamaica and our mission to deliver rugged, field-tested outdoor gear for local adventures.'
    }
  },
  {
    path: 'blog',
    loadChildren: () => import('./pages/blog/blog.module').then(m => m.BlogModule),
    data: {
      title: 'Blog',
      description: 'Trail Notes from TrooperGear: guides, tips, and gear updates for hiking, camping, and climbing in Jamaica.'
    }
  },
  { 
    path: 'contact', 
    loadChildren: () => import('./pages/contact/contact.module').then(m => m.ContactModule),
    data: {
      title: 'Contact',
      description: 'Contact TrooperGear for product enquiries, order help, or support. We respond within 24 hours on business days.'
    }
  },
  { 
    path: 'login', 
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    data: {
      title: 'Login',
      description: 'Sign in to your TrooperGear account to manage your profile, wishlist, and checkout faster.'
    }
  },
  { 
    path: 'signup', 
    loadChildren: () => import('./pages/signup/signup.module').then(m => m.SignupModule),
    data: {
      title: 'Create Account',
      description: 'Create a TrooperGear account to save wishlists, track orders, and move faster at checkout.'
    }
  },
  { 
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AdminGuard],
    data: {
      title: 'Admin Dashboard',
      description: 'Admin dashboard for managing products, orders, and customers.'
    }
  },
  { 
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard],
    data: {
      title: 'Profile',
      description: 'Manage your TrooperGear profile details and saved addresses.'
    }
  },
  {
    path: 'not-authorized',
    loadChildren: () => import('./pages/not-authorized/not-authorized.module').then(m => m.NotAuthorizedModule),
    data: {
      title: 'Not Authorized',
      description: 'You do not have permission to view this page.'
    }
  },
  { 
    path: 'wishlist', 
    loadChildren: () => import('./pages/wishlist/wishlist.module').then(m => m.WishlistModule),
    canActivate: [AuthGuard],
    data: {
      title: 'Wishlist',
      description: 'View and manage your saved TrooperGear items.'
    }
  },
  { 
    path: 'checkout', 
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsModule),
    canActivate: [AuthGuard],
    data: {
      title: 'Checkout',
      description: 'Review your cart and proceed to checkout.'
    }
  },
  { 
    path: '', 
    loadChildren: () => import('./pages/compliance/compliance.module').then(m => m.ComplianceModule) 
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
