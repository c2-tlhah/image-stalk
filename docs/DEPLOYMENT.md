# Deployment Guide

## ⚠️ IMPORTANT: Cloudflare Pages Only

This project is built for **Cloudflare Pages** and **cannot be deployed to Vercel** because it uses:
- **Cloudflare D1** database (Cloudflare-specific)
- **@remix-run/cloudflare** adapter (incompatible with Vercel)
- **Cloudflare Workers** runtime

## ✅ Remote Database is Ready!

The remote database has been initialized with all tables:
- ✅ `users` table
- ✅ `reports` table
- ✅ `events` table

Database ID: `444bc68b-4b5f-4e9f-8c7e-4a7fd23e72e4`

---

## Deploy to Cloudflare Pages via GitHub (Recommended)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ProfileImageIntel Lite"
git branch -M main
git remote add origin https://github.com/c2-tlhah/stalkimg.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** 
3. Click **Create Application** → **Pages** → **Connect to Git**
4. Authorize GitHub and select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
   - **Root directory**: `/` (leave empty)
   - **Environment variables**: None needed (using wrangler.toml)

### Step 3: Add D1 Database Binding

After the first deployment:

1. Go to your Pages project → **Settings** → **Functions**
2. Scroll to **D1 database bindings**
3. Click **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Select `profile-image-intel`
4. Click **Save**

### Step 4: Redeploy

After adding the binding:
1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment
3. Your app will be live at: `https://YOUR-PROJECT.pages.dev`

### Step 5: (Optional) Add Custom Domain

1. Go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `forensics.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Wait for SSL certificate to be issued (~5-10 minutes)

---

## Manual Deployment (Without GitHub)

If you prefer not to use GitHub:

```bash
# Build the project
npm run build

# Deploy directly
npm run deploy
```

**Note**: Manual deployment won't have automatic rebuilds on code changes.

---

## Alternative: Deploy to Vercel (Requires Conversion)

To deploy to Vercel, you would need to:

### 1. Change Runtime Adapter
```bash
npm uninstall @remix-run/cloudflare @remix-run/cloudflare-pages
npm install @remix-run/vercel
```

### 2. Replace D1 Database

Choose one:
- **Neon** (PostgreSQL, free tier)
- **Turso** (SQLite, free tier)
- **PlanetScale** (MySQL, free tier)
- **Vercel Postgres** (PostgreSQL, paid)

### 3. Major Code Changes Required

- Replace all D1 database calls
- Update Cloudflare-specific types
- Change server runtime from Workers to Node.js
- Rewrite SSRF protection (uses Web APIs specific to Cloudflare)
- Update build configuration
- Rewrite migrations for new database

**Estimated time**: 3-4 hours of refactoring

**Recommendation**: Use Cloudflare Pages - it's free, fast, global CDN, and already configured!

---

## Commands Reference

```bash
# Local development with local D1
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages (manual)
npm run deploy

# Run tests
npm test

# Type check
npm run typecheck

# Database commands
npx wrangler d1 execute profile-image-intel --local --command="SELECT * FROM reports LIMIT 5;"
npx wrangler d1 execute profile-image-intel --remote --command="SELECT COUNT(*) FROM reports;"
```

---

## Environment Variables

All environment variables are configured in `wrangler.toml`:
- `MAX_FILE_SIZE_MB = "15"`
- `REQUEST_TIMEOUT_MS = "10000"`
- `RATE_LIMIT_PER_MINUTE = "10"`

These are automatically loaded in Cloudflare Pages deployment.

---

## Cloudflare Free Tier Limits

- ✅ **100,000 requests/day** (Pages + Workers combined)
- ✅ **5 GB D1 storage** 
- ✅ **5 million D1 reads/day**
- ✅ **100,000 D1 writes/day**
- ✅ **Unlimited bandwidth**
- ✅ **Global CDN** (300+ cities)

Perfect for this zero-cost project!

---

## Troubleshooting

### Build fails in Cloudflare
1. Check build logs in Cloudflare Dashboard
2. Verify Node.js version (should use 18+)
3. Test locally: `npm run build`

### Database binding not working
1. Verify binding name is exactly `DB` (case-sensitive)
2. Check if binding is added in **Settings → Functions → D1 bindings**
3. Redeploy after adding binding

### Images not displaying
1. Check browser console for CORS errors
2. Verify image proxy endpoint is working: `/api/proxy-image/{reportId}`
3. Test with different image sources

### Rate limiting issues
Increase in `wrangler.toml`:
```toml
RATE_LIMIT_PER_MINUTE = "20"
```

---

## Post-Deployment Checklist

- [ ] Visit production URL
- [ ] Test URL analysis (try Instagram, GitHub profile images)
- [ ] Test file upload (< 15MB)
- [ ] Verify image preview displays
- [ ] Test "Re-check URL" button
- [ ] Check mobile responsive design
- [ ] Verify all metadata sections display correctly
- [ ] Test hashing (SHA-256, SHA-1, pHash)

---

## Need Help?

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Remix Cloudflare Docs](https://remix.run/docs/en/main/guides/deployment#cloudflare-pages)

