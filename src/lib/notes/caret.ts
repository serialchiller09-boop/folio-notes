export function splitEditableAtCaret(el: HTMLElement): { beforeHtml: string; afterHtml: string } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return null;

  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);

  const post = document.createRange();
  post.selectNodeContents(el);
  post.setStart(range.endContainer, range.endOffset);

  const before = document.createElement("div");
  before.appendChild(pre.cloneContents());
  const after = document.createElement("div");
  after.appendChild(post.cloneContents());
  return { beforeHtml: before.innerHTML, afterHtml: after.innerHTML };
}

export function focusEditable(blockId: string) {
  window.requestAnimationFrame(() => {
    const node = document
      .getElementById(`block-${blockId}`)
      ?.querySelector<HTMLElement>("[contenteditable]");
    if (!node) return;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
}
