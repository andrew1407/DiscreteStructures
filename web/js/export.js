// Turns the on-screen graph into a PNG: the SVG is cloned with its computed
// styles inlined (the page's CSS variables don't travel with it), drawn on a
// canvas under the step title, and returned as a Blob.

const PROPS = [
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linejoin', 'opacity',
  'font-size', 'font-weight', 'font-family', 'text-anchor', 'paint-order', 'dominant-baseline',
];

function inlineStyles(src, dst) {
  const cs = getComputedStyle(src);
  dst.setAttribute('style', PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
  for (let i = 0; i < src.children.length; i++) inlineStyles(src.children[i], dst.children[i]);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not render the graph image'));
    img.src = url;
  });
}

export async function graphToPng(svg, { title = '', subtitle = '', size = 1400 } = {}) {
  const clone = svg.cloneNode(true);
  inlineStyles(svg, clone);
  clone.querySelectorAll('title').forEach((t) => t.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', size);
  clone.setAttribute('height', size);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));

  try {
    const img = await loadImage(url);
    const page = getComputedStyle(document.documentElement);
    const bg = page.getPropertyValue('--surface').trim() || '#fff';
    const text = page.getPropertyValue('--text').trim() || '#000';
    const muted = page.getPropertyValue('--muted').trim() || '#666';
    const font = getComputedStyle(document.body).fontFamily;

    const pad = 48, head = title ? 120 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + head;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (title) {
      ctx.fillStyle = text;
      ctx.font = `700 40px ${font}`;
      ctx.fillText(title, pad, 64, size - 2 * pad);
      ctx.fillStyle = muted;
      ctx.font = `400 28px ${font}`;
      ctx.fillText(subtitle, pad, 104, size - 2 * pad);
    }
    ctx.drawImage(img, 0, head, size, size);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
