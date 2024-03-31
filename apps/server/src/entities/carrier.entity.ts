import { Entity, Property } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";

@Entity()
class CarrierEntity extends BaseTableEntity {
  /** name of the carrier, "null" stand for not applicable */
  @Property({ type: "string" })
  name!: string;
}

export default CarrierEntity;
