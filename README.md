# Loop

A student-to-student auction platform built for **Noroff Semester Project 2**.

https://loop-auction.vercel.app/

## Run locally

You need **Node.js 22.12+** and npm.

```bash
git clone https://github.com/MrAlob/loop.git
cd loop
npm install
cp .env.example .env.local
```

Add your Noroff API key to `.env.local` for profile, listing-management and bidding requests:

```env
NOROFF_API_KEY=your_noroff_api_key
VITE_NOROFF_API_URL=
```

The API URL is optional and defaults to `https://v2.api.noroff.dev`. Public listings can be browsed without an API key.

Start the development server:

```bash
npm run dev
```

Open the URL shown in the terminal. To check the production build locally:

```bash
npm run build
npm run preview
```

`npm run preview` serves only the production build, not the Vercel Function. Test signed-in features with `npm run dev` or on Vercel instead.

## About Loop

Loop gives pre-loved items another chance by helping students buy and sell through auctions. Instead of real-money payments, bidding uses credits provided by the Noroff Auction House API v2. The aim is a simple marketplace where useful things can keep moving between students.

## How to use Loop

- **Explore:** Browse active auctions without logging in. Search by keyword, filter by category, sort by ending soon or newest, and open a listing to view its photos, seller, deadline and bid history.
- **Join and bid:** Register with an `@stud.noroff.no` email, then log in. Bid on another student's active listing if you have enough credits. You cannot bid on your own auction.
- **Sell:** Select **Sell an item**, enter a title, description, category, image URLs and an end date, then publish your auction.
- **Manage your account:** View your credit balance, edit your profile and see your listings and bidding activity. You can edit or delete auctions you created.

## Built with

- **HTML and vanilla JavaScript** for the pages and application logic
- **Tailwind CSS** for styling and responsive layouts
- **Vite** for local development and the multi-page production build
- **Noroff Auction House API v2** for listings, users and bids

The `src/` folder contains shared JavaScript, styling and HTML fragments. Each page has its own `index.html` (for example, `browse/`, `listing/` and `profile/`), and `public/` holds static assets.

## Deployment

Loop can be deployed to **Vercel** using the GitHub repository and these settings:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | `./` |
| Build command | `npm run build` |
| Output directory | `dist` |

Add `NOROFF_API_KEY` under **Vercel Project Settings → Environment Variables**, for both Production and Preview. The `api/noroff.js` function adds this key to authenticated requests on the server; it is not included in the browser build. Leave `VITE_NOROFF_API_URL` empty unless you intentionally change the public API URL. 

