
/**
 * Returns the {top, left, height} coordinates of the caret in a text area/input,
 * relative to the element.
 */
export function getCaretCoordinates(element: HTMLTextAreaElement | HTMLInputElement, position: number) {
    const {
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        borderLeftWidth,
        borderRightWidth,
        borderTopWidth,
        borderBottomWidth,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        lineHeight,
        whiteSpace,
        wordWrap,
        boxSizing,
    } = window.getComputedStyle(element);

    // specific styles of the element
    const style = {
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        lineHeight,
        whiteSpace,
        wordWrap,
        boxSizing,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        borderLeftWidth,
        borderRightWidth,
        borderTopWidth,
        borderBottomWidth,
    } as const;

    const div = document.createElement('div');
    const copyStyle = (prop: keyof typeof style) => {
        div.style[prop] = style[prop];
    };

    // Replicate styles
    (Object.keys(style) as Array<keyof typeof style>).forEach(copyStyle);

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';  // matches default textarea behavior
    div.style.overflow = 'hidden';      // preventing scrollbars on the div

    // Dimensions
    div.style.width = element.clientWidth + 'px'; // width without scrollbar
    // If box-sizing is border-box, we might need to adjust, but usually clientWidth is inner.

    // Content
    const textContent = element.value;
    const textBefore = textContent.substring(0, position);
    const textSpan = document.createElement('span');
    textSpan.textContent = textBefore;
    div.appendChild(textSpan);

    const span = document.createElement('span');
    span.textContent = textContent.substring(position) || '.'; // Ensure height even if end of line
    div.appendChild(span);

    document.body.appendChild(div);

    const spanOffset = textSpan.nextSibling as HTMLSpanElement; // The 'span' after our text
    // Actually we need the end of textSpan.
    // Better approach: Insert a special span at caret pos.

    div.innerHTML = '';
    div.append(document.createTextNode(textBefore));
    const caretSpan = document.createElement('span');
    caretSpan.textContent = '|';
    div.append(caretSpan);

    const { offsetLeft: left, offsetTop: top, offsetHeight: height } = caretSpan;

    document.body.removeChild(div);

    return { top, left, height };
}
