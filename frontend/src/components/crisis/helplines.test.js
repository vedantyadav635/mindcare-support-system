import { describe, expect, it } from "vitest";
import { callOptions } from "./helplines";

const numbers = (result) => result.options.map((o) => o.number);

describe("callOptions (the numbers on the crisis screen)", () => {
  it("always has the fixed helplines, with no server data at all", () => {
    expect(numbers(callOptions(null))).toEqual(["14416", "1-800-891-4416", "112"]);
    expect(callOptions(undefined).campusText).toBeNull();
  });

  it("does not repeat a number the backend also sends", () => {
    const result = callOptions({
      helplines: [{ name: "Tele-MANAS", contact: "14416 or 1-800-891-4416" }, { name: "Emergency", contact: "112" }],
      campus_counsellor: "",
    });
    expect(numbers(result)).toEqual(["14416", "1-800-891-4416", "112"]);
  });

  it("adds the campus counsellor's phone number as a call option", () => {
    const result = callOptions({ helplines: [], campus_counsellor: "Campus Counselling Centre, Room 101, +91 98765 43210" });
    expect(numbers(result)).toContain("+91 98765 43210");
    expect(result.options.at(-1).label).toBe("Campus counsellor");
    expect(result.campusText).toBeNull();
  });

  it("never turns a room number into a phone number", () => {
    const result = callOptions({ helplines: [], campus_counsellor: "Counselling Centre, Room 101" });
    expect(numbers(result)).toEqual(["14416", "1-800-891-4416", "112"]);
    expect(result.campusText).toBe("Counselling Centre, Room 101"); // shown as text instead
  });

  it("adds an extra helpline the backend sends", () => {
    const result = callOptions({ helplines: [{ name: "KIRAN", contact: "1800-599-0019" }], campus_counsellor: "" });
    expect(numbers(result).at(-1)).toBe("1800-599-0019");
  });
});
