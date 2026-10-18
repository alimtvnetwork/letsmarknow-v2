/**
 * Abstract Storage Service Port
 * Spec: 02-spec/21-app/22-infrastructure/12-storage-layout.md
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface IStorageService {
  /**
   * Upload an object to the specified path/key
   */
  upload(
    storagePath: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Download an object from the specified path
   */
  get(storagePath: string): Promise<Buffer | null>;

  /**
   * Delete an object
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Get public or signed URL for accessing the object
   */
  getUrl(storagePath: string): string;
}
