import type { WheelEvent } from 'react';

export function handoffNestedScroll(event: WheelEvent<HTMLElement>) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  const node = event.currentTarget;
  const atTop = node.scrollTop <= 0;
  const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
  if (!(event.deltaY < 0 ? atTop : atBottom)) return;

  let parent = node.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const scrollable = /(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 1;
    const canMove = event.deltaY < 0
      ? parent.scrollTop > 0
      : parent.scrollTop + parent.clientHeight < parent.scrollHeight - 1;
    if (scrollable && canMove) {
      event.preventDefault();
      parent.scrollTop += event.deltaY;
      return;
    }
    parent = parent.parentElement;
  }

  const root = document.scrollingElement;
  if (!root) return;
  const canMove = event.deltaY < 0
    ? root.scrollTop > 0
    : root.scrollTop + root.clientHeight < root.scrollHeight - 1;
  if (canMove) {
    event.preventDefault();
    root.scrollTop += event.deltaY;
  }
}
