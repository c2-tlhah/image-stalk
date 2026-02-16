# Quick Setup: GitHub Actions Secrets

To enable automated deployment to Cloudflare Pages, add these secrets to your GitHub repository.

## Required Secrets

### 1. CLOUDFLARE_API_TOKEN

**How to get it:**
1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Copy the token

**Add to GitHub:**
- Go to: `https://github.com/c2-tlhah/stalkimg/settings/secrets/actions`
- Click "New repository secret"
- Name: `CLOUDFLARE_API_TOKEN`
- Paste the token

### 2. CLOUDFLARE_ACCOUNT_ID

**How to get it:**
1. Visit: https://dash.cloudflare.com/
2. Select your account
3. Copy "Account ID" from the right sidebar

**Add to GitHub:**
- Go to: `https://github.com/c2-tlhah/stalkimg/settings/secrets/actions`
- Click "New repository secret"
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Paste the account ID

## Verify Setup

After setting up secrets:

1. Push code to master branch:
   ```bash
   git add .
   git commit -m "chore: setup CI/CD"
   git push origin master
   ```

2. Check the Actions tab:
   - Visit: `https://github.com/c2-tlhah/stalkimg/actions`
   - You should see the workflow running

3. Once deployed, visit your Cloudflare Pages dashboard to see the deployment

---

**Full Documentation:** [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md)
