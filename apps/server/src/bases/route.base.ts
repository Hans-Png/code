import consola, { ConsolaInstance } from "consola";
import { Router } from "express";

abstract class BaseRoute {
  protected logger: ConsolaInstance;
  protected pathName: string;
  protected router: Router;
  protected abstract setRoutes(): void;

  /**
   * @param moduleName Name of the route module
   * @param pathName Name of the route path
   */
  constructor(moduleName: string, pathName: string) {
    this.logger = consola.withTag(moduleName);
    this.pathName = `/api/${pathName}`;
    this.router = Router();
  }

  public getPath() {
    return this.pathName;
  }

  public getRouter() {
    return this.router;
  }
}

export default BaseRoute;
