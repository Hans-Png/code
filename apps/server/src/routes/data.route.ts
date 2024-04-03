import BaseRoute from "../bases/route.base";
import DataController from "../controllers/data.controller";

class DataRoute extends BaseRoute {
  #controller: DataController;

  constructor() {
    super("DataRoute", "data");
    this.#controller = new DataController();
    this.setRoutes();
  }

  protected setRoutes(): void {
    this.router.get("/allairports", this.#controller.getAllAirports);
    this.router.get("/allcountries", this.#controller.getAllCountries);
  }
}

export default DataRoute;
