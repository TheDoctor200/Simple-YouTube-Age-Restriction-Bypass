---
name: YouTube API Change
about: Report detected changes in YouTube's internal API
title: '[API CHANGE] '
labels: youtube-api, needs-investigation
assignees: ''
---

## Change Detection Date

When did you first notice this change?

## Affected Endpoints

Which YouTube API endpoints have changed?

- [ ] `/youtubei/v1/player`
- [ ] `/youtubei/v1/next`
- [ ] Embed player
- [ ] Other:

## What Changed

### Request Changes
```json
// Old request format
{
  "example": "old"
}

// New request format
{
  "example": "new"
}
```

### Response Changes
```json
// Old response structure
{
  "example": "old"
}

// New response structure
{
  "example": "new"
}
```

### Header Changes

| Header | Old Value | New Value |
|--------|-----------|-----------|
| X-YouTube-Client-Version | 2.20231101 | 2.20231218 |

## Evidence

### Network Request Screenshot
(Attach screenshot from DevTools Network tab)

### Console Output
```javascript
// Paste relevant console output
```

### cURL Command
```bash
# Paste working cURL command
curl 'https://www.youtube.com/youtubei/v1/player' \
  -H 'content-type: application/json' \
  --data-raw '{"videoId":"..."}'
```

## Impact

- [ ] Breaks age-restricted video playback
- [ ] Breaks normal video playback
- [ ] Causes console errors
- [ ] Other:

## Proposed Solution

If you have ideas on how to adapt to this change:

```javascript
// Proposed code changes
```

## Testing

Have you tested a workaround?
- [ ] Yes, and it works
- [ ] Yes, but needs more testing
- [ ] No, just reporting the change

## Additional Resources

- Links to related discussions
- References to YouTube API documentation
- Other relevant information
