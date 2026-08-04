// src/services/uploadService.ts

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export const VERCEL_UPLOAD_API = 'https://ndamclinic.vercel.app/api/upload';

export const uploadService = {
  /**
   * Uploads a file (PDF or image) to Vercel API endpoint (https://ndamclinic.vercel.app/api/upload),
   * Pinata IPFS, or fallback base64 Data URL using standard fetch.
   */
  async uploadFile(file: File): Promise<UploadResult> {
    try {
      console.log('📄 Preparing file for upload:', file.name, file.size, file.type);

      // 1. Try Vercel Backend Upload (https://ndamclinic.vercel.app/api/upload)
      try {
        console.log('🚀 Attempting Vercel backend upload to:', VERCEL_UPLOAD_API);
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(VERCEL_UPLOAD_API, {
          method: 'POST',
          body: formData,
        });

        console.log('Vercel upload response status:', res.status);

        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await res.json();
            console.log('Upload server response:', data);
            const fileUrl = data.fileUrl || data.url || data.secure_url || data.path;
            if (fileUrl) {
              console.log('✅ Vercel backend upload successful:', fileUrl);
              return {
                success: true,
                fileUrl,
                fileName: file.name
              };
            }
          }
        } else {
          console.warn('⚠️ Vercel backend returned non-OK status:', res.status, res.statusText);
        }
      } catch (vercelErr) {
        console.warn('⚠️ Vercel backend upload failed or blocked, proceeding to alternative methods:', vercelErr);
      }

      // 2. Try Pinata IPFS upload if API keys exist
      const metaEnv = (import.meta as any).env || {};
      const procEnv = typeof process !== 'undefined' ? process.env : {};
      const pinataApiKey = metaEnv.VITE_PINATA_API_KEY || procEnv?.PINATA_API_KEY || '';
      const pinataSecretKey = metaEnv.VITE_PINATA_SECRET_API_KEY || procEnv?.PINATA_SECRET_API_KEY || '';

      if (pinataApiKey && pinataSecretKey) {
        try {
          console.log('🚀 Uploading file to Pinata IPFS via fetch...');
          const formData = new FormData();
          formData.append('file', file);
          formData.append(
            'pinataMetadata',
            JSON.stringify({
              name: file.name || 'Lab Document',
              keyvalues: { uploadedAt: new Date().toISOString() }
            })
          );

          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              pinata_api_key: pinataApiKey,
              pinata_secret_api_key: pinataSecretKey
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.IpfsHash) {
              const fileUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
              console.log('✅ Pinata IPFS upload successful:', fileUrl);
              return {
                success: true,
                fileUrl,
                fileName: file.name
              };
            }
          }
        } catch (pinataErr) {
          console.warn('⚠️ Pinata upload warning, using local file representation:', pinataErr);
        }
      }

      // 3. Local browser fallback (Data URL / Object URL)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultUrl = reader.result as string;
          console.log('✅ Local file processed successfully (Data URL fallback)');
          resolve({
            success: true,
            fileUrl: resultUrl,
            fileName: file.name
          });
        };
        reader.onerror = () => {
          const objectUrl = URL.createObjectURL(file);
          resolve({
            success: true,
            fileUrl: objectUrl,
            fileName: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      return {
        success: false,
        error: err?.message || 'Upload failed'
      };
    }
  }
};

export default uploadService;
