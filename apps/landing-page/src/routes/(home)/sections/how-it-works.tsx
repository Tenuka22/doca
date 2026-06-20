import { ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { SectionHeading } from "../helpers/section-heading";

const steps = [
  {
    description: "Choose the kind of consultation that fits your needs.",
    icon: Sparkles,
    number: "01",
    title: "Tell us what you need",
  },
  {
    description: "Connect with a licensed professional who understands.",
    icon: Stethoscope,
    number: "02",
    title: "Meet your match",
  },
  {
    description: "Talk openly, with privacy built into every interaction.",
    icon: ShieldCheck,
    number: "03",
    title: "Begin privately",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      className="bg-background-subtle pt-[92px] pb-[100px] max-landing-md:pt-[72px]"
      id="how-it-works"
    >
      <div className="page-shell">
        <SectionHeading
          description="No long forms. No confusing choices. Just a calm path to a professional who can help."
          eyebrow="Start in under a minute"
          title="Getting help should feel easy."
        />
        <div className="mx-auto grid max-w-[1000px] grid-cols-3 gap-[18px] max-landing-md:max-w-[410px] max-landing-md:grid-cols-1 max-landing-lg:gap-[12px]">
          {steps.map(({ description, icon: Icon, number, title }) => (
            <article
              className="relative min-h-[250px] overflow-hidden rounded-[24px] border border-[rgb(225_224_210_/_80%)] bg-[rgb(255_253_248_/_75%)] p-[36px] max-landing-lg:p-[26px]"
              key={number}
            >
              <span className="absolute top-[24px] right-[26px] font-serif text-[57px] text-[rgb(45_69_61_/_11%)] leading-none">
                {number}
              </span>
              <Icon
                aria-hidden="true"
                className="mt-[25px] mb-[18px] text-accent"
                size={30}
                strokeWidth={1.35}
              />
              <h3 className="m-0 mb-[9px] font-normal font-serif text-[23px]">
                {title}
              </h3>
              <p className="m-0 text-[12px] text-foreground-muted leading-[1.7]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
