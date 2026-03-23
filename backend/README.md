# TrooperGear Backend (MySQL)

## Setup
1. Create the database, tables, and sample products:
   - Run `database/schemas.sql`
3. Configure `.env` in `backend`:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
4. Start the API:
   - `node server.js`

## Auth
- `POST /api/auth/register` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/admin/login` `{ email, password }`
- `POST /api/auth/forgot-password` `{ email }`
- `POST /api/auth/reset-password` `{ token, password }`
- `GET /api/auth/me` (Bearer token)

## Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

## Cart (auth)
- `GET /api/cart`
- `POST /api/cart/items` `{ productId, quantity, variantColor?, variantSize? }`
- `PUT /api/cart/items/:id` `{ quantity }`
- `DELETE /api/cart/items/:id`
- `POST /api/cart/clear`

## Wishlist (auth)
- `GET /api/wishlist`
- `POST /api/wishlist/items` `{ productId }`
- `DELETE /api/wishlist/items/:id`
- `POST /api/wishlist/clear`

## Orders (auth)
- `POST /api/orders` (creates order from cart)
- `GET /api/orders`
- `GET /api/orders/:id/items`

## Admin
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role` `{ role: 'user' | 'admin' }`
- `GET /api/orders/admin/all`
- `PUT /api/orders/admin/:id/status` `{ status }`
