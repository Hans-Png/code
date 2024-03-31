import { Entity, PrimaryKey, PrimaryKeyProp, Property } from "@mikro-orm/core";

@Entity()
class NationalityEntity {
  [PrimaryKeyProp]?: "nationality";

  /**
   * Nationality code
   * Should be identical with the country code and present in ISO 3166-1 alpha-3 format
   * except the special case like:
   * 1. British nationalities (GBR, GBD, GBO, GBS, GBP, GBN).
   *    - nationality code should be separate
   *    - country code should be `GBR`
   *    - nationality name should be separate, like `British Citizen` for `GBR` code
   * 2. Chinese nationality (Include Hong Kong and Macau, but exclude Taiwan)
   *    - nationality code should be `CHN` for Mainland resident and overseas Chinese national
   *      who has already settled abroad regardless of hukou status, or other cases.
   *        - naming: `Chinese` in English and `中國` in Chinese
   *    - nationality code should be `HKG` for Chinese national of Hong Kong Permanent Resident
   *      or Chinese national who has one-way permit and settled in Hong Kong. Eventhough, every
   *      Chinese national who is Hong Kong resident is applicable to the NPC Explanation of CNL,
   *      but practically, only those have been specified is considered as separated category from
   *      ordinary Chinese national in terms of immigration purpose.
   *        - naming: `Chinese (Hong Kong)` in English and `中國（香港）` in Chinese
   *    - nationality code should be `MAC` for Chinese national of Macau resident and not the
   *      resident who pend to choose nationality. The reason is the same as Hong Kong.
   *        - naming: `Chinese (Macau)` in English and `中國（澳門）` in Chinese
   *    - country code should be `CHN`, but for Hong Kong and Macau, use `HKG` and `MAC`
   *      respectively for programming friendly consideration.
   * 3. Taiwan
   *    - for a person with right of abode (household registration) in Taiwan, use `TWN`
   *        - naming: `ROC National` in English and `中華民國國民` in Chinese
   *    - for a person without right of abode in Taiwan, use `XRC`
   *        - naming: `ROC National (without Household registration)` in English
   *          and `中華民國國民（無戶籍）` in Chinese
   *    - country code should be `TWN` due to the difference law from `CHN` on passport issurance
   */
  @PrimaryKey({ type: "string" })
  nationality!: string;

  /**
   * Stored in ISO 3166-1 alpha-3 format
   */
  @Property({ type: "string" })
  country!: string;

  @Property({ type: "json" })
  name!: { [language: string]: string }; // Name of the nationalities in difference languages
}

export default NationalityEntity;
