# Gemini File Downloader Chrome Extension

A Chrome extension that allows you to easily download all files from Google Gemini chats as a ZIP archive with a progress overlay and detailed file status tracking.

## ✨ Features

- **One-Click Download**: Download all files from a Gemini chat with a single button click
- **Progress Overlay**: Full-page overlay with real-time progress tracking
- **File Status Indicators**: Visual status for each file (⏳ waiting, 🔄 processing, ✅ success, ❌ error)
- **Automatic Retry**: Failed files are automatically retried up to 2 times
- **Keyboard Shortcut**: Quick download with `Ctrl/Cmd + Shift + D`
- **Download Statistics**: Detailed completion summary with success rates and timing
- **Cancellation Support**: Cancel downloads at any time
- **Smart File Naming**: Converts files to Markdown format with sanitized filenames

## 🚀 Installation Instructions

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension Files**
   - Clone this repository or download the files:
     - `manifest.json`
     - `content.js`
     - `external/jszip.min.js`
     - `external/turndown.min.js`
     - `icons/` folder with all icon files

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Verify Installation**
   - The extension should be enabled automatically
   - You'll see the Gemini File Downloader in your extensions list

### Method 2: Install from Chrome Web Store
*Coming soon - this extension is currently in development*

## 📋 Usage Instructions

1. **Open a Google Gemini Chat**
   - Go to [gemini.google.com](https://gemini.google.com)
   - Open any chat that contains uploaded files

2. **Access the Files Sidebar**
   - Look for the "Files in this chat" button in the Gemini interface
   - Click it to open the sidebar (if not already open)

3. **Download Files**
   - **Method 1**: Click the blue "⬇️ Download All" button in the sidebar
   - **Method 2**: Use the keyboard shortcut `Ctrl+Shift+D` (Windows) or `Cmd+Shift+D` (Mac)

4. **Monitor Progress**
   - A full-page overlay will appear showing download progress
   - Watch as each file is processed with real-time status updates
   - See detailed progress bar and file count

5. **Complete Download**
   - Files are automatically downloaded as a ZIP file
   - ZIP filename format: `[Chat-Title]-Files-[Timestamp].zip`
   - View completion statistics including success rate and timing

## 🎯 How It Works

1. **File Detection**: Scans the Gemini sidebar for uploaded files
2. **Content Extraction**: Opens each file and extracts the content
3. **Markdown Conversion**: Converts HTML content to clean Markdown format
4. **ZIP Creation**: Packages all files into a single ZIP archive
5. **Download**: Triggers browser download with timestamped filename

## 🛠️ Technical Details

### File Structure
```
gemini-file-downloader/
├── manifest.json          # Extension manifest
├── content.js             # Main extension logic
├── external/
│   ├── jszip.min.js       # ZIP file creation
│   └── turndown.min.js    # HTML to Markdown conversion
└── icons/
    ├── icon16.svg         # 16x16 icon
    ├── icon48.svg         # 48x48 icon
    └── icon128.svg        # 128x128 icon
```

### Dependencies
- **[JSZip](https://stuk.github.io/jszip/)**: For creating ZIP archives
- **[Turndown](https://github.com/mixmark-io/turndown)**: For converting HTML content to Markdown
- **Chrome Extensions Manifest V3**: Modern extension framework

### Permissions
- `activeTab`: Access to the current Gemini tab
- `scripting`: Inject content scripts
- Host permissions for `gemini.google.com`

## 🔧 Development

### Local Development Setup
1. Clone the repository
2. Make changes to the files
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension card
5. Test your changes in a Gemini chat

### Key Functions
- `downloadAllFiles()`: Main orchestration function
- `showDownloadOverlay()`: Creates the progress overlay
- `updateFileStatus()`: Updates individual file status
- `openSidebar()`: Manages sidebar interaction
- `waitForElement()`: Utility for DOM element waiting

## 🎨 Customization

### Styling
The extension uses inline CSS for compatibility. Key styling elements:
- **Button**: Blue (#1a73e8) with hover effects
- **Overlay**: Semi-transparent dark background (70% opacity)
- **Progress Bar**: Green (#34a853) with smooth animations
- **Status Icons**: Emoji-based (⏳🔄✅❌) for universal compatibility

### Timeouts
- Sidebar opening: 10 seconds
- File content extraction: 8 seconds
- Chip detection: 8 seconds
- Retry delay: 1 second between attempts

## 🐛 Troubleshooting

### Common Issues

**Extension not appearing in sidebar:**
- Refresh the Gemini page
- Check that Developer mode is enabled
- Reload the extension in `chrome://extensions/`

**Download button disabled:**
- Make sure files are uploaded to the chat
- Open the files sidebar first
- Check browser console for errors

**Files not downloading:**
- Ensure pop-ups are allowed for gemini.google.com
- Check that JavaScript is enabled
- Try refreshing and attempting again

**Some files showing as failed:**
- Large files may timeout - this is normal
- Failed files are automatically retried
- Check the completion summary for details

### Debug Mode
Open browser console (F12) to see detailed logging:
```javascript
// All extension logs are prefixed with:
[gemini-file-downloader]
```

## � Acknowledgments

This project uses the following open-source libraries:

- **[JSZip](https://stuk.github.io/jszip/)** by Stuart Knightley - A JavaScript library for creating, reading and editing .zip files
- **[Turndown](https://github.com/mixmark-io/turndown)** by Dom Christie - An HTML to Markdown converter written in JavaScript

Special thanks to the developers of these excellent libraries that make this extension possible.

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with different Gemini chats
5. Submit a pull request

## 📧 Support

If you encounter issues or have suggestions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review browser console logs for error details

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Basic file download functionality
- Progress overlay with file status tracking
- Keyboard shortcuts
- Automatic retry logic
- Download statistics

---

**Note**: This extension is not affiliated with Google or the Gemini project. It's a community tool designed to enhance the Gemini chat experience.
