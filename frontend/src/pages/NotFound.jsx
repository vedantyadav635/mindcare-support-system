/** Friendly 404. Sends logged-in users back to their own home. */
import { Link } from "react-router-dom";
import { Button, SectionBlob } from "../components/ui";
import { ROLE_HOME } from "../config";
import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { user } = useAuth();
  return (
    <main id="main" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <SectionBlob shape="ring" color="sky" float className="absolute -left-10 top-10 size-40 opacity-70" />
      <SectionBlob shape="star" color="sun" className="absolute bottom-16 right-10 size-12" />
      <SectionBlob shape="smile" color="lilac" float className="mb-8 size-28" />
      <p className="font-heading text-h2 font-extrabold text-ink-900">404</p>
      <h1 className="mt-2">This page wandered off</h1>
      <p className="mt-3 max-w-md text-ink-700">The page you are looking for doesn't exist. Let's get you back somewhere calm.</p>
      <Button as={Link} to={user ? ROLE_HOME[user.role] : "/"} className="mt-8">
        {user ? "Back to my home" : "Back to the start"}
      </Button>
    </main>
  );
}
