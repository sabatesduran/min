// Browser fallbacks: expo-file-system, expo-sharing and expo-print's HTML mode are native-only.

export function downloadTextFile(name: string, content: string, mimeType: string): string {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return name;
}

export function printHtml(html: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
}

export async function readTextFile(uri: string, maxBytes: number): Promise<string | 'too-large'> {
  const blob = await (await fetch(uri)).blob();
  if (blob.size > maxBytes) return 'too-large';
  return blob.text();
}
