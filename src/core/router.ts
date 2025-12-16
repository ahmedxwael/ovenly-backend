import { API_PREFIX } from "@/config/env";
import { log, logRouteCompletion } from "@/shared/utils";
import {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { http } from "./http";

export type RouteMethod = "get" | "post" | "put" | "patch" | "delete";

export type Route = {
  path: string;
  method: RouteMethod;
  handlers: RequestHandler[];
  registered?: boolean;
};

/**
 * RouteBuilder class for fluent route chaining
 * Allows: router.route("/users").get(() => {}).post(() => {})
 */
class RouteBuilder {
  private basePath: string;
  private parentRouter: Router;

  constructor(basePath: string, parentRouter: Router) {
    this.basePath = basePath;
    this.parentRouter = parentRouter;
  }

  private addRoute(
    method: RouteMethod,
    path: string,
    ...handlers: RequestHandler[]
  ) {
    // If path is provided, append it to basePath, otherwise use basePath
    const fullPath = path ? `${this.basePath}${path}` : this.basePath;
    this.parentRouter.addRoute(method, fullPath, ...handlers);
    return this; // Return this for chaining
  }

  /**
   * Method Overloading Pattern:
   * These methods support multiple ways of calling:
   * 1. With just handler(s): .get(handler) or .get(handler1, handler2, ...) - uses the base path from route()
   * 2. With path + handler(s): .get("/:id", handler) or .get("/:id", handler1, handler2, ...) - appends path to base path
   *
   * The first two lines are TypeScript function overload signatures (type definitions)
   * The third line is the actual implementation that handles both cases
   */

  // GET method overloads - allows .get(handler) or .get(path, ...handlers)
  public get(...handlers: RequestHandler[]): this;
  public get(path: string, ...handlers: RequestHandler[]): this;
  public get(
    pathOrHandler: string | RequestHandler,
    ...handlers: RequestHandler[]
  ): this {
    // If first param is a function, it's the handler (no path provided)
    if (typeof pathOrHandler === "function") {
      return this.addRoute("get", "", pathOrHandler, ...handlers);
    }
    // Otherwise, first param is the path, rest are handlers
    return this.addRoute("get", pathOrHandler, ...handlers);
  }

  // POST method overloads - allows .post(handler) or .post(path, ...handlers)
  public post(...handlers: RequestHandler[]): this;
  public post(path: string, ...handlers: RequestHandler[]): this;
  public post(
    pathOrHandler: string | RequestHandler,
    ...handlers: RequestHandler[]
  ): this {
    if (typeof pathOrHandler === "function") {
      return this.addRoute("post", "", pathOrHandler, ...handlers);
    }
    return this.addRoute("post", pathOrHandler, ...handlers);
  }

  // PUT method overloads - allows .put(handler) or .put(path, ...handlers)
  public put(...handlers: RequestHandler[]): this;
  public put(path: string, ...handlers: RequestHandler[]): this;
  public put(
    pathOrHandler: string | RequestHandler,
    ...handlers: RequestHandler[]
  ): this {
    if (typeof pathOrHandler === "function") {
      return this.addRoute("put", "", pathOrHandler, ...handlers);
    }
    return this.addRoute("put", pathOrHandler, ...handlers);
  }

  // PATCH method overloads - allows .patch(handler) or .patch(path, ...handlers)
  public patch(...handlers: RequestHandler[]): this;
  public patch(path: string, ...handlers: RequestHandler[]): this;
  public patch(
    pathOrHandler: string | RequestHandler,
    ...handlers: RequestHandler[]
  ): this {
    if (typeof pathOrHandler === "function") {
      return this.addRoute("patch", "", pathOrHandler, ...handlers);
    }
    return this.addRoute("patch", pathOrHandler, ...handlers);
  }

  // DELETE method overloads - allows .delete(handler) or .delete(path, ...handlers)
  public delete(...handlers: RequestHandler[]): this;
  public delete(path: string, ...handlers: RequestHandler[]): this;
  public delete(
    pathOrHandler: string | RequestHandler,
    ...handlers: RequestHandler[]
  ): this {
    if (typeof pathOrHandler === "function") {
      return this.addRoute("delete", "", pathOrHandler, ...handlers);
    }
    return this.addRoute("delete", pathOrHandler, ...handlers);
  }
}

/**
 * @description The router class
 */
export class Router {
  private static instance: Router;
  private routes: Route[] = [];
  private prefix: string = `/${API_PREFIX || ""}`;
  private app: Express | null = null;

  private constructor(prefix: string = "") {
    this.prefix += prefix;
  }

  /**
   * @description Get the instance of the router
   * @returns The instance of the router
   */
  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  /**
   * @description Create a logging wrapper for route handlers
   * @param route - The route to create a wrapper for
   * @returns An array of wrapped handlers with logging on the last handler
   */
  private createLoggingHandlers(route: Route): RequestHandler[] {
    const fullPath = `${this.prefix}${route.path}`;

    // Wrap all handlers except the last one (these are typically middleware)
    // Middleware should be called directly to work properly (e.g., multer)
    const wrappedMiddlewares = route.handlers.slice(0, -1).map((handler) => {
      return (req: Request, res: Response, next: NextFunction) => {
        // Set request on http instance for potential use in middleware
        http.setRequest(req).setResponse(res).setNext(next);
        // Call middleware directly (important for multer and other middleware)
        return handler(req, res, next);
      };
    });

    // Wrap the last handler (the actual route handler) with logging
    const lastHandler = route.handlers[route.handlers.length - 1];
    const wrappedLastHandler: RequestHandler = (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const startTime = Date.now();

      // Track when response finishes to get actual status code
      res.once("finish", () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        logRouteCompletion(route.method, fullPath, statusCode, duration);
      });

      // Set request on http instance for the route handler
      http
        .setRequest(req)
        .setResponse(res)
        .setNext(next)
        .setHandler(lastHandler);

      return http.execute();
    };

    return [...wrappedMiddlewares, wrappedLastHandler];
  }

  /**
   * @description Register a single route with Express
   * @param route - The route to register
   */
  private registerRoute(route: Route): void {
    if (!this.app) {
      log.error("App not set yet, will register later");
      return; // App not set yet, will register later
    }

    if (route.handlers.length === 0) {
      log.error(`Route ${route.method} ${route.path} has no handlers`);
      return;
    }

    const wrappedHandlers = this.createLoggingHandlers(route);
    this.app[route.method](`${this.prefix}${route.path}`, ...wrappedHandlers);
    route.registered = true;
  }

  /**
   * @description Internal method to add a route
   * @param method - The HTTP method
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   */
  public addRoute(
    method: RouteMethod,
    path: string,
    ...handlers: RequestHandler[]
  ) {
    if (handlers.length === 0) {
      log.error(`Route ${method} ${path} must have at least one handler`);
      return;
    }

    const route: Route = {
      path,
      method,
      handlers,
      registered: false,
    };

    this.routes.push(route);

    // Register immediately if app is already set
    if (this.app) {
      this.registerRoute(route);
    }
  }

  /**
   * @description Add a GET route
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   * @returns The router instance
   */
  public get(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("get", path, ...handlers);
    return this;
  }

  /**
   * @description Add a POST route
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   * @returns The router instance
   */
  public post(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("post", path, ...handlers);
    return this;
  }

  /**
   * @description Add a PUT route
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   * @returns The router instance
   */
  public put(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("put", path, ...handlers);
    return this;
  }

  /**
   * @description Add a PATCH route
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   * @returns The router instance
   */
  public patch(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("patch", path, ...handlers);
    return this;
  }

  /**
   * @description Add a DELETE route
   * @param path - The path of the route
   * @param handlers - One or more handler functions
   * @returns The router instance
   */
  public delete(path: string, ...handlers: RequestHandler[]) {
    this.addRoute("delete", path, ...handlers);
    return this;
  }

  /**
   * @description Create a route builder for fluent chaining
   * @param path - The base path for the route
   * @returns A RouteBuilder instance for method chaining
   * @example
   * router.route("/users").get(() => {}).post(() => {})
   * router.route("/users").get("/:id", () => {}).put("/:id", () => {})
   * router.route("/users").get(middleware1, middleware2, handler)
   */
  public route(path: string): RouteBuilder {
    return new RouteBuilder(path, this);
  }

  /**
   * @description Set the Express app for immediate route registration
   * @param app - The Express app instance
   */
  public scan(app: Express): void {
    this.app = app;
    // Register any routes that were added before the app was set
    this.routes.forEach((route) => {
      if (!route.registered) {
        this.registerRoute(route);
      }
    });
  }

  /**
   * @description Get the routes
   * @returns The routes
   */
  public getRoutes() {
    return this.routes;
  }
}

/**
 * @description The router instance
 */
export const router = Router.getInstance();
