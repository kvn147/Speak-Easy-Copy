# ScreenShare Component - SSR Guide

The `ScreenShare` component is now fully compatible with server-side rendering (SSR) in Next.js.

## Features

✅ **SSR Safe**: All browser APIs are guarded with proper checks
✅ **Client-Side Only**: Uses `'use client'` directive for Next.js App Router
✅ **Hydration Safe**: Prevents hydration mismatches with `isMounted` state
✅ **Progressive Enhancement**: Shows loading state during SSR, full functionality on client

## Usage Options

### Option 1: Direct Import (Recommended for App Router)

The component now has `'use client'` directive built-in:

```tsx
import ScreenShare from '@/components/ScreenShare'

export default function LiveSessionPage() {
  return (
    <div>
      <h1>Live Session</h1>
      <ScreenShare />
    </div>
  )
}
```

### Option 2: Dynamic Import with No SSR (Pages Router or Extra Safety)

For Pages Router or if you want extra control:

```tsx
import dynamic from 'next/dynamic'

const ScreenShare = dynamic(() => import('@/components/ScreenShare'), {
  ssr: false,
  loading: () => <div>Loading screen share...</div>
})

export default function LiveSessionPage() {
  return (
    <div>
      <h1>Live Session</h1>
      <ScreenShare />
    </div>
  )
}
```

### Option 3: With Client Wrapper (Alternative)

```tsx
import dynamic from 'next/dynamic'

const ScreenShareClient = dynamic(() => import('@/components/ScreenShare.client'), {
  ssr: false
})

export default function LiveSessionPage() {
  return <ScreenShareClient />
}
```

## Guards Implemented

### 1. **Browser Environment Checks**
```tsx
if (typeof window === 'undefined') return
if (typeof navigator === 'undefined') return
```

### 2. **Media API Checks**
```tsx
if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
  setError('Screen sharing not supported')
  return
}
```

### 3. **AudioContext Checks**
```tsx
if (typeof AudioContext === 'undefined') {
  console.warn('AudioContext not available')
  return
}
```

### 4. **Mounted State Check**
```tsx
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

if (!isMounted) {
  return <div>Loading...</div>
}
```

## WebSocket Connection

The component automatically detects the environment and connects to the appropriate server:

- **Development**: `http://localhost:3001`
- **Production**: Uses `NEXT_PUBLIC_SERVER_URL` env variable or auto-detects from hostname

## Environment Variables

Create `.env.local`:

```bash
# WebSocket Server URL (optional - will auto-detect if not set)
NEXT_PUBLIC_SERVER_URL=http://your-ec2-ip:3001

# Node Environment
NODE_ENV=production
```

## Browser Compatibility

Requires:
- Modern browser with `navigator.mediaDevices.getDisplayMedia()`
- WebRTC support
- AudioContext support

## Error Handling

The component gracefully handles:
- SSR environments (no errors, shows loading state)
- Missing browser APIs (shows helpful error messages)
- User denied permissions (specific error messages)
- Network issues (connection status indicator)

## Testing

### Test SSR Compatibility
```bash
npm run build
npm start
# Visit http://localhost:3000/live-session
# Check browser console - should have no SSR errors
```

### Test Client-Side Functionality
1. Click "Start Screen Share"
2. Should see browser's screen share picker
3. WebSocket should connect (check console logs)
4. Video frames and audio should stream to server

## Troubleshooting

### "navigator.mediaDevices is undefined"
✅ **Fixed**: Component now has comprehensive guards and only runs in browser

### "Hydration mismatch"
✅ **Fixed**: Using `isMounted` state to prevent mismatches

### "WebSocket connection failed"
- Check that server is running on port 3001
- Verify `NEXT_PUBLIC_SERVER_URL` in `.env.local`
- Check EC2 security group allows port 3001

### SSR Build Errors
✅ **Fixed**: All browser APIs are properly guarded

## Next.js Configuration

No special configuration needed! The component is self-contained with all necessary guards.

Optional: Add to `next.config.ts` for CORS warnings:

```typescript
const config: NextConfig = {
  experimental: {
    allowedDevOrigins: ['http://3.93.171.8:3000']
  }
}
```
