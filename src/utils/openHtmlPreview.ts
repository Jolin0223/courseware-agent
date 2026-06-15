export function openHtmlPreview(html: string | undefined, title = '互动课件') {
  if (!html) return;
  const iframeSrc = html.match(/<iframe[^>]+src="([^"]+)"/i)?.[1];
  if (iframeSrc) {
    const win = window.open(iframeSrc, '_blank', 'width=1200,height=800');
    if (win) {
      win.document.title = title;
      win.focus();
    }
    return;
  }
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  win.focus();
}
