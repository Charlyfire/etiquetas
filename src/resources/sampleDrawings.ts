export interface DrawingCategory {
  name: string;
  items: { id: string; name: string; category: string; svgDataUrl: string }[];
}

// Generate inline SVG Data URLs for reliable offline rendering
function makeSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const SAMPLE_DRAWING_CATEGORIES: DrawingCategory[] = [
  {
    name: 'Animales',
    items: [
      {
        id: 'img-bear',
        name: 'Oso',
        category: 'Animales',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="15" fill="#b45309"/>
            <circle cx="75" cy="25" r="15" fill="#b45309"/>
            <circle cx="25" cy="25" r="8" fill="#fef3c7"/>
            <circle cx="75" cy="25" r="8" fill="#fef3c7"/>
            <circle cx="50" cy="55" r="35" fill="#d97706"/>
            <ellipse cx="50" cy="65" rx="18" ry="14" fill="#fef3c7"/>
            <circle cx="38" cy="48" r="4" fill="#1e293b"/>
            <circle cx="62" cy="48" r="4" fill="#1e293b"/>
            <ellipse cx="50" cy="60" rx="7" ry="5" fill="#1e293b"/>
          </svg>
        `),
      },
      {
        id: 'img-lion',
        name: 'León',
        category: 'Animales',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#ea580c"/>
            <circle cx="50" cy="50" r="30" fill="#facc15"/>
            <circle cx="38" cy="45" r="4" fill="#1e293b"/>
            <circle cx="62" cy="45" r="4" fill="#1e293b"/>
            <polygon points="50,53 44,60 56,60" fill="#ea580c"/>
          </svg>
        `),
      },
      {
        id: 'img-cat',
        name: 'Gato',
        category: 'Animales',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="15,10 35,40 10,45" fill="#ec4899"/>
            <polygon points="85,10 65,40 90,45" fill="#ec4899"/>
            <circle cx="50" cy="55" r="35" fill="#f472b6"/>
            <ellipse cx="38" cy="50" rx="5" ry="7" fill="#1e293b"/>
            <ellipse cx="62" cy="50" rx="5" ry="7" fill="#1e293b"/>
            <polygon points="50,60 45,66 55,66" fill="#be185d"/>
          </svg>
        `),
      },
      {
        id: 'img-owl',
        name: 'Búho',
        category: 'Animales',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <ellipse cx="50" cy="55" rx="35" ry="40" fill="#a855f7"/>
            <circle cx="35" cy="45" r="14" fill="#ffffff"/>
            <circle cx="65" cy="45" r="14" fill="#ffffff"/>
            <circle cx="35" cy="45" r="6" fill="#1e293b"/>
            <circle cx="65" cy="45" r="6" fill="#1e293b"/>
            <polygon points="50,55 43,65 57,65" fill="#f59e0b"/>
          </svg>
        `),
      },
      {
        id: 'img-fox',
        name: 'Zorro',
        category: 'Animales',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="10,15 30,50 5,60" fill="#f97316"/>
            <polygon points="90,15 70,50 95,60" fill="#f97316"/>
            <polygon points="50,90 15,45 85,45" fill="#f97316"/>
            <polygon points="50,90 30,60 70,60" fill="#ffffff"/>
            <circle cx="35" cy="52" r="4" fill="#1e293b"/>
            <circle cx="65" cy="52" r="4" fill="#1e293b"/>
            <circle cx="50" cy="85" r="5" fill="#1e293b"/>
          </svg>
        `),
      },
    ],
  },
  {
    name: 'Colegio',
    items: [
      {
        id: 'img-pencil',
        name: 'Lápiz',
        category: 'Colegio',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="35" y="10" width="30" height="55" fill="#f59e0b"/>
            <polygon points="35,65 65,65 50,90" fill="#fde047"/>
            <polygon points="45,80 55,80 50,90" fill="#1e293b"/>
            <rect x="35" y="10" width="30" height="12" fill="#f43f5e"/>
            <rect x="35" y="22" width="30" height="5" fill="#94a3b8"/>
          </svg>
        `),
      },
      {
        id: 'img-book',
        name: 'Libro',
        category: 'Colegio',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M10,25 Q50,15 90,25 L90,80 Q50,70 10,80 Z" fill="#3b82f6"/>
            <path d="M50,20 L50,75" stroke="#ffffff" stroke-width="4"/>
          </svg>
        `),
      },
      {
        id: 'img-backpack',
        name: 'Mochila',
        category: 'Colegio',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="20" y="25" width="60" height="60" rx="15" fill="#10b981"/>
            <rect x="30" y="45" width="40" height="30" rx="8" fill="#047857"/>
            <path d="M35,25 C35,10 65,10 65,25" fill="none" stroke="#047857" stroke-width="6"/>
          </svg>
        `),
      },
      {
        id: 'img-apple',
        name: 'Manzana',
        category: 'Colegio',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M50,30 C30,10 10,35 25,65 C35,85 50,90 50,90 C50,90 65,85 75,65 C90,35 70,10 50,30 Z" fill="#ef4444"/>
            <path d="M50,30 Q55,15 65,12" stroke="#78350f" stroke-width="4" fill="none"/>
            <ellipse cx="62" cy="18" rx="8" ry="4" fill="#22c55e" transform="rotate(-30 62 18)"/>
          </svg>
        `),
      },
    ],
  },
  {
    name: 'Formas',
    items: [
      {
        id: 'img-star',
        name: 'Estrella',
        category: 'Formas',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <polygon points="50,5 63,35 95,38 71,60 78,92 50,75 22,92 29,60 5,38 37,35" fill="#eab308"/>
          </svg>
        `),
      },
      {
        id: 'img-heart',
        name: 'Corazón',
        category: 'Formas',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M50,88 C20,60 5,40 18,20 C30,5 45,15 50,28 C55,15 70,5 82,20 C95,40 80,60 50,88 Z" fill="#ec4899"/>
          </svg>
        `),
      },
      {
        id: 'img-sun',
        name: 'Sol',
        category: 'Formas',
        svgDataUrl: makeSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="25" fill="#f59e0b"/>
            <path d="M50,10 L50,0 M50,90 L50,100 M10,50 L0,50 M90,50 L100,50 M22,22 L14,14 M78,78 L86,86 M22,78 L14,86 M78,22 L86,14" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
          </svg>
        `),
      },
    ],
  },
];
