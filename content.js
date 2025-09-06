// content.js

// Initialize third-party libraries
const zip = new JSZip();
const turndownService = new TurndownService();


// A small utility function to wait for an element to appear in the DOM
function waitForElement(selector, timeout = null) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        let timeoutId = null;

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Set up timeout if specified
        if (timeout) {
            timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }, timeout);
        }
    });
}

// Function to sanitize filenames
function sanitizeFilename(name) {
    // Replace invalid file name characters with an underscore
    return name.replace(/[<>:"/\\|?*]+/g, '_');
}

async function openSidebar() {
    // 1. Click the 'Files in this chat' button to open the sidebar
    // Using a stable data-test-id selector is best
    console.log("[gemini-file-downloader] Opening the Files sidebar...");

    // Only click if the sidebar isn't already open
    const sidebar = document.querySelector('context-sidebar');
    if (!sidebar) {
        console.log("[gemini-file-downloader] Sidebar not open, clicking to open.");
        const filesButton = await waitForElement('button[data-test-id="studio-sidebar-button"]', 10000);
        filesButton.click();

        // 2. Wait for the sidebar to appear and get all file "chips"
        console.log("[gemini-file-downloader] Waiting for the sidebar to load...");
        await waitForElement('context-sidebar', 10000);
    } else {
        console.log("[gemini-file-downloader] Sidebar already open.");
    }

    // The file chips are identified by their host element and class
    console.log("[gemini-file-downloader] Waiting for chips...");
    await waitForElement('sidebar-immersive-chip .container', 8000);

    return document.querySelector('context-sidebar');
}

// Function to create and show the download overlay
function showDownloadOverlay(current = 0, total = 0, fileList = []) {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('gemini-download-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'gemini-download-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90vw;
        max-height: 80vh;
        text-align: center;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Assembling Files';
    title.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 24px;
        font-weight: 600;
    `;

    const progressText = document.createElement('div');
    progressText.id = 'download-progress-text';
    progressText.textContent = total > 0 ? `${current} of ${total} files` : 'Preparing download...';
    progressText.style.cssText = `
        margin-bottom: 20px;
        color: #666;
        font-size: 16px;
    `;

    const progressBarContainer = document.createElement('div');
    progressBarContainer.style.cssText = `
        width: 100%;
        height: 8px;
        background-color: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 24px;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'download-progress-bar';
    progressBar.style.cssText = `
        height: 100%;
        background-color: #34a853;
        width: ${total > 0 ? (current / total) * 100 : 0}%;
        transition: width 0.3s ease;
        border-radius: 4px;
    `;

    // File list container
    const fileListContainer = document.createElement('div');
    fileListContainer.id = 'download-file-list';
    fileListContainer.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 24px;
        text-align: left;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
    `;

    // Populate file list
    if (fileList.length > 0) {
        fileList.forEach((filename, index) => {
            const fileItem = document.createElement('div');
            fileItem.id = `file-item-${index}`;
            fileItem.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
                font-size: 14px;
            `;

            const statusIcon = document.createElement('span');
            statusIcon.id = `file-status-${index}`;
            statusIcon.style.cssText = `
                margin-right: 12px;
                font-size: 16px;
                width: 20px;
                text-align: center;
            `;
            statusIcon.textContent = '⏳'; // Waiting icon

            const fileName = document.createElement('span');
            fileName.textContent = filename;
            fileName.style.cssText = `
                flex: 1;
                color: #333;
            `;

            fileItem.appendChild(statusIcon);
            fileItem.appendChild(fileName);
            fileListContainer.appendChild(fileItem);
        });
    } else {
        fileListContainer.textContent = 'Scanning for files...';
        fileListContainer.style.textAlign = 'center';
        fileListContainer.style.color = '#666';
    }

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel Download';
    cancelButton.style.cssText = `
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    `;

    cancelButton.onmouseover = () => {
        cancelButton.style.backgroundColor = '#c82333';
    };
    cancelButton.onmouseout = () => {
        cancelButton.style.backgroundColor = '#dc3545';
    };

    cancelButton.onclick = () => {
        window.geminiDownloadCancelled = true;
        hideDownloadOverlay();
        updateProgressIndicator(0, 0, true); // Reset state
        alert('Download cancelled');
    };

    progressBarContainer.appendChild(progressBar);
    modal.appendChild(title);
    modal.appendChild(progressText);
    modal.appendChild(progressBarContainer);
    modal.appendChild(fileListContainer);
    modal.appendChild(cancelButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Function to update the download overlay
function updateDownloadOverlay(current, total) {
    const progressText = document.getElementById('download-progress-text');
    const progressBar = document.getElementById('download-progress-bar');

    if (progressText && progressBar) {
        progressText.textContent = `${current} of ${total} files`;
        progressBar.style.width = `${(current / total) * 100}%`;
    }
}

// Function to update individual file status
function updateFileStatus(fileIndex, status) {
    const statusIcon = document.getElementById(`file-status-${fileIndex}`);
    if (statusIcon) {
        switch (status) {
            case 'processing':
                statusIcon.textContent = '🔄';
                statusIcon.style.color = '#1a73e8';
                break;
            case 'success':
                statusIcon.textContent = '✅';
                statusIcon.style.color = '#34a853';
                break;
            case 'error':
                statusIcon.textContent = '❌';
                statusIcon.style.color = '#dc3545';
                break;
            default:
                statusIcon.textContent = '⏳';
                statusIcon.style.color = '#666';
        }
    }
}

// Function to hide the download overlay
function hideDownloadOverlay() {
    const overlay = document.getElementById('gemini-download-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Function to update or create progress indicator
function updateProgressIndicator(current, total, isComplete = false) {
    const existingBtn = document.getElementById('downloadAllFilesBtn');

    if (isComplete) {
        // Clear global download state
        window.geminiDownloadInProgress = false;
        window.geminiDownloadProgress = "";
        window.geminiDownloadCancelled = false;

        // Hide overlay
        hideDownloadOverlay();

        // Restore download button to active state
        if (existingBtn) {
            existingBtn.disabled = false;
            existingBtn.style.opacity = '1';
            existingBtn.style.cursor = 'pointer';
            existingBtn.textContent = '⬇️ Download All';
        } else {
            injectButton();
        }
        return;
    }

    // Update overlay if it exists
    if (document.getElementById('gemini-download-overlay')) {
        updateDownloadOverlay(current, total);
    }

    // Make download button inactive but keep it visible
    if (existingBtn) {
        existingBtn.disabled = true;
        existingBtn.style.opacity = '0.5';
        existingBtn.style.cursor = 'not-allowed';
        existingBtn.textContent = 'Downloading...';
    }

    window.geminiDownloadProgress = `${current}/${total}`;
    console.log(`[gemini-file-downloader] Progress updated: ${current}/${total}`);
}

// The main function to orchestrate the download process
async function downloadAllFiles() {
    const startTime = Date.now();
    console.log("[gemini-file-downloader] Starting Gemini file download process...");

    // Set global download state
    window.geminiDownloadInProgress = true;
    window.geminiDownloadProgress = "Starting...";
    window.geminiDownloadCancelled = false;

    // Show overlay instead of alert
    showDownloadOverlay(0, 0);

    // Make the download button inactive immediately
    const existingBtn = document.getElementById('downloadAllFilesBtn');
    if (existingBtn) {
        console.log("[gemini-file-downloader] Making download button inactive...");
        existingBtn.disabled = true;
        existingBtn.style.opacity = '0.5';
        existingBtn.style.cursor = 'not-allowed';
        existingBtn.textContent = 'Downloading...';
    }

    var sidebar = await openSidebar(); if (!sidebar) {
        hideDownloadOverlay();
        alert("Could not open the sidebar. Aborting.");
        updateProgressIndicator(0, 0, true); // Restore button
        return;
    }

    const fileChips = sidebar.querySelectorAll('sidebar-immersive-chip .container');

    if (fileChips.length === 0) {
        hideDownloadOverlay();
        alert("No files found in the sidebar.");
        // We should also close the sidebar
        document.querySelector('button[data-test-id="close-button"]')?.click();
        updateProgressIndicator(0, 0, true); // Restore button
        return;
    }

    console.log(`Found ${fileChips.length} files to process.`);
    const totalFiles = fileChips.length;

    // Extract file names from chips
    const fileNames = [];
    fileChips.forEach((chip, index) => {
        const titleElement = chip.querySelector('.immersive-title');
        const fileName = titleElement ? titleElement.textContent.trim() + '.md' : `File ${index + 1}.md`;
        fileNames.push(fileName);
    });

    // Update overlay and progress indicator with actual counts and file list
    showDownloadOverlay(0, totalFiles, fileNames);
    updateProgressIndicator(0, totalFiles);    // 3. Iterate through each file chip
    for (var i = 0; i < fileChips.length; i++) {

        // Check for cancellation
        if (window.geminiDownloadCancelled) {
            console.log("[gemini-file-downloader] Download cancelled by user");
            break;
        }

        // Try to open sidebar with retries
        let sidebar = null;
        let sidebarRetries = 0;
        const maxSidebarRetries = 3;

        while (!sidebar && sidebarRetries < maxSidebarRetries) {
            sidebar = await openSidebar();
            if (!sidebar) {
                sidebarRetries++;
                console.warn(`Could not open sidebar for file ${i + 1}, attempt ${sidebarRetries}/${maxSidebarRetries}`);
                if (sidebarRetries < maxSidebarRetries) {
                    console.log(`Retrying sidebar open in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (!sidebar) {
            console.warn(`Failed to open sidebar for file ${i + 1} after ${maxSidebarRetries} attempts. Skipping.`);
            updateFileStatus(i, 'error');
            updateProgressIndicator(i + 1, totalFiles);
            continue;
        }

        // Need to get the chips fresh each time as the DOM updates
        const chips = sidebar.querySelectorAll('sidebar-immersive-chip .container');

        if (i >= chips.length) {
            console.warn(`File chip ${i + 1} no longer exists. Skipping.`);
            updateFileStatus(i, 'error');
            updateProgressIndicator(i + 1, totalFiles);
            continue;
        }

        const chip = chips[i];

        console.log("[gemini-file-downloader] Clicking on a file chip...");

        // Update file status to processing
        updateFileStatus(i, 'processing');

        chip.click();

        // 4. Wait for the immersive panel to appear
        console.log("[gemini-file-downloader] Waiting for extended response panel...");
        const panel = await waitForElement('extended-response-panel');

        // 5. Extract filename and content
        console.log("[gemini-file-downloader] Extracting file content...");
        let success = false;
        let retryCount = 0;
        const maxRetries = 2;

        while (!success && retryCount <= maxRetries) {
            try {
                const titleElement = await waitForElement('extended-response-panel .title-text', 8000);
                const contentElement = await waitForElement('#extended-response-markdown-content', 8000);

                if (titleElement && contentElement) {
                    console.log("[gemini-file-downloader] Converting content to markdown...");
                    const rawFilename = titleElement.textContent.trim();
                    const filename = sanitizeFilename(rawFilename) + ".md";
                    console.log(`Processing: ${filename}`);

                    const contentHtml = contentElement.innerHTML;
                    const markdownContent = turndownService.turndown(contentHtml);

                    // 6. Add the markdown file to our zip object
                    zip.file(filename, markdownContent);

                    // Mark file as successful
                    updateFileStatus(i, 'success');
                    success = true;

                    // Update progress indicator
                    updateProgressIndicator(i + 1, totalFiles);
                } else {
                    throw new Error("Could not find title or content elements");
                }
            } catch (error) {
                retryCount++;
                console.warn(`Attempt ${retryCount} failed for file ${i + 1}: ${error.message}`);

                if (retryCount <= maxRetries) {
                    console.log(`Retrying file ${i + 1} (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                } else {
                    console.warn(`Failed to process file ${i + 1} after ${maxRetries + 1} attempts`);
                    // Mark file as failed
                    updateFileStatus(i, 'error');
                    // Still update progress even if we failed to process this file
                    updateProgressIndicator(i + 1, totalFiles);
                }
            }
        }        // 7. Close the immersive panel to go back to the list
        console.log("[gemini-file-downloader] Closing immersive panel...");
        const closeButton = panel.querySelector('button[data-test-id="close-button"]');
        if (closeButton) {
            console.log("[gemini-file-downloader] Clicking close button...");
            closeButton.click();

            // Add a small delay to allow the UI to update
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            alert("Could not close the file panel. The process might be stuck.");
            break; // Exit the loop if we can't continue
        }

        // Re-open the sidebar to ensure we can access the next chip
        let reopenRetries = 0;
        while (reopenRetries < 3) {
            const reopenedSidebar = await openSidebar();
            if (reopenedSidebar) break;
            reopenRetries++;
            if (reopenRetries < 3) {
                console.log(`Retrying sidebar reopen, attempt ${reopenRetries + 1}/3...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Close the main file sidebar
    document.querySelector('context-sidebar button[data-test-id="close-button"]')?.click();

    // Calculate statistics
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const successCount = Object.keys(zip.files).length;
    const failureCount = totalFiles - successCount;

    // 8. Generate and download the zip file
    if (Object.keys(zip.files).length > 0) {
        console.log("[gemini-file-downloader] Zipping files and preparing for download...");
        const chatTitle = document.title.split(' - ')[0] || "Gemini-Chat";
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFilename = `${sanitizeFilename(chatTitle)}-Files-${timestamp}.zip`;

        zip.generateAsync({ type: "blob" }).then(function (content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = zipFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show detailed completion message
            setTimeout(() => {
                const message = `Download complete!\n\n` +
                    `✅ Successfully downloaded: ${successCount} files\n` +
                    `${failureCount > 0 ? `❌ Failed: ${failureCount} files\n` : ''}` +
                    `⏱️ Time taken: ${duration} seconds\n` +
                    `📁 Saved as: ${zipFilename}`;
                alert(message);
                updateProgressIndicator(0, 0, true);
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (!window.geminiDownloadCancelled) {
                alert(`No files were successfully processed.\n\n` +
                    `❌ ${failureCount} files failed to download.\n` +
                    `⏱️ Time taken: ${duration} seconds\n\n` +
                    `Please check the console for error details.`);
            }
            updateProgressIndicator(0, 0, true);
        }, 100);
    }
}

// 9. Inject the "Download All" button into the UI
function injectButton() {
    console.log("[gemini-file-downloader] Attempting to inject Download All button...");
    if (document.getElementById('downloadAllFilesBtn')) {
        console.log("[gemini-file-downloader] Button already exists. Skipping injection.");
        return;
    }
    const sidebarHeader = document.querySelector('context-sidebar .header');
    if (sidebarHeader) {
        const closeButton = sidebarHeader.querySelector('button[data-test-id="close-button"]');
        if (!closeButton) {
            console.log("[gemini-file-downloader] Required elements not found in header.");
            return;
        }
        console.log("[gemini-file-downloader] Injecting Download All button...");
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '⬇️ Download All';
        downloadBtn.id = 'downloadAllFilesBtn';
        downloadBtn.title = 'Download all files as ZIP (Ctrl/Cmd + Shift + D)';
        // Style it to look somewhat native
        downloadBtn.style.cssText = `
            margin-left: 8px;
            padding: 6px 12px;
            background-color: #1a73e8;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease, transform 0.1s ease;
        `;

        // Add hover effects
        downloadBtn.onmouseenter = () => {
            if (!downloadBtn.disabled) {
                downloadBtn.style.backgroundColor = '#1557b0';
                downloadBtn.style.transform = 'scale(1.02)';
            }
        };
        downloadBtn.onmouseleave = () => {
            if (!downloadBtn.disabled) {
                downloadBtn.style.backgroundColor = '#1a73e8';
                downloadBtn.style.transform = 'scale(1)';
            }
        };

        downloadBtn.onclick = downloadAllFiles;
        sidebarHeader.insertBefore(downloadBtn, closeButton);
    } else {
        console.log("[gemini-file-downloader] Button already exists or container not found.");
    }
}

console.log("[gemini-file-downloader] Initializing...");

// Add keyboard shortcut (Ctrl/Cmd + Shift + D)
document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        const downloadBtn = document.getElementById('downloadAllFilesBtn');
        if (downloadBtn && !downloadBtn.disabled) {
            console.log("[gemini-file-downloader] Keyboard shortcut triggered");
            downloadAllFiles();
        }
    }
});

// Helper function to restore the appropriate UI element based on download state
function restoreAppropriateButton() {
    const sidebar = document.querySelector('context-sidebar .header');
    const hasDownloadBtn = document.getElementById('downloadAllFilesBtn');

    if (!sidebar || hasDownloadBtn) {
        return; // Nothing to restore or already exists
    }

    const isDownloading = window.geminiDownloadInProgress || false;

    // Always restore the download button, but set its state based on download status
    console.log("[gemini-file-downloader] Restoring download button to reopened sidebar");
    injectButton();

    // If downloading, make the button inactive
    if (isDownloading) {
        const btn = document.getElementById('downloadAllFilesBtn');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.textContent = 'Downloading...';
        }
    }
}

// Set up a mutation observer to re-inject button when sidebar shows/hides
function setupSidebarObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const sidebar = document.querySelector('context-sidebar .header');
                const hasDownloadBtn = document.getElementById('downloadAllFilesBtn');

                if (sidebar && !hasDownloadBtn) {
                    // Small delay to ensure DOM is fully updated
                    setTimeout(restoreAppropriateButton, 100);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

waitForElement('context-sidebar .header').then(() => {
    injectButton();
    setupSidebarObserver();
});
