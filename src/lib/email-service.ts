import { Client } from '@microsoft/microsoft-graph-client'
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client'
import { ConfidentialClientApplication } from '@azure/msal-node'

interface InvitationEmailData {
  to: string
  inviterName: string
  organisationName: string
  inviteRedeemUrl: string
  expiresAt: string
}

class GraphAuthProvider implements AuthenticationProvider {
  private msalClient: ConfidentialClientApplication

  constructor(msalClient: ConfidentialClientApplication) {
    this.msalClient = msalClient
  }

  async getAccessToken(): Promise<string> {
    try {
      const tokenRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      }

      const response = await this.msalClient.acquireTokenByClientCredential(tokenRequest)
      
      if (!response) {
        throw new Error('Failed to acquire access token: No response received')
      }
      
      return response.accessToken
    } catch (error) {
      console.error('Error acquiring access token:', error)
      throw new Error('Failed to acquire access token for Microsoft Graph')
    }
  }
}

let graphClient: Client | null = null

function getGraphClient(): Client {
  if (graphClient) {
    return graphClient
  }

  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    },
  }

  const msalClient = new ConfidentialClientApplication(msalConfig)
  const authProvider = new GraphAuthProvider(msalClient)
  
  graphClient = Client.initWithMiddleware({ authProvider })
  return graphClient
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  try {
    const graphClient = getGraphClient()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join MechlinTech CRM</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #006AFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #006AFF;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .expiry {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MechlinTech CRM</div>
            <h1>You're Invited!</h1>
          </div>
          
          <p>Hello,</p>
          
          <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organisationName}</strong> on ClientSphere from Mechlin Technologies.</p>
          
          <p>Click the button below to accept the invitation and set up your account:</p>
          
          <div style="text-align: center;">
            <a href="${data.inviteRedeemUrl}" class="button" target="_blank" rel="noopener noreferrer">Accept Invitation</a>
          </div>
          
          <p>If you have any questions, please contact your administrator.</p>
          
          <p>Best regards,<br>The MechlinTech Team</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2026 MechlinTech. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailMessage = {
      message: {
        subject: `You're invited to join ${data.organisationName} on ClientSphere from Mechlin Technologies`,
        body: {
          contentType: 'html',
          content: htmlContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: data.to,
            },
          },
        ],
        from: {
          emailAddress: {
            address: process.env.FROM_EMAIL!,
            name: 'MechlinTech CRM',
          },
        },
      },
      saveToSentItems: false,
    }

    await graphClient.api('/users/' + process.env.FROM_EMAIL + '/sendMail').post(emailMessage)
    console.log('✅ Invitation email sent successfully via Graph API to:', data.to)
    return true

  } catch (error) {
    console.error('❌ Error sending invitation email via Graph API:', error)
    throw new Error('Failed to send invitation email via Graph API')
  }
}
