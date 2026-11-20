# Loop

## Run locally

Install Node.js 22.12 or later, then clone the project and install its dependencies.

```bash
git clone https://github.com/MrAlob/loop.git
cd loop
npm install
cp .env.example .env.local
```

For profile, listing and bidding features, set `VITE_NOROFF_API_KEY` in `.env.local` to your Noroff API key. Guests can browse without a key. Leave `VITE_NOROFF_API_URL` empty to use the default Noroff API.

```bash
npm run dev
```

Open the local URL printed in the terminal. To check the production version, run `npm run build` followed by `npm run preview`.

## About Loop

Loop is a student auction site for giving pre-loved items a second life. It was built for Noroff Semester Project 2 with HTML, vanilla JavaScript, Tailwind CSS and Vite. Listings, profiles and bids come from the Noroff Auction House API.

## Using Loop

- **Browse as a guest.** Search for an item, filter by category or sort by closing time. Open a listing to see its photos, deadline and bid history.
- **Bid with credits.** Register with an `@stud.noroff.no` email and log in. Open another student’s active listing and enter a bid above the current price and within your available balance.
- **Sell an item.** Choose **Sell an item**, add photos and a description, set a deadline and publish. Your profile shows your balance, your listings and the auctions you’ve bid on. Open one of your own listings to edit or delete it.
