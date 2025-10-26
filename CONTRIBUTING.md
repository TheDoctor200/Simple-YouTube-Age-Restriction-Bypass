# Contributing to Simple YouTube Age Restriction Bypass

Thank you for your interest in contributing! This project relies on community contributions to stay compatible with YouTube's frequent updates.

## 🚨 Current Status

YouTube frequently updates their platform, which breaks age restriction bypass methods. We need help from the community to:

- Identify new YouTube API endpoints
- Update outdated bypass methods
- Test compatibility across different browsers
- Document YouTube's internal API changes

## 🛠️ Development Setup

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- A userscript manager (Tampermonkey/Violentmonkey) for testing

### Installation

```bash
git clone https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass.git
cd Simple-YouTube-Age-Restriction-Bypass
npm install
```

### Building

```bash
# Build once
npm run build

# Watch mode for development
npm run dev
```

The compiled userscript will be in `dist/Simple-YouTube-Age-Restriction-Bypass.user.js`

## 🔍 How to Debug YouTube Changes

### 1. Identify the Issue

When the extension stops working:

1. Open YouTube in your browser
2. Open DevTools (F12) → Network tab
3. Try to play an age-restricted video
4. Look for failed requests or errors in the console

### 2. Common YouTube API Endpoints

YouTube uses these internal APIs (subject to change):

- `/youtubei/v1/player` - Main player data
- `/youtubei/v1/next` - Related videos and comments
- `/get_video_info` - Legacy video information (deprecated)
- Embed player: `youtube.com/embed/{videoId}`

### 3. Key Data to Extract

For age-restricted videos, we need:

- `streamingData` - Contains video/audio URLs
- `videoDetails` - Title, description, etc.
- `playabilityStatus` - Age restriction status

### 4. Debugging Tips

```javascript
// Monitor YouTube's internal API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch:', args[0]);
    return originalFetch.apply(this, args);
};

// Check ytInitialPlayerResponse
console.log(window.ytInitialPlayerResponse);

// Check ytplayer config
console.log(window.ytplayer?.config);
```

## 📝 Reporting YouTube Changes

When YouTube breaks the extension, please open an issue with:

### Required Information

```markdown
**Browser & Version:**
- Browser: Chrome/Firefox/Safari/Edge
- Version: 120.0.0

**YouTube Details:**
- Video ID: (e.g., dQw4w9WgXcQ)
- Error Type: Age restriction / Playback failed / Other

**Console Errors:**
```
Paste any errors from browser console
```

**Network Requests:**
- Screenshot or description of failed network requests

**Additional Context:**
- When did it stop working?
- Does it work in incognito/private mode?
```

## 🔧 Common Fixes

### Update API Client Version

YouTube's InnerTube API requires specific client versions:

```javascript
// Check current working versions
const CLIENTS = {
    WEB: {
        clientName: 'WEB',
        clientVersion: '2.20231218.01.00'  // Update this
    },
    ANDROID: {
        clientName: 'ANDROID',
        clientVersion: '18.48.39'  // Update this
    },
    TV_EMBEDDED: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0'
    }
};
```

### Update Request Headers

```javascript
const headers = {
    'Content-Type': 'application/json',
    'X-YouTube-Client-Name': '1',  // May change
    'X-YouTube-Client-Version': '2.20231218.01.00',  // Update regularly
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/'
};
```

## 🧪 Testing Your Changes

1. **Build the userscript:**
   ```bash
   npm run build
   ```

2. **Install in your userscript manager:**
   - Open Tampermonkey/Violentmonkey
   - Install from file: `dist/Simple-YouTube-Age-Restriction-Bypass.user.js`

3. **Test cases:**
   - ✅ Age-restricted video plays
   - ✅ Normal videos still work
   - ✅ Video quality selection works
   - ✅ No console errors
   - ✅ Works on both www.youtube.com and m.youtube.com

4. **Test in multiple browsers:**
   - Chrome/Chromium
   - Firefox
   - Safari (if possible)

## 📤 Submitting Pull Requests

### PR Guidelines

1. **One fix per PR** - Keep changes focused
2. **Test thoroughly** - Include test results in PR description
3. **Update documentation** - If you change how something works
4. **Follow code style** - Run `npm run format` before committing

### PR Template

```markdown
## Description
Brief description of what this fixes

## Related Issue
Fixes #123

## Changes Made
- Updated YouTube API client version
- Modified request headers
- Fixed error handling

## Testing
- [x] Tested on Chrome 120
- [x] Tested on Firefox 121
- [ ] Tested on Safari
- [x] Age-restricted videos work
- [x] Normal videos still work
- [x] No console errors

## Screenshots/Logs
(Optional) Add screenshots or console logs showing it works
```

## 🔄 Keeping Up with YouTube Changes

### Resources to Monitor

- [YouTube's IFrame API Docs](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Data API Changelog](https://developers.google.com/youtube/v3/revision_history)
- Chrome DevTools Network tab while using YouTube
- Community Discord/forums for YouTube API developers

### Reverse Engineering Tips

1. **Use Chrome DevTools:**
   - Network tab → Filter by "player" or "youtubei"
   - Copy request as cURL/fetch
   - Analyze request/response structure

2. **Check YouTube's JavaScript:**
   - View page source
   - Search for `ytInitialPlayerResponse`
   - Search for `ytcfg`

3. **Compare working vs broken:**
   - Test in fresh browser without extension
   - Compare network requests
   - Identify what changed

## 📞 Getting Help

- **GitHub Issues:** For bug reports and feature requests
- **Discussions:** For questions and general help
- **Pull Requests:** For code contributions

## ⚖️ Legal & Ethical Considerations

This project is for **educational purposes only**:

- Respect YouTube's Terms of Service
- Don't use for commercial purposes
- Consider age restrictions exist for a reason
- Verify your local laws regarding circumventing access controls

---

Thank you for helping keep this project alive! 🙏
