/** Soft orange hero on the student home: today's check-in status and one big button. */
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, SectionBlob } from "../ui";

export default function HomeHero({ done }) {
  return (
    <Card tint="peach" className="relative overflow-hidden rounded-xl">
      <SectionBlob shape="blob" color="sun" float className="absolute -right-12 -top-12 size-52 opacity-60" />
      <SectionBlob shape="star" color="lilac" className="absolute bottom-6 right-1/3 size-8" />
      <SectionBlob shape="arc" color="mint" className="absolute -bottom-4 right-8 size-24" />
      <SectionBlob shape="smile" color="orange" float className="absolute right-6 top-1/2 hidden size-24 -translate-y-1/2 sm:block md:right-14 md:size-32" />

      <div className="relative max-w-md">
        {done ? (
          <Badge status="success"><Check aria-hidden="true" className="size-3.5" /> Checked in today</Badge>
        ) : (
          <Badge status="brand">Not checked in yet</Badge>
        )}
        <h1 className="mt-4 text-display-sm md:text-h1">{done ? "Nice work. You checked in today." : "How are you today?"}</h1>
        <p className="mt-3 text-ink-900">
          {done ? "Want to change an answer? You can update it any time today." : "A one-minute check-in helps you notice your patterns."}
        </p>
        <Button as={Link} to="/app/checkin" variant={done ? "secondary" : "primary"} size="lg" className="mt-6">
          {done ? "Edit today's check-in" : "Check in now"}
        </Button>
      </div>
    </Card>
  );
}
