# Web-Programming-Ecommerce

Person 1 and Person 2 have now been organized into proper project files instead of leaving teammate code pasted inside `sourcecode1.txt`.
Person 3 has also been added with cart and checkout pages.

## Pages included

- `index.html` - login page
- `register.html` - registration page
- `reset-password.html` - password reset page
- `locked.html` - account locked page after 3 failed login attempts
- `product.html` - product catalogue page
- `cart.html` - shopping cart page
- `checkout.html` - checkout page

## JavaScript files

- `auth.js` - registration, login, TRN validation, age validation, unique TRN check, 3-attempt lockout, reset password
- `product.js` - default products, product display, sorting, add-to-cart, localStorage syncing
- `cart.js` - cart rendering, quantity changes, remove item, clear cart, totals
- `checkout.js` - checkout summary, shipping and payment validation, checkout storage

## CSS files

- `auth.css` - shared styling for login, register, reset, and locked pages
- `product.css` - product catalogue styling
- `cart.css` - shared styling for cart and checkout pages

## localStorage keys used

- `RegistrationData` - array of registered users
- `CurrentUser` - the signed-in user object
- `LoginAttempts` - failed login attempt counts by TRN
- `AllProducts` - product catalogue array
- `PendingCheckout` - latest confirmed checkout waiting for invoice generation
- `AllCheckouts` - all confirmed checkout records

## Notes for the next teammate

- Each registered user is stored with `cart: []` and `invoices: []` so Person 3 can build cart and checkout directly on top of the current structure.
- `product.js` already adds items to the signed-in user's `cart`.
- Confirming checkout stores a structured checkout record for Person 4 to use when generating invoices.
- `sourcecode1.txt` is left in the folder as the original teammate paste for reference, but the actual project files are now the `.html`, `.css`, and `.js` files listed above.
