/**
 * Utility functions for handling images, base64 data URIs, and safe full-screen opening.
 */

/**
 * Converts a base64 data URI into a native Blob.
 */
export function dataUriToBlob(dataUri: string): Blob {
  const parts = dataUri.split(',')
  const mimeMatch = parts[0]?.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const rawBase64 = (parts[1] || '').replace(/\s/g, '')
  const byteString = atob(rawBase64)
  const buffer = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    buffer[i] = byteString.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
}

/**
 * Safely opens an image (including base64 data URIs) in a new browser tab.
 * Modern Chromium and WebKit browsers block top-frame navigation to `data:` URIs (resulting in blank screens).
 * Converting to a Blob Object URL resolves this restriction cleanly.
 */
export function openImageSafe(imageUrl: string, title: string = 'Proof of Delivery Receipt'): void {
  if (!imageUrl) return

  // If it's a regular web URL or already an object URL, open directly
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:')) {
    window.open(imageUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // Handle data: URIs safely by converting to a Blob URL
  if (imageUrl.startsWith('data:')) {
    try {
      const blob = dataUriToBlob(imageUrl)
      const blobUrl = URL.createObjectURL(blob)
      const newTab = window.open(blobUrl, '_blank')

      // Clean up the object URL after a timeout to prevent memory leaks
      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl)
        } catch {
          // ignore
        }
      }, 60000)

      if (newTab) return
    } catch (err) {
      console.warn('Failed to convert data URI to blob URL, trying popup document fallback:', err)
    }

    // Fallback if popup blocked or conversion failed: open popup window and write HTML document
    try {
      const popup = window.open('', '_blank')
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>${title}</title>
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  background-color: #09090b;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: auto;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                img {
                  max-width: 95vw;
                  max-height: 95vh;
                  object-fit: contain;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                  border-radius: 6px;
                }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="${title}" />
            </body>
          </html>
        `)
        popup.document.close()
      }
    } catch (fallbackErr) {
      console.error('Failed to open image via popup document fallback:', fallbackErr)
    }
  }
}

/**
 * Triggers a direct download of an image (data URI or remote URL).
 */
export function downloadImage(imageUrl: string, filename: string): void {
  if (!imageUrl) return

  let objectUrlToRevoke: string | null = null
  let href = imageUrl

  if (imageUrl.startsWith('data:')) {
    try {
      const blob = dataUriToBlob(imageUrl)
      href = URL.createObjectURL(blob)
      objectUrlToRevoke = href
    } catch {
      href = imageUrl
    }
  }

  const link = document.createElement('a')
  link.href = href
  link.download = filename || 'waybill-receipt.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (objectUrlToRevoke) {
    setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke!), 1000)
  }
}

