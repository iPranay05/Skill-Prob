# Supabase Storage Setup for Course Media

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## How to Get These Values:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete

### 2. Get Project URL
1. Go to Settings → API
2. Copy the "Project URL"
3. Add as `NEXT_PUBLIC_SUPABASE_URL`

### 3. Get Service Role Key
1. Go to Settings → API
2. Copy the "service_role" key (NOT the anon key)
3. Add as `SUPABASE_SERVICE_ROLE_KEY`

## Storage Bucket Setup

The system will automatically:
- Create a `courses` bucket if it doesn't exist
- Set up proper permissions for public access
- Configure file type restrictions (images/videos only)
- Set file size limits (10MB for images, 500MB for videos)

## File Organization

Files will be stored as:
```
courses/
├── thumbnails/
│   ├── 1634567890-abc123.jpg
│   └── 1634567891-def456.png
└── trailers/
    ├── 1634567892-ghi789.mp4
    └── 1634567893-jkl012.webm
```

## Benefits of Supabase Storage

✅ **Simple Setup**: Just 2 environment variables
✅ **Built-in CDN**: Fast global delivery
✅ **Automatic Scaling**: No infrastructure management
✅ **Cost Effective**: Generous free tier
✅ **Real-time**: Integrates with your Supabase database
✅ **Security**: Row-level security policies
✅ **File Transformations**: Resize images on-the-fly

## Testing

Once environment variables are set:
1. Restart your development server
2. Go to `/mentor/courses/create`
3. Upload a thumbnail or trailer
4. Check Supabase dashboard to see uploaded files

## Production Deployment

For production, add the same environment variables to your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Railway: Variables tab
