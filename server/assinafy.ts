const ASSINAFY_API_KEY = process.env.ASSINAFY_API_KEY;
const ASSINAFY_WORKSPACE_ID = process.env.ASSINAFY_WORKSPACE_ID;
const ASSINAFY_BASE_URL = "https://api.assinafy.com.br/v1";

interface Signer {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: "company" | "creator";
}

interface SignerData {
  id: string;
  full_name: string;
  email: string;
  completed?: boolean;
  has_accepted_terms?: boolean;
}

interface DocumentData {
  id: string;
  name: string;
  status: string;
  signing_url?: string;
  shared_signing_url?: string;
  is_closed?: boolean;
  decline_reason?: string;
  declined_by?: string;
  assignment?: {
    id?: string;
    summary?: {
      signers?: SignerData[];
    };
  };
  artifacts?: {
    original?: string;
    certificated?: string;
    bundle?: string;
    "certificate-page"?: string;
  };
}

interface CreateEnvelopeResponse {
  id: string;
  status: string;
  signers: Array<{
    id: string;
    name: string;
    email: string;
    sign_url?: string;
  }>;
  signingUrl?: string;
}

interface EnvelopeStatus {
  id: string;
  status: string;
  signed_document_url?: string;
  signingUrl?: string;
  signers: Array<{
    id: string;
    name: string;
    email: string;
    signed: boolean;
    signed_at?: string;
  }>;
}

export class AssinafyService {
  private apiKey: string;
  private workspaceId: string;

  constructor() {
    if (!ASSINAFY_API_KEY || !ASSINAFY_WORKSPACE_ID) {
      throw new Error("Assinafy API credentials not configured");
    }
    this.apiKey = ASSINAFY_API_KEY;
    this.workspaceId = ASSINAFY_WORKSPACE_ID;
  }

  private async request(
    endpoint: string, 
    options: RequestInit = {},
    isFormData: boolean = false
  ): Promise<any> {
    const url = `${ASSINAFY_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      "X-Api-Key": this.apiKey,
      "Accept": "application/json",
    };

    // Don't set Content-Type for FormData (fetch sets it automatically with boundary)
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    console.log(`[Assinafy] Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`[Assinafy] API error ${response.status}: ${responseText}`);
      throw new Error(`Assinafy API error: ${response.status} - ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      console.log(`[Assinafy] Response status: ${response.status}`);
      return data;
    } catch {
      return responseText;
    }
  }

  /**
   * STEP 1: Upload document to Assinafy
   * POST /accounts/{account_id}/documents (multipart)
   */
  async uploadDocument(pdfBuffer: Buffer, filename: string): Promise<string> {
    console.log(`[Assinafy] Step 1: Uploading document: ${filename} (${pdfBuffer.length} bytes)`);
    
    // Create form data with the file
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    const result = await this.request(
      `/accounts/${this.workspaceId}/documents`,
      {
        method: "POST",
        body: formData,
      },
      true // isFormData
    );

    console.log(`[Assinafy] Upload response:`, JSON.stringify(result, null, 2));

    const documentId = result.data?.id || result.id;
    
    if (!documentId) {
      console.error('[Assinafy] Upload response:', JSON.stringify(result));
      throw new Error('Failed to get document ID from upload response');
    }
    
    console.log(`[Assinafy] Document uploaded successfully, ID: ${documentId}`);
    return documentId;
  }

  /**
   * STEP 2: Wait for document to be processed (status: metadata_ready or ready)
   * GET /documents/{document_id}
   */
  async waitForProcessing(documentId: string, maxAttempts: number = 20): Promise<DocumentData> {
    console.log(`[Assinafy] Step 2: Waiting for document ${documentId} to be processed...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Wait 3 seconds between attempts
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await this.request(`/documents/${documentId}`);
      const document: DocumentData = result.data || result;
      
      console.log(`[Assinafy] Attempt ${attempt}/${maxAttempts}: Status = ${document.status}`);
      
      if (document.status === 'metadata_ready' || document.status === 'ready') {
        console.log(`[Assinafy] Document ${documentId} is ready for signing`);
        return document;
      }
      
      if (document.status !== 'uploaded' && document.status !== 'metadata_processing') {
        console.warn(`[Assinafy] Unexpected document status: ${document.status}`);
      }
    }
    
