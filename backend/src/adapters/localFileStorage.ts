import fs from "node:fs/promises";
import path from "node:path";
import type {
  IStorageService,
  UploadOptions,
} from "../interfaces/storageService.js";

/**
 * Local filesystem storage service for development
 * Writes assets to ./storage/ directory
 */
export class LocalFileStorage implements IStorageService {
  private baseDir: string;
  private baseUrl: string;

  constructor(options?: { baseDir?: string; baseUrl?: string }) {
    this.baseDir =
      options?.baseDir ||
      path.resolve(process.cwd(), "storage");
    this.baseUrl = options?.baseUrl || "http://localhost:3000/storage";
  }

  private resolvePath(storagePath: string): string {
    const cleanPath = storagePath.replace(/^\/+/, "");
    return path.join(this.baseDir, cleanPath);
  }

  public async upload(
    storagePath: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<string> {
    const fullPath = this.resolvePath(storagePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });

    const buffer =
      typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await fs.writeFile(fullPath, buffer);

    return this.getUrl(storagePath);
  }

  public async get(storagePath: string): Promise<Buffer | null> {
    const fullPath = this.resolvePath(storagePath);
    try {
      return await fs.readFile(fullPath);
    } catch {
      return null;
    }
  }

  public async delete(storagePath: string): Promise<void> {
    const fullPath = this.resolvePath(storagePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  public getUrl(storagePath: string): string {
    const cleanPath = storagePath.replace(/^\/+/, "");
    return `${this.baseUrl}/${cleanPath}`;
  }
}

export const localFileStorage = new LocalFileStorage();
