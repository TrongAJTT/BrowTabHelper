# Pattern URL Processor

A simple browser extension to help you generate, manage, and open multiple tabs based on URL patterns. Designed for batch operations and tab management, especially useful for bulk opening links or working with sequential URLs.

## Features

- **Generate URLs:**
  - Enter a URL pattern with `{id}` as a placeholder (e.g., `https://example.com/page/{id}`).
  - Specify start and end IDs to generate a list of URLs.
  - Copy generated URLs to clipboard or open all at once.

- **Open URLs in Batch:**
  - Paste or load a list of URLs.
  - Open all URLs at once, or open in batches (set batch size).
  - Track progress and reset batch status.

- **Profile Management:**
  - Save, switch, rename, delete, import, and export profiles for different sets of URLs and settings.

## How to Use

1. **Install the Extension:**
   - Load the extension in your browser (Chrome/Edge) via developer mode.
   - Click the extension icon to open the popup.

2. **Generate URLs:**
   - Enter a URL pattern and ID range, then click "Generate URLs".
   - Use "Copy" to copy all generated URLs, or "Open All" to open them in new tabs.

3. **Open URLs in Batch:**
   - Switch to the "Open URLs" tab.
   - Paste your list of URLs or load from generated URLs.
   - Set batch size and use "Open Batch" or "Open All URLs".

4. **Profiles:**
   - Use the "Profile" tab to save/load different sets of URLs and settings.

## Permissions

- `tabs`: To open new browser tabs.
- `storage`: To save your settings and profiles.
- `clipboardWrite`: To copy URLs to clipboard.
- `clipboardRead` (via user gesture): To read URLs from clipboard.

## Notes

- Opening too many tabs at once may slow down your browser. The extension will warn you if you try to open more than 20 tabs.

## License

MIT License
