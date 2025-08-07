# ImageCraft - Advanced Image Tools Chrome Extension

A powerful Chrome extension that enhances your image handling capabilities with format conversion and background removal features.

## Features

### 🎨 Multi-Format Support

- Save images as PNG, JPG, or WEBP
- Copy images to clipboard in different formats
- Automatic format optimization

### 🪄 Background Removal

- Remove backgrounds with AI-powered technology
- Uses Cloudinary AI or Remove.bg API
- One-click transparent PNG generation

### 📋 Enhanced Context Menu

- Right-click any image for quick actions
- Save As → Multiple format options
- Copy Image As → Format selection with background removal
- Search with Google Lens integration

### 📊 Processing History

- Track all processed images
- Filter by format, type, and date
- Quick re-download or copy
- Bulk management options

### ⚙️ Customizable Settings

- Configure Cloudinary credentials
- Optional Remove.bg API integration
- Default format preferences
- Auto-download options

## Installation

### From Source (Development)

1. Clone this repository:

```bash
git clone https://github.com/yourusername/imagecraft.git
cd imagecraft
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the extension directory

5. The extension icon will appear in your toolbar

### Configuration

1. Click the ImageCraft icon in your toolbar
2. Enter your Cloudinary credentials:
   - Cloud Name: Your Cloudinary cloud name
   - Upload Preset: An unsigned upload preset (create one in Cloudinary dashboard)
3. (Optional) Add Remove.bg API key for enhanced background removal
4. Save settings

## Usage

### Converting Image Formats

1. Right-click any image on a webpage
2. Select **ImageCraft** → **Save As**
3. Choose your desired format (PNG, JPG, WEBP)
4. The image will be converted and downloaded

### Removing Backgrounds

1. Right-click any image
2. Select **ImageCraft** → **Copy Image As** → **PNG without Background**
3. The processed image will be copied to your clipboard
4. Paste it anywhere (documents, image editors, etc.)

### Viewing History

1. Click the extension icon
2. Select "History"
3. Browse, filter, and manage your processed images

## API Setup

### Cloudinary Setup

1. Sign up for a free [Cloudinary account](https://cloudinary.com)
2. Go to Settings → Upload
3. Create an unsigned upload preset
4. Note your cloud name and preset name

### Remove.bg Setup (Optional)

1. Sign up at [Remove.bg](https://remove.bg)
2. Get your API key from the dashboard
3. Add it in the extension settings

## Security & Privacy

- All image processing happens through secure APIs
- No images are stored on our servers
- Cloudinary uses unsigned presets (no API keys exposed)
- Remove.bg API key is stored locally and encrypted
- Processing history is stored locally in your browser

## Development

### Project Structure

```
imagecraft/
├── manifest.json          # Extension manifest (V3)
├── background.js          # Service worker for context menus
├── content.js            # Content script for page interaction
├── popup.html/js/css     # Extension popup UI
├── history.html/js       # History management page
├── icons/                # Extension icons
└── utils/                # Helper utilities
```

### Technologies Used

- Chrome Extension Manifest V3
- Service Workers for background processing
- Cloudinary API for image transformation
- Remove.bg API for background removal
- Vanilla JavaScript (no frameworks)

### Building for Production

```bash
npm run build
```

This creates a `imagecraft.zip` file ready for Chrome Web Store submission.

## Troubleshooting

### Images not converting

- Check Cloudinary credentials in settings
- Ensure you have an active internet connection
- Verify the upload preset is unsigned

### Background removal not working

- Cloudinary AI requires a paid plan for advanced features
- Try adding a Remove.bg API key for better results
- Check API quotas if using Remove.bg

### Extension not appearing

- Ensure Developer mode is enabled
- Reload the extension from chrome://extensions
- Check for console errors (F12)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:

- Open an issue on [GitHub](https://github.com/yourusername/imagecraft/issues)
- Contact: your.email@example.com

## Acknowledgments

- [Cloudinary](https://cloudinary.com) for image transformation APIs
- [Remove.bg](https://remove.bg) for background removal API
- Chrome Extensions team for excellent documentation

---

**Note**: This extension requires valid Cloudinary credentials to function. Sign up for a free account to get started.
