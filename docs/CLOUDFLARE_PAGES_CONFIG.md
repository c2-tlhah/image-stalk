# Cloudflare Pages Configuration

## Build Configuration

When setting up your project in Cloudflare Pages Dashboard:

### Framework preset
- Select: **Remix**

### Build command
```bash
npm run build
```

### Build output directory
```
build/client
```

### Root directory (production only)
```
/
```

### Environment variables
Leave empty for now (D1 bindings are configured via wrangler.toml)

## Important: Deploy Command

**DO NOT set a deploy command!** Cloudflare Pages automatically deploys after a successful build.

If you've accidentally set a deploy command:
1. Go to your Cloudflare Pages project
2. Navigate to Settings → Builds & deployments
3. Under "Build settings", clear the "Deploy command" field
4. Save changes

## D1 Database Binding

Your D1 database is already configured in `wrangler.toml`:
- Database: `profile-image-intel`
- Database ID: `444bc68b-4b5f-4e9f-8c7e-4a7fd23e72e4`
- Binding: `DB`

This will automatically be available to your Remix app when deployed to Cloudflare Pages.

## R2 Bucket Binding (REQUIRED)

The R2 bucket stores uploaded images (up to 50MB). You MUST configure this in the Cloudflare Pages Dashboard:

### Step 1: Enable R2
1. Go to https://dash.cloudflare.com
2. Click on "R2" in the left sidebar
3. If prompted, enable R2 for your account

### Step 2: Create R2 Bucket (Already Done)
The bucket `image-intel-storage` has been created via Wrangler CLI.

### Step 3: Configure R2 Binding in Pages
1. Go to your Cloudflare Pages project: https://dash.cloudflare.com
2. Select your project: **image-stalk-cli**
3. Go to **Settings** → **Functions**
4. Scroll down to **R2 bucket bindings**
5. Click **Add binding**
6. Set:
   - **Variable name**: `IMAGES`
   - **R2 bucket**: `image-intel-storage`
7. Click **Save**
8. Click **Redeploy** (in Deployments tab) for changes to take effect

**Without this binding, image uploads will fail!**

## Environment Variables

The following variables are configured in `wrangler.toml`:
- `MAX_FILE_SIZE_MB`: 50 (maximum upload size)
- `REQUEST_TIMEOUT_MS`: 10000
- `RATE_LIMIT_PER_MINUTE`: 10

## GitHub Actions Setup

For automated deployments via GitHub Actions, you need to add secrets:

1. Go to: https://github.com/c2-tlhah/image-stalk/settings/secrets/actions
2. Add `CLOUDFLARE_API_TOKEN` (from https://dash.cloudflare.com/profile/api-tokens)
3. Add `CLOUDFLARE_ACCOUNT_ID` (from https://dash.cloudflare.com/)

See [SECRETS_SETUP.md](../.github/SECRETS_SETUP.md) for detailed instructions.
