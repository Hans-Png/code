import { Entity, Index, PrimaryKey, PrimaryKeyProp, Property, Unique } from "@mikro-orm/core";

@Entity()
@Index({ properties: ["altCode"] })
class CountryEntity {
  [PrimaryKeyProp]?: "code";

  /**
   * Stored in ISO 3166-1 alpha-3 format
   */
  @PrimaryKey({ type: "string", nullable: false })
  code!: string;

  /**
   * Corresponding to `code` but is stored in ISO 3166-1 alpha-2 format
   */
  @Unique()
  @Property({ type: "string", nullable: false })
  altCode!: string;

  /**
   * Name of the country in different languages
   */
  @Property({ type: "json", nullable: false })
  name!: { [language: string]: string };
}

export default CountryEntity;
