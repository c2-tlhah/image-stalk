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

## GitHub Actions Setup

For automated deployments via GitHub Actions, you need to add secrets:

1. Go to: https://github.com/c2-tlhah/image-stalk/settings/secrets/actions
2. Add `CLOUDFLARE_API_TOKEN` (from https://dash.cloudflare.com/profile/api-tokens)
3. Add `CLOUDFLARE_ACCOUNT_ID` (from https://dash.cloudflare.com/)

See [SECRETS_SETUP.md](../.github/SECRETS_SETUP.md) for detailed instructions.
