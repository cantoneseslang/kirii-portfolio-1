export const MILL_CERT_FILES = [
  {
    label: "0.8*1210-Z-120-S280GD+Z",
    pdfPath: "/pdfs/mill-cert/s280gd.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/s280gd.png",
    downloadName: "0.8x1210-Z-120-S280GD+Z.pdf",
  },
  {
    label: "0.8*1210-Z-120-S350GD+Z",
    pdfPath: "/pdfs/mill-cert/s350gd.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/s350gd.png",
    downloadName: "0.8x1210-Z-120-S350GD+Z.pdf",
  },
  {
    label: "0.4*97",
    pdfPath: "/pdfs/mill-cert/sx-0.4x97.pdf",
    thumbPath: "/pdfs/mill-cert/thumbs/sx-0.4x97.png",
    downloadName: "0.4x97.pdf",
  },
] as const

export type MillCertFile = (typeof MILL_CERT_FILES)[number]