    throw new Error(`Document not processed after ${maxAttempts} attempts. Please try again.`);
  }

  /**
   * Find existing signer by email
   */
  async findSignerByEmail(email: string): Promise<string | null> {
    console.log(`[Assinafy] Searching for existing signer with email: ${email}`);
    
    try {
      // Try to search by email query parameter
      const result = await this.request(
        `/accounts/${this.workspaceId}/signers?email=${encodeURIComponent(email)}`
      );
      
      const signers = result.data || result || [];
      
      if (Array.isArray(signers)) {
        for (const signer of signers) {
          if (signer.email && signer.email.toLowerCase() === email.toLowerCase()) {
            console.log(`[Assinafy] Found existing signer: ${signer.id}`);
            return signer.id;
          }
        }
      }
    } catch (error) {
      console.log(`[Assinafy] Error searching signer, will try to create new: ${error}`);
    }
    
    return null;
  }

  /**
   * STEP 3: Create a signer (or find existing one)
   * POST /accounts/{account_id}/signers
   */
  async createSigner(name: string, email: string): Promise<string> {
    console.log(`[Assinafy] Step 3: Creating/finding signer: ${name} <${email}>`);
    
    // First, try to find existing signer
    const existingSignerId = await this.findSignerByEmail(email);
    if (existingSignerId) {
      console.log(`[Assinafy] Using existing signer: ${existingSignerId}`);
      return existingSignerId;
    }
    
    // Create new signer
    try {
      const result = await this.request(`/accounts/${this.workspaceId}/signers`, {
        method: "POST",
        body: JSON.stringify({
          full_name: name,
          email: email,
        }),
      });

      console.log(`[Assinafy] Create signer response:`, JSON.stringify(result, null, 2));

      const signerId = result.data?.id || result.id;
      
      if (!signerId) {
        console.error('[Assinafy] Create signer response:', JSON.stringify(result));
        throw new Error('Failed to get signer ID from response');
      }
      
      console.log(`[Assinafy] Signer created successfully, ID: ${signerId}`);
      return signerId;
    } catch (error: any) {
      // If signer already exists error, try to find again
      if (error.message && (
        error.message.includes('8000') || 
        error.message.includes('já existe') ||
        error.message.includes('already exists') ||
        error.message.includes('duplicate')
      )) {
        console.log(`[Assinafy] Signer exists, searching again...`);
        const retrySignerId = await this.findSignerByEmail(email);
        if (retrySignerId) {
          return retrySignerId;
        }
      }
      throw error;
    }
  }

  /**
   * STEP 4: Create assignment (link signers to document and send for signature)
   * POST /documents/{document_id}/assignments
   */
  async createAssignment(documentId: string, signerIds: string[], message?: string): Promise<void> {
    console.log(`[Assinafy] Step 4: Creating assignment for document ${documentId} with ${signerIds.length} signers`);
    console.log(`[Assinafy] Signer IDs: ${signerIds.join(', ')}`);
    
    const payload = {
      method: "virtual",
      signer_ids: signerIds,
      message: message || "Por favor, assine o contrato anexado.",
    };
    
    console.log(`[Assinafy] Assignment payload:`, JSON.stringify(payload, null, 2));
    
    const result = await this.request(`/documents/${documentId}/assignments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log(`[Assinafy] Assignment response:`, JSON.stringify(result, null, 2));
    console.log(`[Assinafy] Assignment created successfully - document sent for signature`);
  }

  /**
   * STEP 5: Get document status and signing URL
   * GET /documents/{document_id}
   */
  async getDocumentStatus(documentId: string): Promise<DocumentData> {
    console.log(`[Assinafy] Getting document status: ${documentId}`);
    
    const result = await this.request(`/documents/${documentId}`);
    const document: DocumentData = result.data || result;
    
    console.log(`[Assinafy] Document status: ${document.status}`);
    console.log(`[Assinafy] Full document data:`, JSON.stringify(document, null, 2));
    
    return document;
  }

  /**
   * Complete flow: Upload -> Wait -> Create Signers -> Create Assignment -> Get URL
   * Returns the envelope with signer information
   */
  async createEnvelope(
    documentBuffer: Buffer,
    documentName: string,
    signers: Signer[]
  ): Promise<CreateEnvelopeResponse> {
    console.log(`[Assinafy] === Starting envelope creation for: ${documentName} ===`);
    console.log(`[Assinafy] Number of signers: ${signers.length}`);
    
    // Step 1: Upload document
    const documentId = await this.uploadDocument(documentBuffer, `${documentName}.pdf`);
    
    // Step 2: Wait for processing
    await this.waitForProcessing(documentId);
    
    // Step 3: Create signers
    const signerResults: Array<{ id: string; name: string; email: string; role: string }> = [];
    
    for (const signer of signers) {
      try {
        const signerId = await this.createSigner(signer.name, signer.email);
        signerResults.push({
          id: signerId,
          name: signer.name,
          email: signer.email,
          role: signer.role
        });
      } catch (error) {
        console.error(`[Assinafy] Failed to create signer ${signer.name}:`, error);
        throw new Error(`Falha ao criar signatário: ${signer.name}`);
      }
    }
    
    // Step 4: Create assignment
    const signerIds = signerResults.map(s => s.id);
    await this.createAssignment(
      documentId, 
      signerIds,
      "Você recebeu um contrato para assinatura eletrônica via CreatorConnect."
    );
    
    // Step 5: Get final status with signing URL
    const finalStatus = await this.getDocumentStatus(documentId);
    
    // Try multiple possible field names for signing URL
    const signingUrl = finalStatus.signing_url || 
                       finalStatus.shared_signing_url || 
                       (finalStatus as any).sign_url ||
                       (finalStatus as any).signature_url;
    
    console.log(`[Assinafy] === Envelope created successfully ===`);
    console.log(`[Assinafy] Document ID: ${documentId}`);
    console.log(`[Assinafy] Final status: ${finalStatus.status}`);
    console.log(`[Assinafy] Signing URL: ${signingUrl || 'N/A'}`);
    
    return {
      id: documentId,
      status: finalStatus.status,
      signers: signerResults.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        sign_url: signingUrl
      })),
      signingUrl: signingUrl
    };
  }

  /**
   * Get envelope status (alias for getDocumentStatus with formatted response)
   */
  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus> {
    const document = await this.getDocumentStatus(envelopeId);
    
    // Extract signer information from assignment
    const signers: EnvelopeStatus['signers'] = [];
    
    if (document.assignment?.summary?.signers) {
      for (const signer of document.assignment.summary.signers) {
        signers.push({
          id: signer.id,
          name: signer.full_name,
          email: signer.email,
          signed: signer.completed || false,
          signed_at: undefined
        });
      }
    }
    
    // Get signed document URL if available
    let signedDocUrl: string | undefined;
    if (document.artifacts?.certificated) {
      signedDocUrl = `${document.artifacts.certificated}?access-token=${this.apiKey}`;
    } else if (document.artifacts?.bundle) {
      signedDocUrl = `${document.artifacts.bundle}?access-token=${this.apiKey}`;
    }
    
    // Try multiple possible field names for signing URL
    const signingUrl = document.signing_url || 
                       document.shared_signing_url || 
                       (document as any).sign_url;
    
    return {
      id: document.id,
      status: document.status,
      signed_document_url: signedDocUrl,
      signingUrl: signingUrl,
      signers
    };
  }

  /**
   * Get download URLs for signed document
   */
  async getDownloadUrls(documentId: string): Promise<{
    original?: string;
    certificated?: string;
    bundle?: string;
  }> {
    const document = await this.getDocumentStatus(documentId);
    
    if (!document.artifacts) {
      return {};
    }
    
    const urls: Record<string, string> = {};
    
    if (document.artifacts.original) {
      urls.original = `${document.artifacts.original}?access-token=${this.apiKey}`;
    }
    if (document.artifacts.certificated) {
      urls.certificated = `${document.artifacts.certificated}?access-token=${this.apiKey}`;
    }
    if (document.artifacts.bundle) {
      urls.bundle = `${document.artifacts.bundle}?access-token=${this.apiKey}`;
    }
    
    return urls;
  }

  /**
   * Cancel a document/envelope
   */
  async cancelEnvelope(envelopeId: string): Promise<void> {
    console.log(`[Assinafy] Cancelling document: ${envelopeId}`);
    
    await this.request(`/documents/${envelopeId}`, {
      method: "DELETE",
    });
    
    console.log(`[Assinafy] Document cancelled successfully`);
  }

  /**
   * Resend notification to a specific signer
   * Note: This may need to be adjusted based on actual API endpoints
   */
  async resendNotification(envelopeId: string, signerId: string): Promise<void> {
    console.log(`[Assinafy] Resending notification for document ${envelopeId} to signer ${signerId}`);
    
    // This endpoint may vary based on Assinafy API
    console.log(`[Assinafy] Note: Resend notification feature may need API verification`);
  }
}

export const assinafyService = new AssinafyService();
