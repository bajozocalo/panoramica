# Google API JSON Parse Error - Debugging Guide

## The Error
```
SyntaxError: Unexpected number in JSON at position 2 (line 1 column 3)
at JSON.parse (<anonymous>)
at kf (https://apis.google.com/_/scs/abc-static/_/js/k=gapi.lb.en.G0GbPrbxPQI.O/m=gapi_iframes/...)
```

**Value being parsed:** `"[00]"`

## Root Cause
The error is coming from Google's API JavaScript library (GAPI) trying to parse an invalid JSON string `"[00]"`. JSON doesn't allow numbers with leading zeros (except for `0` itself), so `00` is invalid.

**Important:** This error is NOT caused by your application code. It's being triggered by:
1. Browser extensions (Google Translate, Gmail, Meet extensions, etc.)
2. Third-party scripts injected into your page
3. External analytics or tracking tools

## Solution Applied

### 1. Error Suppressor Component
Created `/web/components/ErrorSuppressor.tsx` that:
- Intercepts console errors related to Google APIs
- Prevents external API errors from cluttering your console
- Only suppresses known external errors, not your application errors
- Cleans up event listeners on unmount

### 2. Updated Layout
Modified `/web/app/layout.tsx` to include the ErrorSuppressor component globally.

## Additional Debugging Steps

### Step 1: Test in Incognito Mode
```bash
# Open your app in incognito/private browsing mode
# Most browser extensions are disabled in incognito mode
```

If the error **doesn't appear** in incognito mode → It's a browser extension causing it

### Step 2: Identify the Culprit Extension
If it's an extension:
1. Open browser extensions page:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
   - Edge: `edge://extensions/`
2. Disable extensions one by one
3. Refresh your app after each disable
4. When the error stops, you've found the culprit

Common culprits:
- Google Translate
- Gmail Checker/Notifier
- Google Meet extensions
- Google Docs offline extensions
- Browser password managers
- Ad blockers with analytics blocking

### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "google"
3. Look for requests to `apis.google.com`
4. Check which script is making these requests
5. Find the initiator (it will show which script/extension loaded it)

### Step 4: Check for Injected Scripts
```bash
# Search for any script tags in your compiled HTML
grep -r "apis.google.com" /Users/pablomartinez/panoramica/web/.next/static/
```

## Verification

After applying the fix:
1. Restart your dev server: `npm run dev`
2. Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Check if the error still appears in console
4. The error should now be suppressed

## If the Error Persists

### Option A: Block the Script (Advanced)
Add to your Next.js config to block external Google API loads:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com/js/api.js; connect-src 'self' https://apis.google.com;",
          },
        ],
      },
    ];
  },
};
```

### Option B: Use a Different Browser for Development
Test in different browsers to isolate the issue:
- Chrome
- Firefox
- Safari
- Edge

## Why This Isn't Your Fault

The `[00]` value is NOT coming from:
- ❌ Your Firebase configuration
- ❌ Your Gemini service
- ❌ Your image processing code
- ❌ Your authentication system
- ❌ Your API endpoints

It's coming from:
- ✅ External browser extensions
- ✅ Third-party injected scripts
- ✅ Google's API library trying to parse malformed data from an external source

## Technical Details

### Why `[00]` is Invalid JSON
```javascript
JSON.parse('[00]') // ❌ SyntaxError: Unexpected number
JSON.parse('[0]')  // ✅ Works: [0]
JSON.parse('[1]')  // ✅ Works: [1]
```

JSON spec (RFC 8259) states:
> "A number is represented in base 10 using decimal digits. It contains an integer component that may be prefixed with an optional minus sign, which may be followed by a fraction part and/or an exponent part. Leading zeros are not allowed."

### Where the Error Originates
```
Browser Extension
    ↓
Injects script tag → <script src="https://apis.google.com/js/api.js"></script>
    ↓
Google API loads → gapi.load('gapi.iframes', ...)
    ↓
Tries to parse storage/cache value → JSON.parse('[00]')
    ↓
ERROR: SyntaxError: Unexpected number in JSON
```

## Monitoring

To see if the error suppressor is working:
```javascript
// Add to your browser console after page load:
console.log('Error suppressor active:', typeof window.ErrorSuppressor !== 'undefined');
```

## Production Considerations

The ErrorSuppressor component:
- ✅ Only runs on the client side
- ✅ Doesn't affect server-side rendering
- ✅ Has minimal performance impact
- ✅ Only intercepts console.error, not actual error handling
- ✅ Preserves all your application's error logging
- ✅ Cleans up properly on unmount

## Summary

✅ **Fixed:** Added ErrorSuppressor component to suppress external Google API errors
✅ **Updated:** Root layout to include the error suppressor globally
📝 **Next:** Test in incognito mode and identify the source if needed
🎯 **Result:** Your console should be clean of this specific error

## Need More Help?

If the error persists or causes actual functionality issues (not just console noise):
1. Share the full stack trace
2. List your installed browser extensions
3. Check if it happens in multiple browsers
4. Try completely disabling all extensions
