import { uuidv7 as generateUuidv7 } from "uuidv7";

/**
 * Standard UUIDv7 generator for primary keys.
 * Generates time-sortable 128-bit UUIDs conforming to RFC 9562.
 */
export function uuidv7(): string {
  return generateUuidv7();
}
