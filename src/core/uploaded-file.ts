import { UPLOADS_FIELDNAME } from "@/modules/file-uploads/utils";
import { ensureDirectory } from "@/shared/utils";
import { GenericObject } from "@/types";
import { Request } from "express";
import { writeFileSync } from "fs";
import fs from "fs/promises";
import path from "path";

export interface UploadedFileInterface {
  filename: string;
  fieldname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export class UploadedFile {
  private readonly rootPath: string = UPLOADS_FIELDNAME;

  constructor(private readonly file: Express.Multer.File) {
    this.validateFile(file);

    this.rootPath = ensureDirectory(this.rootPath);
  }

  public validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error("File is required");
    }
  }

  /**
   * @description Get the file
   * @returns The file
   */
  public getFile(req: Request): GenericObject {
    // return only(this.file, UPLOADS_FIELDS);
    return {
      ...this.file,
      url: this.getFileUrl(req),
    };
  }

  /**
   * @description Generates a publicly accessible URL for the uploaded file.
   * It builds a robust absolute URL using Express request information and
   * valid path joining, ensuring cross-platform safety and removing duplicate slashes.
   * @param req - The Express request object
   * @returns The public URL for this uploaded file
   */
  public getFileUrl(req: Request): string {
    // Try to get a base path, fallback to '/uploads'
    const uploadsBaseUrl = `/${UPLOADS_FIELDNAME}`;

    // Files are stored directly in uploads/ (fieldname is validated but not used in path)
    const segments = [uploadsBaseUrl, this.name()].filter(Boolean);

    // Use POSIX path joining to avoid backslashes on Windows URLs
    const resourcePath = path.posix.join(...segments);

    // Optionally, remove duplicate slashes
    const normalizedPath = resourcePath.replace(/\/+/g, "/");

    // Ensures protocol and host are accurate, supports non-default ports, etc.
    const protocol = req.protocol;
    const host = req.get("host");

    return `${protocol}://${host}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
  }

  /**
   * @description Get the name of the uploaded file
   * @returns The name of the uploaded file
   */
  public name(): string {
    return this.file.filename;
  }

  /**
   * @description Get the mime type of the uploaded file
   * @returns The mime type of the uploaded file
   */
  public mimeType(): string {
    return this.file.mimetype;
  }

  /**
   * @description Get the size of the uploaded file
   * @returns The size of the uploaded file
   */
  public size(): number {
    return this.file.size;
  }

  /**
   * @description Get the extension of the uploaded file
   * @returns The extension of the uploaded file
   */
  public extension(): string {
    return path.extname(this.file.originalname).replace(".", "");
  }

  /**
   * @description Get the buffer of the uploaded file
   * @returns The buffer of the uploaded file
   */
  public buffer(): Buffer {
    return this.file.buffer;
  }

  /**
   * @description Save the uploaded file to the given path
   * @param destination - The path to save the uploaded file to
   */
  public async saveTo(destination: string): Promise<void> {
    const directory = path.join(this.rootPath, destination);
    ensureDirectory(directory);

    const filePath = path.join(directory, this.name());
    writeFileSync(filePath, this.buffer());
  }

  /**
   * @description Save the uploaded file as the given name
   * @param destination - The path to save the uploaded file as
   * @param name - The name to save the uploaded file as
   */
  public async saveAs(destination: string, name: string): Promise<void> {
    const directory = path.join(this.rootPath, destination);
    ensureDirectory(directory);

    const filePath = path.join(directory, name);
    writeFileSync(filePath, this.buffer());
  }

  /**
   * @description Get the full path of the uploaded file
   * @returns The full path of the uploaded file
   */
  public path(): string {
    return this.file.path || path.join(this.rootPath, this.name());
  }

  /**
   * @description Delete the uploaded file
   */
  public async delete(): Promise<void> {
    const filePath = this.path();
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, which is fine for deletion
    }
  }

  /**
   * @description Delete a file by its full path
   * @param filePath - The full path to the file to delete
   * @returns Promise that resolves when the file is deleted
   */
  public static async deleteByPath(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, which is fine for deletion
    }
  }

  /**
   * @description Delete a file by its filename (searches in the root uploads directory)
   * @param filename - The filename to delete
   * @param subdirectory - Optional subdirectory within the uploads directory
   * @returns Promise that resolves when the file is deleted
   */
  public static async deleteByFilename(
    filename: string,
    subdirectory?: string
  ): Promise<void> {
    const rootPath = ensureDirectory(UPLOADS_FIELDNAME);
    const filePath = subdirectory
      ? path.join(rootPath, subdirectory, filename)
      : path.join(rootPath, filename);

    await UploadedFile.deleteByPath(filePath);
  }
}
