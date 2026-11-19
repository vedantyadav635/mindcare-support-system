import { Link } from "react-router-dom";
import { APP_NAME } from "../config";
import { SectionBlob } from "./ui";

/** App name with a small smiling circle. The name comes from src/config.js. */
export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-pill font-heading text-h3 font-extrabold text-ink-900">
      <SectionBlob shape="smile" color="brand" className="size-9" />
      {APP_NAME}
    </Link>
  );
}
