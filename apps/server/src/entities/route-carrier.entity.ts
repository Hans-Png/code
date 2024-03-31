import { Entity, ManyToOne } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";
import CarrierEntity from "./carrier.entity";
import RouteEntity from "./route.entity";

@Entity()
class RouteCarrierEntity extends BaseTableEntity {
  @ManyToOne({ entity: () => CarrierEntity })
  carrier!: CarrierEntity;

  @ManyToOne({ entity: () => RouteEntity })
  route!: RouteEntity;
}

export default RouteCarrierEntity;
