# The Den merchandise demo

A student-built concept for Rust College's Den merchandise store: campus pickup for students, and delivery for buyers off campus (alumni, families, fans).

## Run
Open dist/index.html in a browser, or serve dist with:
python -m http.server 4173 --directory dist

## Demonstrate
Choose a product and size, add it to the bag, and go to checkout. Pick **Campus pickup**, or **Ship to me** and enter a fictional US address (a $7.95 sample flat rate is added). Use **Sign in** in the header (or go to `#account`) to see the account page with Sign in and Create account tabs. There is no server yet, so the forms validate input and then say accounts open at launch; nothing typed is sent or stored.

## Scope
Eight illustrated sample products. Search, category filters, price sorting, variant-level inventory limits, cart editing, demo checkout with pickup or delivery, shipping address capture, account sign-in / create-account page (front end only), browser-local persistence, responsive layouts, and keyboard focus handling.

All prices, shipping rates, and products are samples. No real payments, reservations, shipments, or messages are sent. The bag is stored in localStorage in one browser profile/origin. The sign-in page has no backend and does not authenticate anyone.

## Before a real pilot
Confirm actual inventory, product photos, prices, taxes, payment handling, pickup location/hours, shipping carrier, real shipping rates and delivery areas, and staff ownership. Shipping addresses are personal data, so a real version needs secure storage and a privacy notice. Add shared server-side orders/inventory, a real authentication service for customer accounts (and a separate staff order dashboard), and a tested operational process before receiving real orders.

## Edit
Product definitions and SVG illustrations: dist/app.js.
Layout: dist/index.html.
Styling: dist/styles.css.
No build step or package dependencies are required. Google Fonts is optional; local font fallbacks are supplied.

## Sources
https://rustcollege.edu/160th-founders-week/
https://rustcollege.edu/business-affairs/

