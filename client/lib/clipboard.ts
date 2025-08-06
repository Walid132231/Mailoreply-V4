/**
 * Clipboard utility with fallback support for environments where
 * the Clipboard API is blocked due to permissions policy
 */

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Copy text to clipboard with fallback support
 * @param text Text to copy
 * @returns Promise with success status and optional error message
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (!text) {
    return { success: false, error: 'No text provided' };
  }

  // Try modern clipboard API first (requires secure context and permissions)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error: any) {
      console.warn('Clipboard API failed, trying fallback:', error.message);
      // Continue to fallback method
    }
  }

  // Fallback method using deprecated document.execCommand
  // This works in more contexts but is less reliable
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible but accessible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Focus and select the text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    // Execute copy command
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    if (successful) {
      return { success: true };
    } else {
      throw new Error('execCommand copy failed');
    }
    
  } catch (error: any) {
    console.error('All clipboard methods failed:', error);
    return { 
      success: false, 
      error: `Copy failed: ${error.message || 'Unknown error'}` 
    };
  }
}

/**
 * Check if clipboard operations are supported
 */
export function isClipboardSupported(): boolean {
  return !!(
    (navigator.clipboard && navigator.clipboard.writeText) ||
    document.queryCommandSupported?.('copy')
  );
}

/**
 * Show user-friendly error message for clipboard failures
 */
export function showClipboardError(error?: string): void {
  const message = error || 'Failed to copy to clipboard';
  
  // Try to show a more user-friendly message
  if (typeof window !== 'undefined') {
    // You could replace this with a toast notification library
    alert(`${message}. Please manually select and copy the text.`);
  } else {
    console.error(message);
  }
}

/**
 * High-level copy function with user feedback
 */
export async function copyWithFeedback(text: string, showSuccessMessage = false): Promise<boolean> {
  const result = await copyToClipboard(text);
  
  if (result.success) {
    if (showSuccessMessage) {
      // You could replace this with a toast notification
      console.log('Copied to clipboard successfully');
    }
    return true;
  } else {
    showClipboardError(result.error);
    return false;
  }
}
