import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import BaseTableEntity from "../bases/entity.base";
import CountryEntity from "./country.entity";

@Entity()
class TransitPolicyEntity extends BaseTableEntity {
  @ManyToOne({ entity: () => CountryEntity })
  country!: CountryEntity;

  @Property({ type: "boolean" })
  transitVisaRequired!: boolean;

  @Property({ type: "integer" })
  transitDurationHours!: number;

  @Property({ type: "array" })
  applicableTo!: {
    countryCode: string;
    travelDocumentType: string;
    visa?: {
      countryCode: string;
      visaRequirementType: string[];
    };
  }[];

  @Property({ type: "string", nullable: true })
  exceptions?: string;

  @Property({ type: "string", nullable: true })
  additionalRequirements?: string;
}

export default TransitPolicyEntity;
