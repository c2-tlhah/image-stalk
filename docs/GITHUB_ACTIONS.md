# GitHub Actions CI/CD Setup

This project uses GitHub Actions for automated testing and deployment to Cloudflare Pages.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- On pull requests to `master` or `main` branches
- On pushes to any branch except `master` or `main`

**Jobs:**
- ✅ Lint code with ESLint
- ✅ Type checking with TypeScript
- ✅ Run test suite
- ✅ Build project

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- On push to `master` or `main` branches
- Manual trigger via workflow_dispatch

**Jobs:**
- ✅ Run tests
- ✅ Build project
- ✅ Deploy to Cloudflare Pages using `cloudflare/pages-action@v1`

**Requirements:**
- Wrangler 4.x or later
- Cloudflare API Token with Pages permissions
- Cloudflare Account ID

---

## Setup Instructions

### Step 1: Get Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **"Edit Cloudflare Workers"** template or create a custom token with:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → Account Settings → Read
   - **Account Resources:**
     - Include → Your Account
5. Click **Continue to summary** and then **Create Token**
6. **Copy the token** (you won't be able to see it again!)

### Step 2: Get Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. On the right sidebar, you'll see **Account ID**
4. Click to copy it

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

#### `CLOUDFLARE_API_TOKEN`
- Name: `CLOUDFLARE_API_TOKEN`
- Value: Paste the API token from Step 1

#### `CLOUDFLARE_ACCOUNT_ID`
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: Paste the Account ID from Step 2

### Step 4: Update Dependencies

Before deploying, make sure you have the latest Wrangler version:

```bash
npm install
```

This will update Wrangler to version 4.x which is required for the deployment workflow.

### Step 5: Verify Deployment Settings

Make sure your `wrangler.toml` has the correct project name:

```toml
name = "profile-image-intel-lite"
pages_build_output_dir = "./build/client"
```

If your Cloudflare Pages project name is different, update the `projectName` in `.github/workflows/deploy.yml`.

---

## Manual Deployment

You can trigger a deployment manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Cloudflare Pages** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI](https://github.com/c2-tlhah/image-stalk/actions/workflows/ci.yml/badge.svg)](https://github.com/c2-tlhah/image-stalk/actions/workflows/ci.yml)
[![Deploy](https://github.com/c2-tlhah/image-stalk/actions/workflows/deploy.yml/badge.svg)](https://github.com/c2-tlhah/image-stalk/actions/workflows/deploy.yml)
```

---

## Troubleshooting

### Error: "Unauthorized" or "Invalid API Token"

- Check that `CLOUDFLARE_API_TOKEN` is set correctly
- Verify the token has the right permissions
- Token might have expired - generate a new one

### Error: "Project not found"

- Update the project name in `.github/workflows/deploy.yml`
- Check the project exists in Cloudflare Pages Dashboard
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct

### Error: Build fails

- Test the build locally: `npm run build`
- Check the Node.js version matches (we use Node 18)
- Verify all dependencies are in `package.json`

### Error: "ERESOLVE could not resolve" or peer dependency conflicts

This error occurs when @remix-run/dev expects wrangler 3.x but we're using wrangler 4.x:

**Solution:**
The project includes `.npmrc` with `legacy-peer-deps=true` and the workflows use `npm ci --legacy-peer-deps` to handle this conflict. This is expected and the project works correctly with wrangler 4.x.

If you encounter this locally:
```bash
npm install --legacy-peer-deps
```

Or ensure your `.npmrc` file contains:
```
legacy-peer-deps=true
```

### Error: "Workers-specific command in a Pages project" or Wrangler version issues

This error occurs if Wrangler is outdated or incorrectly configured:

**Solution:**
```bash
# Update to Wrangler 4.x
npm install --save-dev wrangler@4

# Commit the updated package.json and package-lock.json
git add package.json package-lock.json
git commit -m "chore: update wrangler to v4"
git push
```

Make sure the workflow uses `cloudflare/pages-action@v1` (not `wrangler-action`).

### Database Connection Issues

The workflow doesn't run database migrations automatically. After first deployment:

```bash
# Run migrations on remote database
npx wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql
```

---

## Updating Workflows

If you need to modify the workflows:

1. Edit files in `.github/workflows/`
2. Commit and push changes
3. The updated workflow will be used on next trigger

### Common Customizations

**Change Node.js version:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to desired version
```

**Deploy to different project:**
```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    projectName: your-project-name  # Change this
    directory: ./build/client
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Add environment variables:**
```yaml
- name: Build project
  run: npm run build
  env:
    MY_ENV_VAR: ${{ secrets.MY_SECRET }}
```

---

## Security Best Practices

✅ **Never commit secrets** to the repository  
✅ **Use GitHub Secrets** for sensitive data  
✅ **Rotate API tokens** periodically  
✅ **Use minimal permissions** for API tokens  
✅ **Review workflow logs** for sensitive data leaks  

---

## Next Steps

After setting up:

1. ✅ Push code to trigger the workflow
2. ✅ Check the **Actions** tab for build status
3. ✅ Verify deployment on Cloudflare Pages Dashboard
4. ✅ Test your live application

---

For more information:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
