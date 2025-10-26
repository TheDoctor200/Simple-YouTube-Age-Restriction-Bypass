# Debugging Guide for YouTube Age Restriction Bypass

This guide helps developers debug and fix issues when YouTube makes API changes.

## 🔍 Quick Diagnosis

### Step 1: Identify the Problem

Open browser console (F12) and check for errors:

```javascript
// Common error patterns
"Failed to fetch"           → API endpoint changed
"playabilityStatus"         → Age verification logic changed
"streamingData undefined"   → Response structure changed
"403 Forbidden"             → Authentication/headers issue
```

### Step 2: Check YouTube's Response

```javascript
// In console, inspect the player response
console.log(window.ytInitialPlayerResponse);

// Key fields to check:
// - playabilityStatus.status (should be "OK" or "UNPLAYABLE")
// - streamingData (contains video URLs)
// - videoDetails (metadata)
```

## 🛠️ Common YouTube API Methods

### Method 1: InnerTube API (Primary)

YouTube's internal API used by the website itself.

```javascript
// Endpoint
POST https://www.youtube.com/youtubei/v1/player?key=AIzaSy...

// Request body
{
    "context": {
        "client": {
            "clientName": "WEB",
            "clientVersion": "2.20231218.01.00",
            "hl": "en",
            "gl": "US"
        }
    },
    "videoId": "dQw4w9WgXcQ"
}

// Important headers
{
    "Content-Type": "application/json",
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": "2.20231218.01.00"
}
```

**How to find current versions:**

```javascript
// Extract from YouTube page
const ytcfg = window.ytcfg.data_;
console.log('Client Name:', ytcfg.INNERTUBE_CLIENT_NAME);
console.log('Client Version:', ytcfg.INNERTUBE_CLIENT_VERSION);
console.log('API Key:', ytcfg.INNERTUBE_API_KEY);
```

### Method 2: Embed Player (Fallback)

The embed player often has different restrictions.

```javascript
// Embed URL
https://www.youtube.com/embed/{videoId}

// Extract player response from embed page
const embedResponse = await fetch(`https://www.youtube.com/embed/${videoId}`);
const html = await embedResponse.text();

// Find ytInitialPlayerResponse in the HTML
const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
if (match) {
    const playerResponse = JSON.parse(match[1]);
    console.log(playerResponse);
}
```

### Method 3: TV Client (Alternative)

TV clients sometimes bypass restrictions.

```javascript
{
    "context": {
        "client": {
            "clientName": "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
            "clientVersion": "2.0",
            "hl": "en"
        }
    },
    "videoId": "dQw4w9WgXcQ"
}
```

### Method 4: Android Client (Mobile)

```javascript
{
    "context": {
        "client": {
            "clientName": "ANDROID",
            "clientVersion": "18.48.39",
            "androidSdkVersion": 30,
            "hl": "en",
            "gl": "US"
        }
    },
    "videoId": "dQw4w9WgXcQ",
    "params": "CgIQBg"  // Quality parameter
}
```

## 📊 Response Structure

### Successful Response

```json
{
    "playabilityStatus": {
        "status": "OK"
    },
    "streamingData": {
        "formats": [...],           // Video+Audio combined
        "adaptiveFormats": [...]    // Separate video/audio streams
    },
    "videoDetails": {
        "videoId": "...",
        "title": "...",
        "lengthSeconds": "...",
        "isLiveContent": false
    }
}
```

### Age-Restricted Response (Blocked)

```json
{
    "playabilityStatus": {
        "status": "UNPLAYABLE",
        "reason": "Sign in to confirm your age",
        "errorScreen": {
            "playerErrorMessageRenderer": {
                "reason": {
                    "simpleText": "Sign in to confirm your age"
                }
            }
        }
    }
}
```

## 🔧 Debugging Techniques

### Technique 1: Network Monitoring

```javascript
// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    if (url.includes('youtubei') || url.includes('player')) {
        console.log('📡 YouTube API Call:', url);
        return originalFetch.apply(this, args).then(response => {
            response.clone().json().then(data => {
                console.log('📥 Response:', data);
            });
            return response;
        });
    }
    return originalFetch.apply(this, args);
};
```

### Technique 2: Compare Requests

```javascript
// Capture working request from incognito mode
// Compare with your bypass attempt

