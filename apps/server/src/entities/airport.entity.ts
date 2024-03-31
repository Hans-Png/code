import { Entity, Index, ManyToOne, Property, Unique } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";
import CountryEntity from "./country.entity";

@Entity()
@Index({ properties: ["iata"] })
class AirportEntity extends BaseTableEntity {
  @Property({ type: "string" })
  cityName!: string; // In English

  @Property({ type: "json", nullable: true })
  localizedCityName?: { [language: string]: string };

  @Property({ type: "string", nullable: true })
  continent?: string;

  @ManyToOne({ entity: () => CountryEntity, nullable: false })
  country!: CountryEntity;

  @Property({ type: "string" })
  displayName!: string;

  @Property({ type: "integer", nullable: true })
  elevation?: number;

  @Property({ type: "string" })
  @Unique()
  iata!: string;

  @Property({ type: "string", nullable: true })
  icao?: string;

  @Property({ type: "float" })
  latitude!: number;

  @Property({ type: "float" })
  longitude!: number;

  @Property({ type: "string" })
  name!: string; // In English

  @Property({ type: "json", nullable: true })
  localizedName?: { [language: string]: string };

  @Property({ type: "string", nullable: true })
  timezone?: string;
}

export default AirportEntity;
