/**
 * WATI WhatsApp Service - Client-Side API Wrapper
 * File Path: src/services/watiService.ts
 * 
 * This service handles WATI WhatsApp functionality from the client-side
 * by making calls to our secure server-side API routes.
 * 
 * All WATI API credentials and direct API calls are handled server-side
 * to keep sensitive information secure and prevent CORS issues.
 */

// Client-side service that calls our server-side API routes
// No direct access to WATI environment variables needed here

/**
 * Sends a text message to a WhatsApp number via our server-side WATI API
 * 
 * @param whatsappNumber - The recipient's WhatsApp number (include country code)
 * @param messageText - The text content of the message
 * @returns Promise<any>
 */
export async function sendTextMessage(
  whatsappNumber: string,
  messageText: string
): Promise<any> {
  try {
    console.log(`[WATI Service] Sending text message to ${whatsappNumber}`);

    const response = await fetch('/api/wati/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsappNumber: whatsappNumber,
        messageText: messageText
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[WATI Service] Failed to send message:`, responseData);
      throw new Error(responseData.error || 'Failed to send message');
    }

    if (!responseData.success) {
      console.error(`[WATI Service] WATI API returned error:`, responseData);
      throw new Error(responseData.error || 'WATI API error');
    }

    console.log('[WATI Service] Message sent successfully:', responseData.data);
    return responseData.data;

  } catch (error) {
    console.error('[WATI Service] Error sending text message:', error);
    throw error;
  }
}

/**
 * Sends a template message via our server-side WATI API
 * 
 * @param whatsappNumber - The recipient's WhatsApp number
 * @param templateName - The name of the approved WhatsApp template
 * @param parameters - Template parameters (if any)
 * @returns Promise<any>
 */
export async function sendTemplateMessage(
  whatsappNumber: string,
  templateName: string,
  parameters: string[] = []
): Promise<any> {
  try {
    console.log(`[WATI Service] Sending template message '${templateName}' to ${whatsappNumber}`);

    const response = await fetch('/api/wati/send-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsappNumber: whatsappNumber,
        templateName: templateName,
        parameters: parameters
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[WATI Service] Failed to send template message:`, responseData);
      throw new Error(responseData.error || 'Failed to send template message');
    }

    if (!responseData.success) {
      console.error(`[WATI Service] WATI API returned error:`, responseData);
      throw new Error(responseData.error || 'WATI API error');
    }

    console.log('[WATI Service] Template message sent successfully:', responseData.data);
    return responseData.data;

  } catch (error) {
    console.error('[WATI Service] Error sending template message:', error);
    throw error;
  }
}

/**
 * Sends a media file (image, document, etc.) via our server-side WATI API
 * 
 * @param whatsappNumber - The recipient's WhatsApp number
 * @param mediaUrl - URL of the media file to send
 * @param caption - Optional caption for the media
 * @returns Promise<any>
 */
export async function sendMediaMessage(
  whatsappNumber: string,
  mediaUrl: string,
  caption?: string
): Promise<any> {
  try {
    console.log(`[WATI Service] Sending media message to ${whatsappNumber}`);

    const response = await fetch('/api/wati/send-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsappNumber: whatsappNumber,
        mediaUrl: mediaUrl,
        caption: caption
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[WATI Service] Failed to send media message:`, responseData);
      throw new Error(responseData.error || 'Failed to send media message');
    }

    if (!responseData.success) {
      console.error(`[WATI Service] WATI API returned error:`, responseData);
      throw new Error(responseData.error || 'WATI API error');
    }

    console.log('[WATI Service] Media message sent successfully:', responseData.data);
    return responseData.data;

  } catch (error) {
    console.error('[WATI Service] Error sending media message:', error);
    throw error;
  }
}