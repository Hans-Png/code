import config from "../../config.json";
import BaseService from "../bases/service.base";

class ConfigLoaderService extends BaseService {
  public static getLocales() {
    return config.locales;
  }
}

export default ConfigLoaderService;
