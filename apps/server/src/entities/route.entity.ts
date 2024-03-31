import { Entity, Index, ManyToOne, Property } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";
import AirportEntity from "./airport.entity";

@Entity()
@Index({ properties: ["fromAirport"], name: "from_airport_route_index" })
@Index({ properties: ["toAirport"], name: "to_airport_route_index" })
@Index({ properties: ["fromAirport", "toAirport"], name: "from_to_airport_route_index" })
class RouteEntity extends BaseTableEntity {
  @ManyToOne({ entity: () => AirportEntity })
  fromAirport!: AirportEntity;

  @ManyToOne({ entity: () => AirportEntity })
  toAirport!: AirportEntity;

  @Property({ type: "integer" })
  distance!: number;

  @Property({ type: "integer" })
  time!: number;
}

export default RouteEntity;
