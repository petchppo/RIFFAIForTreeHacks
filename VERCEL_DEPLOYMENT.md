# Vercel Deployment Guide

## Prerequisites
1. Vercel account
2. GitHub repository with your code
3. Environment variables set up

## Environment Variables
Set these in your Vercel dashboard:

```
OPENAI_API_KEY=your_openai_api_key
MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set environment variables in Settings > Environment Variables
5. Deploy

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Key Changes Made for Vercel Compatibility

1. **Replaced Python raster processing** with Node.js implementation using `geotiff` and `sharp`
2. **Updated Next.js config** to handle external packages properly
3. **Added function timeout** configuration for raster processing
4. **Created .vercelignore** to exclude unnecessary files
5. **Simplified tile coordinate calculations** to avoid complex dependencies

## File Size Considerations
- TIFF files in `public/data/` will be included in deployment
- Consider optimizing large files or using external storage for production
- Current setup works for files under Vercel's limits

## Performance Notes
- Raster tile generation may be slower than Python version initially
- Consider implementing caching for frequently requested tiles
- Monitor function execution times and adjust timeout if needed

## Troubleshooting
- If deployment fails, check build logs for missing dependencies
- Ensure all environment variables are set correctly
- Verify TIFF files are accessible in the `public/data/` directory