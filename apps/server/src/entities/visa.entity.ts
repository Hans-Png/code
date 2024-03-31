import { Entity, ManyToOne, Property, Unique } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";
import CountryEntity from "./country.entity";

@Entity()
@Unique({ properties: ["fromCountry", "toCountry"] })
class VisaPolicyEntity extends BaseTableEntity {
  @ManyToOne({ entity: () => CountryEntity })
  fromCountry!: CountryEntity;

  @ManyToOne({ entity: () => CountryEntity })
  toCountry!: CountryEntity;

  @Property({ type: "string" })
  visaRequirementType!: string;

  @Property({ type: "array", nullable: true })
  specialVisaRequirements?: {
    /** Visa of certain country */
    countryCode: string;
    visaType: string;
    stayDuration: number;
  }[];

  @Property({ type: "integer" })
  stayDuration!: number; // Admission Refuse/Visa Required/Freedom of Movement = -1

  @Property({ type: "string" })
  travelDocumentType!: string;

  @Property({ type: "json", nullable: true })
  remark?: { [language: string]: string };
}

export default VisaPolicyEntity;
