import { getGraphClient } from "./email-service"

interface SignatureRequestData {
  to: string
  signerName: string
  requesterName: string
  documentName: string
  projectId: string
}

export async function sendSignatureRequestEmail(data: SignatureRequestData): Promise<boolean> {
  try {
    const graphClient = getGraphClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signUrl = `${appUrl}/projects/${data.projectId}/documents?tab=assigned`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <table align="center" cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 2px;">
            <table align="center" cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 2px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px; line-height: 0;">
                      <img 
                        src="https://devcrm.mechlintech.com/logo.png" 
                        alt="ClientSphere Logo" 
                        height="40" 
                        style="display:block;"
                      />
                    </td>
                    <td style="vertical-align: middle; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">
                      <span style="color:#666;">Client</span><span style="color:#006AFF;">Sphere</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 13px; color: #666; padding-bottom: 20px;">
                by Mechlin Technologies
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #f0f0f0; padding-top: 30px;">
            <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${data.signerName}</strong>,</p>
            
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
              <strong>${data.requesterName}</strong> has requested your official signature on the document below. This is required to proceed with the current project milestone.
            </p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; margin: 30px 0; text-align: center;">
              <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; font-weight: 800; letter-spacing: 1px;">Document for Review</div>
              <div style="font-size: 18px; font-weight: 700; color: #111827;">${data.documentName}</div>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${signUrl}" style="background-color: #006AFF; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 15px;">
                Review & Sign Document
              </a>
            </div>

            <div style="background: #fff9db; border-left: 4px solid #fab005; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
              <p style="font-size: 13px; color: #856404; margin: 0; line-height: 1.5;">
                <strong>Next Step:</strong> Once you click the button, you will be taken to the <b>Assigned</b> tab in your document vault to complete the process.
              </p>
            </div>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 35px 0;" />
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
              If you did not expect this request, please contact the project manager.
            </p>
            <p style="font-size: 11px; color: #d1d5db;">
              © 2026 Mechlin Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailMessage = {
      message: {
        subject: `Signature Requested: ${data.documentName}`,
        body: { contentType: 'html', content: htmlContent },
        toRecipients: [{ emailAddress: { address: data.to } }],
        from: { emailAddress: { address: process.env.FROM_EMAIL!, name: 'ClientSphere' } },
      },
      saveToSentItems: false,
    }

    await graphClient.api('/users/' + process.env.FROM_EMAIL + '/sendMail').post(emailMessage)
    return true
  } catch (error) {
    console.error('❌ Error sending signature email:', error)
    return false
  }
}