import type { UserRole } from "../db/schema.js";

const VALID: readonly UserRole[] = ["customer", "support", "admin"]; // here readonly means that the array cannot be modified and VALID means that the array cannot be reassigned to a new value.

export function parseRole(value: unknown) {
  if (
    typeof value === "string" &&
    (VALID as readonly string[]).includes(value)
  ) {
    return value as UserRole;
  }
  return "customer";
}

export function isAdmin(role: UserRole) {
  return role === "admin";
}

export function isStaff(role: UserRole) {
  return role === "support" || role === "admin";
}