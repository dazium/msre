import { describe, it, expect } from "vitest";
import {
  validators,
  validateField,
  validateForm,
  errorsToMap,
  type ValidationRules,
} from "./validation";

describe("Validation Utilities", () => {
  describe("validators.required", () => {
    it("should return error for empty string", () => {
      const validator = validators.required("Name");
      expect(validator("")).not.toBeNull();
      expect(validator("")).toBe("Name is required");
    });

    it("should return error for null", () => {
      const validator = validators.required("Name");
      expect(validator(null)).not.toBeNull();
    });

    it("should return null for valid value", () => {
      const validator = validators.required("Name");
      expect(validator("John")).toBeNull();
    });
  });

  describe("validators.email", () => {
    it("should validate valid email", () => {
      const validator = validators.email();
      expect(validator("test@example.com")).toBeNull();
    });

    it("should reject invalid email", () => {
      const validator = validators.email();
      expect(validator("invalid-email")).not.toBeNull();
    });

    it("should allow empty email", () => {
      const validator = validators.email();
      expect(validator("")).toBeNull();
    });
  });

  describe("validators.phone", () => {
    it("should validate valid phone numbers", () => {
      const validator = validators.phone();
      expect(validator("1234567890")).toBeNull();
      expect(validator("(123) 456-7890")).toBeNull();
      expect(validator("123-456-7890")).toBeNull();
    });

    it("should reject invalid phone", () => {
      const validator = validators.phone();
      expect(validator("123")).not.toBeNull();
    });
  });

  describe("validators.minLength", () => {
    it("should validate minimum length", () => {
      const validator = validators.minLength("Name", 3);
      expect(validator("Jo")).not.toBeNull();
      expect(validator("John")).toBeNull();
    });
  });

  describe("validators.maxLength", () => {
    it("should validate maximum length", () => {
      const validator = validators.maxLength("Name", 5);
      expect(validator("John")).toBeNull();
      expect(validator("Jonathan")).not.toBeNull();
    });
  });

  describe("validators.numeric", () => {
    it("should validate numeric values", () => {
      const validator = validators.numeric("Price");
      expect(validator("123")).toBeNull();
      expect(validator("123.45")).toBeNull();
      expect(validator("abc")).not.toBeNull();
    });

    it("should allow empty values", () => {
      const validator = validators.numeric("Price");
      expect(validator("")).toBeNull();
    });
  });

  describe("validators.minValue", () => {
    it("should validate minimum value", () => {
      const validator = validators.minValue("Price", 0);
      expect(validator("-1")).not.toBeNull();
      expect(validator("0")).toBeNull();
      expect(validator("100")).toBeNull();
    });
  });

  describe("validateField", () => {
    it("should return first error from multiple rules", () => {
      const rules = [
        validators.required("Name"),
        validators.minLength("Name", 3),
      ];
      expect(validateField("", rules)).toBe("Name is required");
      expect(validateField("Jo", rules)).toBe("Name must be at least 3 characters");
    });

    it("should return null if all rules pass", () => {
      const rules = [
        validators.required("Name"),
        validators.minLength("Name", 3),
      ];
      expect(validateField("John", rules)).toBeNull();
    });
  });

  describe("validateForm", () => {
    it("should validate multiple fields", () => {
      const rules: ValidationRules = {
        name: [validators.required("Name"), validators.minLength("Name", 3)],
        email: [validators.required("Email"), validators.email()],
      };

      const errors = validateForm({ name: "", email: "invalid" }, rules);
      expect(errors.length).toBe(2);
      expect(errors[0].field).toBe("name");
      expect(errors[1].field).toBe("email");
    });

    it("should return empty array if all fields valid", () => {
      const rules: ValidationRules = {
        name: [validators.required("Name")],
        email: [validators.email()],
      };

      const errors = validateForm(
        { name: "John", email: "john@example.com" },
        rules
      );
      expect(errors.length).toBe(0);
    });
  });

  describe("errorsToMap", () => {
    it("should convert errors array to map", () => {
      const errors = [
        { field: "name", message: "Name is required" },
        { field: "email", message: "Email is invalid" },
      ];

      const map = errorsToMap(errors);
      expect(map.name).toBe("Name is required");
      expect(map.email).toBe("Email is invalid");
    });
  });
});