// Working parameters
const workingRequest = {
    clientName: "WEB",
    clientVersion: "2.20231218.01.00"
};

// Your request
const yourRequest = {
    clientName: "WEB",
    clientVersion: "2.20231101.00.00"  // Outdated!
};
```

### Technique 3: Test Different Clients

```javascript
const clients = [
    { name: 'WEB', version: '2.20231218.01.00' },
    { name: 'ANDROID', version: '18.48.39' },
    { name: 'IOS', version: '18.48.3' },
    { name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0' }
];

for (const client of clients) {
    const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        body: JSON.stringify({
            context: { client: { clientName: client.name, clientVersion: client.version } },
            videoId: 'VIDEO_ID'
        })
    });
    const data = await response.json();
    console.log(`${client.name}:`, data.playabilityStatus.status);
}
```

## 🚨 Common Issues & Solutions

### Issue 1: "403 Forbidden"

**Cause:** Missing or incorrect headers

**Solution:**
```javascript
const headers = {
    'Content-Type': 'application/json',
    'X-YouTube-Client-Name': '1',
    'X-YouTube-Client-Version': '2.20231218.01.00',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/'
};
```

### Issue 2: "No streamingData"

**Cause:** Client version outdated or wrong client type

**Solution:** Update client version or try different client (ANDROID, TV_EMBEDDED)

### Issue 3: "Sign in to confirm your age"

**Cause:** Current bypass method no longer works

**Solution:** Try alternative clients or use embed player method

## 📝 Creating Test Cases

```javascript
// Test age-restricted video
const TEST_VIDEOS = {
    ageRestricted: 'dQw4w9WgXcQ',  // Replace with actual age-restricted video
    normal: 'jNQXAC9IVRw',         // Normal "Me at the zoo" video
    live: 'LIVE_VIDEO_ID',
    premium: 'PREMIUM_VIDEO_ID'
};

async function testVideo(videoId) {
    try {
        const response = await getPlayerResponse(videoId);
        const status = response.playabilityStatus.status;
        const hasStreams = !!response.streamingData;

        console.log(`Video ${videoId}:`, {
            status,
            hasStreams,
            canPlay: status === 'OK' && hasStreams
        });
    } catch (error) {
        console.error(`Failed for ${videoId}:`, error);
    }
}
```

## 🔄 Update Process

When YouTube changes their API:

1. **Detect the change:**
   - Extension stops working
   - Console shows errors
   - Network requests fail

2. **Analyze what changed:**
   - Compare old vs new network requests
   - Check for new required headers
   - Look for API version updates

3. **Find working parameters:**
   - Test different client versions
   - Try alternative endpoints
   - Check embed player

4. **Update the code:**
   - Update client versions
   - Add new headers if needed
   - Implement fallback methods

5. **Test thoroughly:**
   - Age-restricted videos
   - Normal videos
   - Different browsers
   - Mobile YouTube

6. **Document changes:**
   - Update CHANGELOG
   - Note what changed
   - Add comments in code

## 📚 Useful Resources

- **YouTube API Explorer:** https://developers.google.com/youtube/v3
- **InnerTube API (unofficial):** Various GitHub repos documenting the API
- **Browser DevTools:** F12 → Network/Console tabs
- **Postman/Insomnia:** For testing API requests
- **cURL:** Command-line testing

## 🤝 Getting Help

If you're stuck:

1. Check existing GitHub issues
2. Search for similar problems
3. Create detailed bug report with:
   - Console errors
   - Network requests
   - Steps to reproduce
   - Browser/version info

---

Remember: YouTube can change their API at any time. This is a cat-and-mouse game that requires constant updates!
