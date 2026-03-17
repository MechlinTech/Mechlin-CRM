"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Upload, X, Check, AlertCircle, ChevronLeft, ChevronRight, Move, FileText, User, Mail, PenLine, Plus, Trash2 } from "lucide-react"
import type { PDFSignerModalProps, SignaturePos, RenderedPage } from "@/types/pdfsign"
import { signPdf } from "@/actions/signPdf"

let pdfjsLib: typeof import("pdfjs-dist") | null = null
async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib
  const lib = await import("pdfjs-dist")
  // @ts-ignore
  const worker = await import("pdfjs-dist/build/pdf.worker.min.js")
  lib.GlobalWorkerOptions.workerSrc = worker.default
  pdfjsLib = lib
  return lib
}

function Step({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
        done ? 'bg-blue-600 text-white' : active ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-1' : 'bg-slate-100 text-slate-400'
      }`}>
        {done ? <Check className="h-3 w-3" /> : n}
      </div>
      <span className={`text-xs font-medium ${done ? 'text-blue-600' : active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

export default function PDFSignerModal({
  isOpen, onClose, documentId, documentName, pdfUrl, onSignComplete
}: PDFSignerModalProps) {

  const [isSigning, setIsSigning] = useState(false)
  const [signatureImage, setSignatureImage] = useState("")
  const [signatureFileType, setSignatureFileType] = useState<"png" | "jpg">("png")
  const [signerName, setSignerName] = useState("")
  const [signerEmail, setSignerEmail] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pageInputValue, setPageInputValue] = useState("1")
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([])
  const [pdfLoading, setPdfLoading] = useState(true)
  const [renderProgress, setRenderProgress] = useState(0)

  const [signaturePlacements, setSignaturePlacements] = useState<SignaturePos[]>([])
  const [activePlacementId, setActivePlacementId] = useState<string | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const resizeStart = useRef<{ mouseX: number; startW: number; startH: number }>({ mouseX: 0, startW: 0, startH: 0 })
  const aspectRatio = useRef(150 / 60)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const pdfDocRef = useRef<any>(null)
  const containerMeasureRef = useRef<HTMLDivElement>(null)

  const MAX_SIG_W = 200
  const step1Done = !!signatureImage
  const step2Done = !!signerName.trim() && !!signerEmail.trim()
  const step3Done = signaturePlacements.length > 0
  const allDone = step1Done && step2Done && step3Done

  const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  const renderAllPages = useCallback(async (pdf: any) => {
    const containerWidth = containerMeasureRef.current?.clientWidth || 700
    const qualityScale = Math.min(3, Math.max(1.5, window.devicePixelRatio || 2))
    const pages: RenderedPage[] = []
    const sizes: { width: number; height: number }[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      const scale = (containerWidth / viewport.width) * qualityScale
      const scaledViewport = page.getViewport({ scale })
      const offscreen = document.createElement('canvas')
      offscreen.width = scaledViewport.width
      offscreen.height = scaledViewport.height
      const ctx = offscreen.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
      pages.push({ pageNum: i, dataUrl: offscreen.toDataURL('image/png'), width: containerWidth, height: containerWidth / viewport.width * viewport.height })
      sizes.push({ width: containerWidth, height: containerWidth / viewport.width * viewport.height })
      setRenderProgress(Math.round((i / pdf.numPages) * 100))
      await yieldToBrowser()
    }

    setRenderedPages(pages)
    setPageSizes(sizes)
  }, [])

  useEffect(() => {
    if (!isOpen || !pdfUrl) return
    let cancelled = false
    setRenderedPages([])
    setRenderProgress(0)
    ;(async () => {
      setPdfLoading(true)
      try {
        const pdfjs = await getPdfjs()
        const pdf = await pdfjs.getDocument(pdfUrl).promise
        if (cancelled) return
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        setPageInputValue("1")
        await renderAllPages(pdf)
      } catch (err) {
        console.error("Failed to load PDF:", err)
        toast.error("Failed to load PDF preview")
      } finally {
        if (!cancelled) setPdfLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, pdfUrl, renderAllPages])

  useEffect(() => {
    if (renderedPages.length === 0) return
    const observers: IntersectionObserver[] = []
    pageRefs.current.forEach((el, idx) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setCurrentPage(idx + 1); setPageInputValue(String(idx + 1)) } },
        { root: scrollContainerRef.current, threshold: 0.4 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [renderedPages])

  const scrollToPage = useCallback((pageNum: number) => {
    pageRefs.current[pageNum - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const val = parseInt(pageInputValue)
    if (!isNaN(val) && val >= 1 && val <= totalPages) scrollToPage(val)
    else setPageInputValue(String(currentPage))
  }

  const handlePageInputBlur = () => {
    const val = parseInt(pageInputValue)
    if (!isNaN(val) && val >= 1 && val <= totalPages) scrollToPage(val)
    else setPageInputValue(String(currentPage))
  }

  const handlePageImageClick = (e: React.MouseEvent<HTMLImageElement>, pageNum: number, cssW: number, cssH: number) => {
    if (!isPlacing || !signatureImage) return
    const rect = (e.target as HTMLImageElement).getBoundingClientRect()
    const defaultW = Math.round(Math.min(MAX_SIG_W, cssW * 0.25))
    const defaultH = Math.round(defaultW / aspectRatio.current)
    let x = Math.max(0, Math.min(e.clientX - rect.left - defaultW / 2, cssW - defaultW))
    let y = Math.max(0, Math.min(e.clientY - rect.top - defaultH / 2, cssH - defaultH))
    const newPlacement: SignaturePos = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x, y, page: pageNum, width: defaultW, height: defaultH,
    }
    setSignaturePlacements(prev => [...prev, newPlacement])
    setActivePlacementId(newPlacement.id)
    setIsPlacing(false)
    toast.success(`Signature ${signaturePlacements.length + 1} placed on page ${pageNum}`)
  }

  const removePlacement = (id: string) => {
    setSignaturePlacements(prev => prev.filter(p => p.id !== id))
    if (activePlacementId === id) setActivePlacementId(null)
  }

  const handleSigMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const p = signaturePlacements.find(p => p.id === id)
    if (!p) return
    setActivePlacementId(id)
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - p.x, y: e.clientY - p.y }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault()
    const p = signaturePlacements.find(p => p.id === id)
    if (!p) return
    setActivePlacementId(id)
    setIsResizing(true)
    resizeStart.current = { mouseX: e.clientX, startW: p.width, startH: p.height }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!activePlacementId) return
    const p = signaturePlacements.find(p => p.id === activePlacementId)
    if (!p) return
    const pageSize = pageSizes[p.page - 1]
    if (!pageSize) return
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.current.mouseX
      let newW = Math.max(40, Math.min(resizeStart.current.startW + deltaX, pageSize.width - p.x))
      let newH = newW / aspectRatio.current
      if (newH > pageSize.height - p.y) { newH = pageSize.height - p.y; newW = newH * aspectRatio.current }
      setSignaturePlacements(prev => prev.map(pl => pl.id === activePlacementId ? { ...pl, width: Math.round(newW), height: Math.round(newH) } : pl))
      return
    }
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, pageSize.width - p.width))
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, pageSize.height - p.height))
      setSignaturePlacements(prev => prev.map(pl => pl.id === activePlacementId ? { ...pl, x: newX, y: newY } : pl))
    }
  }, [isDragging, isResizing, activePlacementId, signaturePlacements, pageSizes])

  const handleMouseUp = useCallback(() => { setIsDragging(false); setIsResizing(false) }, [])

  const processFile = (file: File) => {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) return toast.error("Only PNG or JPG allowed")
    if (file.size > 5 * 1024 * 1024) return toast.error("Signature image is too large. Please upload a PNG image smaller than 5 MB")
    setSignatureFileType(file.type === "image/jpeg" || file.type === "image/jpg" ? "jpg" : "png")
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setSignatureImage(dataUrl)
      const img = new Image()
      img.onload = () => { aspectRatio.current = img.naturalWidth / img.naturalHeight }
      img.src = dataUrl
      toast.success("Signature loaded!")
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f) }
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover") }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f?.type.startsWith("image/")) processFile(f)
    else toast.error("Drop an image file")
  }

 const handleSign = async () => {
  if (!signatureImage) return toast.error("Upload a signature first")
  if (!signerName.trim() || !signerEmail.trim()) return toast.error("Enter your name and email")
  if (signaturePlacements.length === 0) return toast.error("Place at least one signature on the document")
  
  setIsSigning(true)
  try {
    await signPdf({ pdfUrl, documentId, signatureImage, signatureFileType, signerName, signerEmail, signaturePlacements, pageSizes })
    toast.success(`Document signed successfully!`)
    onSignComplete()
    onClose()
  } catch (err: any) {
    // This will now show our custom "The uploaded file is not a valid PNG..." message
    toast.error(`Signing failed: ${err || 'Unknown error'}`);
    console.error("Signing error:", err);
  } finally {
    setIsSigning(false)
  }
}

  const handleClose = () => {
    if (isSigning) return
    setSignatureImage(""); setSignerName(""); setSignerEmail("")
    setSignaturePlacements([]); setActivePlacementId(null)
    setIsPlacing(false); setCurrentPage(1)
    setPageInputValue("1"); setRenderedPages([])
    pdfDocRef.current = null; onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 shadow-2xl"
        style={{ width: '80vw', maxWidth: '80vw', height: '92vh', maxHeight: '92vh' }}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <PenLine className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-slate-900 leading-tight">Sign Document</DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400 leading-tight truncate max-w-[400px]">{documentName}</DialogDescription>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Step n={1} label="Signature" done={step1Done} active={!step1Done} />
            <div className="w-8 h-px bg-slate-200" />
            <Step n={2} label="Details" done={step2Done} active={step1Done && !step2Done} />
            <div className="w-8 h-px bg-slate-200" />
            <Step n={3} label="Place" done={step3Done} active={step2Done && !step3Done} />
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-slate-500 cursor-pointer" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(92vh - 57px)' }}>

          {/* PDF column */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 border-r border-slate-200">
            <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Document Preview</span>
                {totalPages > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <button onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                      className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      <ChevronLeft className="h-3 w-3 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-1">
                      <input type="number" min={1} max={totalPages} value={pageInputValue}
                        onChange={e => setPageInputValue(e.target.value)}
                        onKeyDown={handlePageInputKeyDown} onBlur={handlePageInputBlur}
                        className="w-10 h-6 text-center text-[11px] font-semibold text-slate-700 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[11px] text-slate-400">/ {totalPages}</span>
                    </div>
                    <button onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                      className="w-6 h-6 rounded border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
              {signatureImage && (
                <button
                  onClick={() => { setIsPlacing(!isPlacing); if (!isPlacing) toast.info("Click anywhere on the PDF to place a signature") }}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isPlacing ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPlacing ? <Move className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {isPlacing ? 'Click to Place…' : 'Add Signature'}
                </button>
              )}
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ scrollBehavior: 'smooth' }}
              onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <div ref={containerMeasureRef} className="w-full" style={{ height: 0, visibility: 'hidden' }} />

              {pdfLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block">
                      {renderProgress > 0 ? `Rendering pages… ${renderProgress}%` : 'Loading PDF…'}
                    </span>
                    {renderProgress > 0 && (
                      <div className="w-32 h-1 bg-slate-200 rounded-full mt-2 mx-auto overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${renderProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!pdfLoading && renderedPages.map((pg, idx) => (
                <div key={pg.pageNum} ref={el => { pageRefs.current[idx] = el }}
                  className="relative mb-3 mx-auto shadow-md"
                  style={{ width: pg.width, height: pg.height }}>
                  <div className="absolute -top-5 left-0 text-[10px] text-slate-400 font-medium">Page {pg.pageNum}</div>
                  <img src={pg.dataUrl} alt={`Page ${pg.pageNum}`} draggable={false}
                    onClick={e => handlePageImageClick(e, pg.pageNum, pg.width, pg.height)}
                    className={`w-full h-full block select-none ${isPlacing ? 'cursor-crosshair ring-2 ring-inset ring-emerald-400' : 'cursor-default'}`}
                  />
                  {signaturePlacements.filter(p => p.page === pg.pageNum).map(p => (
                    <div key={p.id} onMouseDown={e => handleSigMouseDown(e, p.id)}
                      className={`absolute rounded-lg cursor-grab active:cursor-grabbing shadow-lg ${
                        activePlacementId === p.id ? 'border-2 border-dashed border-blue-500 bg-blue-50/40' : 'border-2 border-dashed border-blue-300 bg-blue-50/20'
                      }`}
                      style={{ left: p.x, top: p.y, width: p.width, height: p.height }}
                    >
                      <img src={signatureImage} alt="sig" className="w-full h-full object-contain pointer-events-none p-1" draggable={false} />
                      <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                        #{signaturePlacements.findIndex(x => x.id === p.id) + 1}
                      </div>
                      <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); removePlacement(p.id) }}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 border border-white rounded-full flex items-center justify-center z-20 transition-colors">
                        <X className="h-2.5 w-2.5 text-white cursor-pointer" />
                      </button>
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-blue-500 rounded-tl pointer-events-none" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-blue-500 rounded-tr pointer-events-none" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-blue-500 rounded-bl pointer-events-none" />
                      <div onMouseDown={e => handleResizeMouseDown(e, p.id)}
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:bg-blue-700 transition-colors z-10" />
                    </div>
                  ))}
                </div>
              ))}
              {!pdfLoading && <div className="h-8" />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-[300px] flex-none flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col gap-0 divide-y divide-slate-100 custom-scrollbar">

              {/* Step 1: Signature */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step1Done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {step1Done ? <Check className="h-2.5 w-2.5" /> : '1'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Signature</span>
                </div>
                {!signatureImage ? (
                  <label htmlFor="sig-upload"
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                      dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  >
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" id="sig-upload" />
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                      <Upload className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-600">Drop signature image</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PNG or JPG, max 5MB</p>
                    </div>
                    <span className="text-[11px] text-blue-600 font-semibold">Browse files</span>
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center" style={{ minHeight: 64 }}>
                      <img src={signatureImage} alt="Signature preview" className="max-h-12 object-contain" />
                    </div>
                    <button onClick={() => { setSignatureImage(""); setSignaturePlacements([]); setActivePlacementId(null) }}
                      className="cursor-pointer w-full text-[11px] text-red-500 hover:text-red-600 font-medium py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Remove & re-upload
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Details */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step2Done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {step2Done ? <Check className="h-2.5 w-2.5" /> : '2'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Your Details</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                      <User className="h-3 w-3" /> Full Name <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="John Doe"
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder-slate-300 transition-all" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                      <Mail className="h-3 w-3" /> Email <span className="text-red-400">*</span>
                    </label>
                    <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} placeholder="john@example.com"
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder-slate-300 transition-all" />
                  </div>
                </div>
              </div>

              {/* Step 3: Placements */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step3Done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {step3Done ? <Check className="h-2.5 w-2.5" /> : '3'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Placements</span>
                  </div>
                  {signaturePlacements.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      {signaturePlacements.length} placed
                    </span>
                  )}
                </div>
                {signaturePlacements.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <Move className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    <p className="text-[11px] text-slate-400">
                      {signatureImage ? 'Click "Add Signature" above the PDF' : 'Upload a signature first'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {signaturePlacements.map((p, idx) => (
                      <div key={p.id} onClick={() => { setActivePlacementId(p.id); scrollToPage(p.page) }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          activePlacementId === p.id ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/50'
                        }`}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-600 text-white rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                          <span className="text-[11px] font-medium text-slate-600">Page {p.page}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removePlacement(p.id) }}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {signatureImage && (
                      <button onClick={() => { setIsPlacing(true); toast.info("Click on the PDF to add another signature") }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-blue-200 text-blue-500 text-[11px] font-semibold rounded-lg hover:bg-blue-50 transition-colors mt-1">
                        <Plus className="h-3 w-3" /> Add another
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Legal */}
              <div className="p-5">
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    By signing, you confirm this is a legally binding electronic signature in accordance with applicable laws.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex-none p-4 border-t border-slate-100 bg-white space-y-2">
              <button onClick={handleSign} disabled={isSigning || !allDone}
                className={`cursor-pointer  w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  allDone && !isSigning ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                {isSigning
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing document…</>
                  : <><Check className="h-3.5 w-3.5 " />Sign Document {signaturePlacements.length > 1 ? `(${signaturePlacements.length} signatures)` : ''}</>
                }
              </button>
              <button onClick={handleClose} disabled={isSigning}
                className="w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}