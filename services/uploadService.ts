export interface UploadResult { success: boolean; fileUrl?: string; fileName?: string; error?: string; }
export const uploadService = {
  async uploadFile(_file: File): Promise<UploadResult> {
    throw new Error('Private file upload is unavailable in v2. The document has not been uploaded.');
  }
};
export default uploadService;
