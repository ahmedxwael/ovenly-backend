import { User } from "@/modules/user/types";
import { GenericObject } from "@/types";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { UploadedFile } from "./uploaded-file";

export class Http {
  public request: Request | any = null;
  public response: Response | any = null;
  public next: NextFunction | any = null;
  public handler: RequestHandler | any = null;
  public user: User | null = null;

  /**
   * @description Validate the properties of the Http class
   * @param properties - The properties to validate
   * @returns void
   */
  private validateProperties(
    properties: (keyof Http)[] = ["request", "response", "next", "handler"]
  ) {
    properties.forEach((property) => {
      if (!this[property]) {
        throw new Error(`${property} not set`);
      }
    });
  }

  /**
   * @description Set the request of the Http class
   * @param request - The request to set
   * @returns The Http class
   */
  public setRequest(request: Request) {
    this.request = request;
    return this;
  }

  /**
   * @description Set the response of the Http class
   * @param response - The response to set
   * @returns The Http class
   */
  public setResponse(response: Response) {
    this.response = response;
    return this;
  }

  /**
   * @description Set the next of the Http class
   * @param next - The next to set
   * @returns The Http class
   */
  public setNext(next: NextFunction) {
    this.next = next;
    return this;
  }

  /**
   * @description Set the handler of the Http class
   * @param handler - The handler to set
   * @returns The Http class
   */
  public setHandler(handler: RequestHandler) {
    this.handler = handler;
    return this;
  }

  /**
   * @description Execute the handler of the Http class
   * @returns The result of the handler
   */
  public async execute(): Promise<any> {
    this.validateProperties();

    return await this.handler(this.request, this.response, this.next);
  }

  /**
   * @description Set the user of the Http class
   * @param user - The user to set
   * @returns The Http class
   */
  public setUser(user: User) {
    this.user = user;
    return this;
  }

  /**
   * @description Get all the data from the request
   * @returns All the data from the request
   */
  public allData(): GenericObject {
    this.validateProperties();

    return {
      ...this.request.body,
      ...this.request.params,
      ...this.request.query,
    };
  }

  /**
   * @description Get the body of the request
   * @returns The body of the request
   */
  public body(): GenericObject {
    this.validateProperties(["request"]);

    const body: GenericObject = {};

    for (const key in this.request.body) {
      const data = this.request.body[key];

      if (typeof data === "object" && data.file) {
        body[key] = {
          file: data.file,
          filename: data.filename,
          mimetype: data.mimetype,
          size: data.size,
        };
      } else {
        body[key] = this.input(key);
      }
    }

    return body;
  }

  /**
   * @description Get the params of the request
   * @returns The params of the request
   */
  public params(): GenericObject {
    this.validateProperties(["request"]);

    return this.request.params;
  }

  /**
   * @description Get the query of the request
   * @returns The query of the request
   */
  public query(): GenericObject {
    this.validateProperties(["request"]);

    return this.request.query;
  }

  /**
   * @description Get the value of the given key from the request body, params or query
   * @param key - The key of the input
   * @param fallback - The fallback value if the input is not found
   * @returns The value of the given key from the request body, params or query
   */
  public input<T = any>(key: string): T | undefined;
  public input<T = any>(key: string, fallback: T): T;
  public input<T>(key: string, fallback?: T): T | undefined {
    this.validateProperties(["request"]);

    return (
      this.request.body[key] ||
      this.request.params[key] ||
      this.request.query[key] ||
      (fallback as T)
    );
  }

  /**
   * @description Get the number value of the given key from the request body, params or query
   * @param key - The key of the input
   * @param fallback: number - The fallback value if the input is not found
   * @returns The number value of the given key from the request body, params or query
   */
  public number(key: string, fallback: number = 0): number | undefined {
    this.validateProperties(["request"]);

    const value = this.input(key, fallback);
    return Number(value);
  }

  /**
   * @description Get the boolean value of the given key from the request body, params or query
   * @param key - The key of the input
   * @param fallback - The fallback value if the input is not found
   * @returns The boolean value of the given key from the request body, params or query
   */
  public boolean(key: string, fallback: string = "false"): boolean | undefined {
    this.validateProperties(["request"]);

    const value = this.input<string>(key, fallback);

    // If the value is a string, convert it to a boolean
    return typeof value === "string"
      ? value.toLowerCase() === "true"
      : Boolean(value);
  }

  /**
   * @description Get the file of the request wrapped in UploadedFile class
   * @param key - The key/field name of the file (optional for single file uploads)
   * @returns The file(s) of the given key from the request wrapped in UploadedFile class
   */
  public reqFiles<T = UploadedFile>(key?: string): T[] {
    this.validateProperties(["request"]);

    if (!this.request.files) return [];

    if (!key) {
      return this.request.files.map(
        (f: Express.Multer.File) => new UploadedFile(f)
      );
    }

    return this.request.files
      .filter((f: Express.Multer.File) => f.fieldname === key)
      .map((f: Express.Multer.File) => new UploadedFile(f));
  }
}

export const http = new Http();
