import { supabase } from "@/lib/supabase"
import { PDFDocument, rgb } from "pdf-lib"
import type { SignaturePos } from "@/types/pdfsign"

interface SignPdfArgs {
  pdfUrl: string
  documentId: string
  signatureImage: string
  signatureFileType: "png" | "jpg"
  signerName: string
  signerEmail: string
  signaturePlacements: SignaturePos[]
  pageSizes: { width: number; height: number }[]
}

export async function signPdf({
  pdfUrl, documentId, signatureImage, signatureFileType,
  signerName, signerEmail, signaturePlacements, pageSizes,
}: SignPdfArgs): Promise<void> {
  const pdfBytes = await fetch(pdfUrl).then(r => r.arrayBuffer())
  const pdfDoc = await PDFDocument.load(pdfBytes)

  const base64Data = signatureImage.split(",")[1]
  const binaryStr = atob(base64Data)
  const sigArray = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) sigArray[i] = binaryStr.charCodeAt(i)

  const sigEmbed = signatureFileType === "jpg"
    ? await pdfDoc.embedJpg(sigArray.buffer)
    : await pdfDoc.embedPng(sigArray.buffer)

  const pdfPages = pdfDoc.getPages()

  for (const placement of signaturePlacements) {
    const targetPage = pdfPages[placement.page - 1]
    const { width: pageW, height: pageH } = targetPage.getSize()
    const pageSize = pageSizes[placement.page - 1]
    if (!pageSize) continue
    const scaleX = pageW / pageSize.width
    const scaleY = pageH / pageSize.height
    targetPage.drawImage(sigEmbed, {
      x: placement.x * scaleX,
      y: pageH - (placement.y * scaleY) - (placement.height * scaleY),
      width: placement.width * scaleX,
      height: placement.height * scaleY,
    })
  }

  const lastP = signaturePlacements[signaturePlacements.length - 1]
  const lastPage = pdfPages[lastP.page - 1]
  const { width: lastPageW, height: lastPageH } = lastPage.getSize()
  const lastPageSize = pageSizes[lastP.page - 1]
  if (lastPageSize) {
    const scaleX = lastPageW / lastPageSize.width
    const scaleY = lastPageH / lastPageSize.height
    lastPage.drawText(`Signed by: ${signerName}`, {
      x: lastP.x * scaleX,
      y: lastPageH - (lastP.y * scaleY) - (lastP.height * scaleY) - 12,
      size: 8, color: rgb(0, 0, 0),
    })
    lastPage.drawText(`${signerEmail} — ${new Date().toLocaleDateString()}`, {
      x: lastP.x * scaleX,
      y: lastPageH - (lastP.y * scaleY) - (lastP.height * scaleY) - 22,
      size: 7, color: rgb(0.4, 0.4, 0.4),
    })
  }

  const modifiedBytes = await pdfDoc.save()
  const modifiedBlob = new Blob([modifiedBytes.buffer as ArrayBuffer], { type: "application/pdf" })
  const signedFileName = `signed-documents/${documentId}-signed-${Date.now()}.pdf`

  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(signedFileName, modifiedBlob, { contentType: "application/pdf", upsert: false })
  if (uploadErr) throw uploadErr

  const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(signedFileName)

  const sigFileName = `signatures/${documentId}-${Date.now()}.png`
  const { error: sigUploadErr } = await supabase.storage
    .from("signatures")
    .upload(sigFileName, new Blob([sigArray], { type: "image/png" }), { contentType: "image/png", upsert: false })
  if (sigUploadErr) throw sigUploadErr

  const { data: { publicUrl: sigPublicUrl } } = supabase.storage.from("signatures").getPublicUrl(sigFileName)

  const { error: updateErr } = await supabase.from("documents").update({
    signature_url: sigPublicUrl,
    signed_at: new Date().toISOString(),
    signer_name: signerName.trim(),
    signer_email: signerEmail.trim(),
    signature_status: "signed",
    file_url: publicUrl,
    signature_position_x: lastP.x,
    signature_position_y: lastP.y,
  }).eq("id", documentId)
  if (updateErr) throw updateErr
}