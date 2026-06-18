# Deploying PST Viewer with Caddy

The app is a static site — Caddy just serves a folder of files. Building the
project produces a ready-to-serve `deploy/` folder containing:

- `site/` — the built static app (point Caddy's `root` here)
- `Caddyfile` — example config
- `DEPLOY.md` — this file

## Build the deploy folder

```bash
npm install        # first time only
npm run deploy     # builds and assembles ./deploy
```

(`npm run deploy` runs the production build and copies it, with the Caddyfile,
into `deploy/`. You can also just `npm run build` and use the `dist/` folder.)

## Serve it

1. Copy the `deploy/` folder to your server, e.g. `/srv/pst-viewer`.
2. Edit `Caddyfile`: set your real domain (replace `pst.example.com`). If you're
   adding the block to an existing system Caddyfile, use an absolute root such as
   `root * /srv/pst-viewer/site`.
3. Start it:
   - Standalone — from inside the folder: `caddy run` (or `caddy start`).
   - Existing Caddy service — paste the block into your main Caddyfile and run
     `caddy reload`.
4. Open your domain. Caddy provisions HTTPS automatically.

> HTTPS is required for the offline / installable PWA features — Caddy gives you
> that for free.

## Updating to a new version

On your dev machine run `npm run deploy` again, then copy the new `site/`
contents over the old ones on the server. Visitors update automatically on their
next load (the service worker refreshes itself).

## Optional: limit who can access it

Uncomment the `basic_auth` block in the `Caddyfile` (create a password hash with
`caddy hash-password`), or restrict by IP / VPN, to keep it to colleagues only.

## Privacy note

There is no backend. Mailboxes are read and processed entirely in the visitor's
browser — nothing is uploaded. The server only ever sends the static app files.
