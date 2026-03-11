export interface PDFSignerModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentName: string
  pdfUrl: string
  onSignComplete: () => void
}

export interface SignaturePos {
  id: string
  x: number
  y: number
  page: number
  width: number
  height: number
}

export interface RenderedPage {
  pageNum: number
  dataUrl: string
  width: number
  height: number
}