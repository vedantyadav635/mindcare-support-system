/**
 * The numbers to show on crisis screens: our fixed helplines (config.js) merged with anything the
 * backend sent in a crisis_response (extra helplines and the campus counsellor contact).
 */
import { HELPLINES } from "../../config";
import { digitsOf, phoneNumbers } from "../../utils/format";

const CAMPUS_MIN_DIGITS = 8; // real phone numbers only, so "Room 101" never becomes a call button

/**
 * callOptions(crisisResponse) -> { options: [{ id, label, number, note }], campusText }
 *   options:    every number to call, fixed ones first, no duplicates
 *   campusText: the campus contact as text when it has no phone number in it (e.g. "Room 101, Block A")
 */
export function callOptions(crisisResponse) {
  const options = [...HELPLINES];
  const known = new Set(options.map((o) => digitsOf(o.number)));
  const add = (option) => {
    if (known.has(digitsOf(option.number))) return;
    known.add(digitsOf(option.number));
    options.push(option);
  };

  for (const line of crisisResponse?.helplines ?? []) {
    for (const number of phoneNumbers(line.contact)) {
      add({ id: `backend-${digitsOf(number)}`, label: line.name, number, note: "" });
    }
  }

  const campus = crisisResponse?.campus_counsellor?.trim() || null;
  const campusNumbers = campus ? phoneNumbers(campus, CAMPUS_MIN_DIGITS) : [];
  for (const number of campusNumbers) {
    add({ id: `campus-${digitsOf(number)}`, label: "Campus counsellor", number, note: campus });
  }

  return { options, campusText: campus && campusNumbers.length === 0 ? campus : null };
}
