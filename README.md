# airport-west-eastbound-checker

Type a 4-letter ICAO code and the app tells you whether a flight from Turkish (**LTxx**) airports to that airport is **eastbound** or **westbound**.

## How it decides

The app uses the same split as the semicircular cruising-level rule:

| Initial true course | Direction |
|---|---|
| 000° – 179° | **EASTBOUND** |
| 180° – 359° | **WESTBOUND** |

It uses the initial great-circle (true) course from the chosen LTxx origin to the destination.
If that course is within 10° of due north or south, the app shows a warning, because routing or magnetic variation can flip the result.

For each lookup you get:
- the result from the origin you picked (LTFM Istanbul by default), with course, distance and longitude difference
- a table with the result from every LT airport with scheduled service (51), plus a summary such as "Westbound from all 51 …" or "Mixed: 15 eastbound, 36 westbound". Tick *Include all LT airfields* to add the remaining LT fields.

You can share a lookup with a link: `index.html#EGLL` or `index.html#OMDB/LTAI` (destination/origin).

## Running

It's a static page with no build step. Open `index.html` in a browser, or serve the folder:

```sh
npm start            # python3 -m http.server 8000 → http://localhost:8000
```

It also works as-is on GitHub Pages.

## Deploying to Vercel

`vercel.json` sets everything up: there's no build step, and the repo root is served as-is.

- **Dashboard:** at vercel.com, choose *Add New → Project*, import this repo and click *Deploy*. You don't need to change any settings. Every push to `main` redeploys.
- **CLI:** run `npm i -g vercel`, then `vercel` for a preview or `vercel --prod` for production.

## Install as an app (PWA)

The site is a Progressive Web App, so you can install it once it's deployed:

- **iPhone / iPad (Safari):** tap Share, then *Add to Home Screen*
- **Android (Chrome):** open the menu and choose *Install app*
- **Desktop Chrome / Edge:** click the install icon in the address bar

It opens full-screen and works offline, since all the airport data is cached on the device. A new deploy is picked up on the next launch after the app has been opened online. If you change cached files in a way that needs a hard refresh, bump `CACHE` in `sw.js`.

## Tests

```sh
npm test
```

## Airport data

`data/airports.js` is generated from [OurAirports](https://ourairports.com/data/) (public domain). It holds about 19k airports that have a 4-letter ICAO code. To refresh it:

```sh
npm run build:data                       # downloads the latest CSV
python3 scripts/build_airports.py file.csv   # or build from a local CSV
```
