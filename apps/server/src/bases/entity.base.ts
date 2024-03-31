import { BaseEntity, PrimaryKey, PrimaryKeyProp } from "@mikro-orm/core";
import { v4 as uuidV4 } from "uuid";

abstract class BaseTableEntity extends BaseEntity {
  [PrimaryKeyProp]?: "uuid";

  @PrimaryKey({ type: "uuid" })
  uuid = uuidV4();
}

export default BaseTableEntity;
