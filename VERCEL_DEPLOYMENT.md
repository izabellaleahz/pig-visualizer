# Vercel Deployment Notes

## Git LFS Configuration

This repository uses Git LFS for large data files (`pig.json` and `human.json`). For Vercel deployment:

### Option 1: Enable Git LFS in Vercel (Recommended)

1. Go to your Vercel project settings
2. Navigate to "Git" → "Git LFS"
3. Enable "Git LFS" option
4. Redeploy your project

Vercel will automatically download LFS files during build.

### Option 2: Use Vercel CLI with LFS

If deploying via CLI:

```bash
# Install Git LFS if not already installed
git lfs install

# Pull LFS files
git lfs pull

# Deploy
vercel --prod
```

### Option 3: Alternative Data Hosting

If Git LFS continues to cause issues, consider:

1. Host data files on a CDN (e.g., AWS S3, Cloudflare R2)
2. Update `src/utils/api.ts` to fetch from CDN URLs
3. Use environment variables for data URLs

## Error Handling

The application now includes error handling for Git LFS pointer files. If you see an error like:

```
Git LFS file not properly downloaded: proteins/pig.json
```

This means Vercel is serving the LFS pointer file instead of the actual data. Follow Option 1 above to fix.

## Data File Sizes

- `pig.json`: ~387 MB
- `human.json`: ~809 MB
- Total: ~1.2 GB

These files are required for the visualizer to function. Ensure your Vercel plan supports these file sizes.
