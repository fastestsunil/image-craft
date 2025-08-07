# ImageCraft Extension - Quick Test Checklist

## 🔧 Initial Setup (5 minutes)

### 1. Load Extension
```bash
# Your extension is located at:
/Users/sunilkumar/Personal/chrome-extensions/ImageCraft

# Steps:
1. Open Chrome
2. Go to: chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the ImageCraft folder
6. Extension icon should appear in toolbar
```

### 2. Quick Cloudinary Setup
```
1. Sign up: https://cloudinary.com/users/register/free
2. Get credentials from dashboard:
   - Cloud Name: (shown at top of dashboard)
   
3. Create unsigned preset:
   - Go to: Settings → Upload → Upload presets
   - Click: "Add upload preset"
   - Set: Signing Mode = "Unsigned"
   - Copy the preset name
   
4. Add to extension:
   - Click ImageCraft icon
   - Enter Cloud Name
   - Enter Upload Preset
   - Save Settings
```

---

## ✅ Feature Testing (10 minutes)

Copy and check off each test as you complete it:

### Basic Image Operations

#### Test 1: Save as PNG
- [ ] Go to: https://unsplash.com
- [ ] Right-click any image
- [ ] Select: ImageCraft → Save As → PNG
- [ ] Verify: File downloads as .png

#### Test 2: Save as JPG  
- [ ] Right-click another image
- [ ] Select: ImageCraft → Save As → JPG
- [ ] Verify: File downloads as .jpg

#### Test 3: Save as WEBP
- [ ] Right-click another image
- [ ] Select: ImageCraft → Save As → WEBP
- [ ] Verify: File downloads as .webp

### Clipboard Operations

#### Test 4: Copy as PNG
- [ ] Right-click an image
- [ ] Select: ImageCraft → Copy Image As → PNG
- [ ] Open any app (Preview/Paint/Word)
- [ ] Paste (Cmd+V / Ctrl+V)
- [ ] Verify: Image pastes successfully

#### Test 5: Copy without Background
- [ ] Find image with clear subject (person/product)
- [ ] Right-click → ImageCraft → Copy Image As → PNG without Background
- [ ] Wait for processing (see loading indicator)
- [ ] Paste in image editor
- [ ] Verify: Background removed (transparent)

### Additional Features

#### Test 6: Open in New Tab
- [ ] Right-click image
- [ ] Select: ImageCraft → Open Image in New Tab
- [ ] Verify: Image opens in new tab

#### Test 7: Google Lens Search
- [ ] Right-click image
- [ ] Select: ImageCraft → Search with Google Lens
- [ ] Verify: Google Lens opens with image

#### Test 8: History Page
- [ ] Click extension icon → History button
- [ ] Verify: History page opens
- [ ] Check: Previously processed images appear
- [ ] Test: Download button works
- [ ] Test: Copy button works
- [ ] Test: Filter by format

### Settings & Stats

#### Test 9: Statistics
- [ ] Click extension icon
- [ ] Check: "Images Processed" counter increased
- [ ] Check: "Backgrounds Removed" counter (if used)

#### Test 10: Settings Persistence  
- [ ] Change default format to JPG
- [ ] Save settings
- [ ] Close and reopen popup
- [ ] Verify: Settings saved

---

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| **"Failed to process image"** | Check Cloudinary credentials in popup |
| **No context menu** | Refresh the webpage |
| **Extension not working** | Reload from chrome://extensions |
| **Background removal fails** | Verify upload preset is "unsigned" |
| **Can't paste image** | Try different application or check clipboard permissions |

---

## 🔍 Debug Console

To see detailed errors:
```
1. Go to: chrome://extensions/
2. Find ImageCraft
3. Click: "service worker" or "background page"
4. Console opens - look for red errors
```

---

## 📝 Test Results Template

Copy this to track your testing:

```
Date: ________
Version: 1.0.0
Tester: ________

PASSED TESTS:
□ Format conversion (PNG/JPG/WEBP)
□ Clipboard operations
□ Background removal
□ Google Lens integration
□ History tracking
□ Settings persistence

ISSUES FOUND:
1. _________________________
2. _________________________
3. _________________________

NOTES:
_____________________________
_____________________________
```

---

## 🚀 Ready for Production?

If all tests pass:
1. ✅ All 10 tests completed successfully
2. ✅ No console errors
3. ✅ Settings save correctly
4. ✅ History tracks all operations
5. ✅ Background removal works (if configured)

**You're ready to publish to Chrome Web Store!**

---

## 📧 Quick Support

If you encounter issues:
1. Check console for errors (F12)
2. Verify Cloudinary credentials
3. Ensure upload preset is "unsigned"
4. Try different website/image
5. Restart Chrome if needed

---

## Next Steps

After successful testing:
1. Review `DEPLOYMENT_GUIDE.md` for publishing
2. Create store screenshots during testing
3. Prepare promotional materials
4. Submit to Chrome Web Store

Good luck! 🎉
