# ImageCraft Troubleshooting Guide

## 🔴 Issue: Images Not Downloading After Conversion

### Solution Steps:

#### 1. Reload the Extension (Required after code updates)

```
1. Go to: chrome://extensions/
2. Find ImageCraft
3. Click the refresh/reload icon (↻)
4. Try converting an image again
```

#### 2. Check Console for Errors

```
1. Go to: chrome://extensions/
2. Find ImageCraft
3. Click "service worker" or "background page" (blue text)
4. Console opens - look for red error messages
5. Share any errors you see
```

#### 3. Verify Cloudinary Settings

**Check your Cloudinary configuration:**

1. Click ImageCraft icon in toolbar
2. Verify:
   - Cloud Name: Should be YOUR cloud name (not "demo" or empty)
   - Upload Preset: Should be YOUR preset (not "unsigned_preset" or empty)

**To get correct values:**

1. Login to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Cloud Name is shown at the top
3. Go to Settings → Upload → Upload presets
4. Make sure your preset is set to "Unsigned"

#### 4. Test with Console Open

```
1. Open the service worker console (step 2 above)
2. Clear console (click 🚫 icon)
3. Try to convert an image
4. Watch for these messages:
   - "Starting image conversion:"
   - "Cloudinary settings:"
   - "Image processed, URL:"
   - "Download started, ID:"
```

---

## 📋 Common Error Messages and Fixes

### Error: "Please configure your Cloudinary cloud name"

**Fix:** Add your Cloudinary cloud name in extension settings

### Error: "Cloudinary error: Upload preset not found"

**Fix:**

1. Check preset name spelling (case-sensitive!)
2. Ensure preset is set to "Unsigned" mode
3. Create a new preset if needed

### Error: "Cloudinary error: Invalid image file"

**Fix:**

1. Try a different image
2. Some sites block direct image access
3. Try saving the image first, then converting

### Error: "Download failed: User cancelled"

**Fix:** The save dialog appeared but was cancelled. Try again and choose a location.

---

## 🔍 Debug Information to Share

If still having issues, please share:

1. **Console Output:**

   - All red error messages
   - The last few console.log messages

2. **Your Settings:**

   - Cloud Name (hide last few characters for security)
   - Upload Preset name

3. **Test Details:**
   - Website you're testing on
   - Image URL you're trying to convert
   - Format you're converting to

---

## 💡 Quick Test

After reloading the extension, try this simple test:

1. Go to: https://www.google.com/imghp
2. Search for: "test image"
3. Right-click any result
4. Select: ImageCraft → Save As → PNG
5. Check console for messages

If you see "Download started, ID: [number]" in console but no download:

- Check your Downloads folder
- Check Chrome's download bar at bottom
- Try different download location in Chrome settings

---

## 🔧 Complete Reset

If nothing works, try a complete reset:

1. **Remove and Re-add Extension:**

   ```
   1. Go to chrome://extensions/
   2. Remove ImageCraft
   3. Load unpacked again
   4. Re-enter settings
   ```

2. **Clear Extension Storage:**

   ```javascript
   // Run this in service worker console:
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```

3. **Test with New Cloudinary Preset:**
   - Create a new unsigned preset
   - Use that in settings
   - Try again

---

## 📞 Still Need Help?

If the issue persists after these steps:

1. **Check Cloudinary Dashboard:**

   - Login to Cloudinary
   - Check Media Library
   - See if images are being uploaded there

2. **Browser Issues:**

   - Try in Chrome Incognito mode
   - Disable other extensions temporarily
   - Check Chrome version (Menu → About)

3. **Share Full Error Details:**
   - Screenshot of console errors
   - Screenshot of extension settings
   - Cloudinary dashboard screenshot (hide sensitive info)

The extension is working - we just need to identify the specific configuration issue!
