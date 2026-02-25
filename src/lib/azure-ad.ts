import { Client } from '@microsoft/microsoft-graph-client'
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client'
import { ConfidentialClientApplication } from '@azure/msal-node'

class AzureAuthProvider implements AuthenticationProvider {
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

export function getGraphClient(): Client {
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
  const authProvider = new AzureAuthProvider(msalClient)
  
  graphClient = Client.initWithMiddleware({ authProvider })
  return graphClient
}

export async function inviteUserToAzureAD(email: string, redirectUrl?: string) {
  try {
    const graphClient = getGraphClient()
    
    const invitationData = {
      invitedUserDisplayName: email.split('@')[0],
      invitedUserEmailAddress: email,
      inviteRedirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      sendInvitationMessage: false, // Don't send Microsoft's email
    }

    const invitation = await graphClient
      .api('/invitations')
      .post(invitationData)

    return {
      success: true,
      invitationId: invitation.id,
      inviteRedeemUrl: invitation.inviteRedeemUrl,
      status: invitation.status,
    }
  } catch (error) {
    console.error('Error inviting user to Azure AD:', error)
    throw error
  }
}
