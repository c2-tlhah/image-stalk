# Development with Remote Database

## Understanding Local vs Remote Database

By default, the project uses **different databases** depending on how you run it:

### `npm run dev` (Local Database)
- ✅ **Fast** hot reload and instant updates
- ✅ **Isolated** - your test data doesn't affect production
- ✅ **No network** latency
- ❌ Data stored locally in `.wrangler/state/v3/d1/`
- ❌ Data not visible in Cloudflare Dashboard
- ❌ Data not shared with deployed version

### `npm run dev:remote` (Remote Database)
- ✅ **Shared** with production deployment
- ✅ **Visible** in Cloudflare Dashboard
- ✅ **Persistent** across machines
- ❌ Slower (network latency to Cloudflare)
- ❌ Requires rebuild on code changes (no hot reload)
- ❌ Can affect production data

## Using Remote Database Locally

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Run with Remote Database
```bash
npm run dev:remote
```

This will:
1. Build the production version
2. Start a local server at `http://localhost:8788`
3. Connect to the **remote D1 database** (same as production)

### Step 3: Test Your Changes

All data created will be saved to the remote database and visible in:
- Cloudflare Dashboard → D1 → profile-image-intel
- Your deployed application

### Step 4: Make Code Changes

When you change code:
1. Stop the server (Ctrl+C)
2. Run `npm run dev:remote` again (it rebuilds automatically)

## When to Use Each Mode?

### Use `npm run dev` (local DB) for:
- 🔧 **Feature development** - fast iteration
- 🧪 **Testing** - don't pollute production
- 🐛 **Debugging** - isolate issues
- 📝 **Experimenting** - safe to break things

### Use `npm run dev:remote` (remote DB) for:
- 🚀 **Pre-deployment testing** - verify production behavior
- 🔍 **Testing with real data** - same database as deployed app
- 👥 **Sharing progress** - others can see your test data
- 🔄 **Migration testing** - verify database operations

## Checking Which Database You're Using

### Local Database
```bash
npx wrangler d1 execute profile-image-intel --local --command="SELECT COUNT(*) FROM reports;"
```

### Remote Database
```bash
npx wrangler d1 execute profile-image-intel --remote --command="SELECT COUNT(*) FROM reports;"
```

## Important Notes

⚠️ **Warning**: `npm run dev:remote` uses the **production database**. Be careful not to:
- Create spam/test data that clutters production
- Delete or modify important records
- Run destructive operations

💡 **Tip**: For permanent remote testing, consider:
- Creating a separate D1 database for staging
- Using database migrations to manage schema changes
- Cleaning up test data regularly

## Troubleshooting

### "Cannot find database" error with dev:remote
Make sure you've initialized the remote database:
```bash
npx wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql
```

### Changes not reflecting in dev:remote
You must rebuild after code changes:
```bash
npm run dev:remote
```
(This command includes a build step)

### Slow performance with dev:remote
This is expected - remote database has network latency. Use `npm run dev` for fast development, then test with `npm run dev:remote` before deploying.

## Workflow Recommendation

1. **Develop** with `npm run dev` (fast local DB)
2. **Test locally** with your changes
3. **Verify** with `npm run dev:remote` (remote DB)
4. **Deploy** with `npm run deploy`

This gives you the best of both worlds: **fast development** and **production confidence**.
