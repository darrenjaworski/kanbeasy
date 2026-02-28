export function updateFavicon(bg: string, accent: string): void {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${bg}"/>
  <rect x="80" y="96" width="96" height="320" rx="16" fill="${accent}"/>
  <rect x="208" y="96" width="96" height="208" rx="16" fill="${accent}" opacity="0.7"/>
  <rect x="336" y="96" width="96" height="272" rx="16" fill="${accent}" opacity="0.4"/>
</svg>`;

  const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = encoded;
}
