/** Landing hero picture: a smiling orange circle with stars and arcs around it (all simple original SVG shapes). */
import { SectionBlob } from "./ui";

export default function HeroIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-md">
      <SectionBlob shape="blob" color="sun" float className="absolute inset-0 opacity-70" />
      <SectionBlob shape="ring" color="lilac" className="absolute -left-4 bottom-6 size-32 opacity-80" />
      <SectionBlob shape="arc" color="mint" className="absolute left-4 top-2 size-28" />
      <SectionBlob shape="arc" color="blush" className="absolute -right-2 bottom-20 size-24 rotate-180" />
      <SectionBlob shape="smile" color="orange" float className="absolute inset-[24%] drop-shadow-lg" />
      <SectionBlob shape="star" color="sky" className="absolute right-8 top-6 size-14" />
      <SectionBlob shape="star" color="lilac" className="absolute left-10 top-1/2 size-8" />
      <SectionBlob shape="star" color="sun" className="absolute bottom-2 right-1/4 size-10" />
      <SectionBlob shape="circle" color="blush" className="absolute right-4 top-1/2 size-6" />
      <SectionBlob shape="circle" color="sky" className="absolute bottom-10 left-1/3 size-5" />
    </div>
  );
}
