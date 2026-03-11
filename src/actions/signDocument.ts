"use server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function signAndUploadAction(
  projectId: string, documentId: string, signatureImageBase64: string, 
  placements: any[], userId: string, userName: string
) {
  try {
    const { data: doc } = await supabaseAdmin.from("documents").select("*").eq("id", documentId).single();
    if (!doc) throw new Error("Document not found.");

    const response = await fetch(doc.file_url);
    const pdfDoc = await PDFDocument.load(await response.arrayBuffer());
    const pages = pdfDoc.getPages();

    const isPng = signatureImageBase64.startsWith("data:image/png");
    const base64Data = signatureImageBase64.split(",")[1];
    const imageBytes = Buffer.from(base64Data, "base64");
    const signatureImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

    const scaler = 0.08; // Small/Professional size

// Inside the placements loop in signAndUploadAction
for (const p of placements) {
  const targetPage = pages[p.pageIndex];
  if (!targetPage) continue;

  const { width, height } = targetPage.getSize();
  
  // 1. Calculate UI-equivalent width in PDF units
  const userScale = p.scale || 1;
  const sigWidth = 100 * userScale; 
  
  // 2. Get true aspect ratio from the embedded image
  const { width: imgW, height: imgH } = signatureImage.size();
  const aspectRatio = imgH / imgW;
  const sigHeight = sigWidth * aspectRatio;

  // 3. Mapping UI center-origin (0-1) to PDF bottom-left origin
  // UI: p.x = 0.5 is middle. sigWidth/2 shifts it so it's centered.
  let drawX = (p.x * width) - (sigWidth / 2);
  let drawY = ((1 - p.y) * height) - (sigHeight / 2);

  // 4. Final safety check: Clamp PDF coordinates to page edges
  drawX = Math.max(0, Math.min(drawX, width - sigWidth));
  drawY = Math.max(0, Math.min(drawY, height - sigHeight));

  targetPage.drawImage(signatureImage, {
    x: drawX,
    y: drawY,
    width: sigWidth,
    height: sigHeight,
  });
}
    const signedPdfBytes = await pdfDoc.save();
    const cleanOldName = doc.name.replace(".pdf", "");
    const cleanUserName = userName.replace(/\s+/g, '_');
    const newFileName = `${cleanOldName}_signed_by_${cleanUserName}.pdf`;
    const storagePath = `${projectId}/${Date.now()}_${newFileName}`;

    await supabaseAdmin.storage.from("documents").upload(storagePath, signedPdfBytes, { contentType: "application/pdf" });
    const { data: { publicUrl } } = supabaseAdmin.storage.from("documents").getPublicUrl(storagePath);

    await supabaseAdmin.from("documents").insert({
      project_id: projectId, phase_id: doc.phase_id, milestone_id: doc.milestone_id, sprint_id: doc.sprint_id,
      name: newFileName, file_url: publicUrl, uploaded_by: userId, status: "Approved",
      signature_status: 'signed', signed_at: new Date().toISOString(), signer_name: userName
    });

    revalidatePath(`/projects/${projectId}/documents`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}