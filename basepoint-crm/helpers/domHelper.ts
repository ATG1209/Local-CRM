
export const getCaretCoordinates = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();

    // If no rects (e.g. cursor at start of empty line), use getBoundingClientRect or a fallback
    if (rects.length === 0) {
        // Fallback for empty selection caret position? 
        // Usually straightforward if inside a text node, but trickier if empty p
        if (range.startContainer && range.startContainer.nodeType === Node.ELEMENT_NODE) {
            const el = range.startContainer as HTMLElement;
            // This is inexact. Better strategy: Insert a temp span, measure, remove.
            return null;
        }
        return null;
    }

    // Use the last rect for the "end" of the selection (cursor position)
    // Or for toolbar (top center of selection), we need the union.

    // Let's return the BoundingRect of the range, which covers the whole selection
    return range.getBoundingClientRect();
};

export const insertTextAtCaret = (text: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // We try to use execCommand for undo history support if possible
    const success = document.execCommand('insertText', false, text);

    // Fallback if execCommand fails (though it shouldn't for insertText)
    if (!success) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
    }
};
