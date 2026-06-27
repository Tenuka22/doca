import { Check } from "lucide-react";
import { Appear } from "../animations/appear";
import { SectionKicker } from "../helpers/section-heading";
import { H2 } from "../helpers/typography";

export function ProblemSolution() {
  return (
    <Appear>
      <section
        className="page-shell grid max-w-[1120px] grid-cols-[1.08fr_0.92fr] items-center gap-[100px] pt-[105px] pb-[90px] max-md:grid-cols-1 max-md:items-start max-md:gap-[28px] max-md:pt-[78px] max-md:pb-[72px] max-md:[&>div]:w-full"
        id="why-suwa"
      >
        <div className="problem-copy max-md:max-w-none">
          <SectionKicker>The stigma Suwa removes</SectionKicker>
          <H2>
            Many people delay care because being seen asking for help feels too
            risky.
          </H2>
          <p className="m-0 text-[13px] text-foreground-muted leading-[1.8]">
            Suwa gives them a quieter first step: anonymous online consultation
            with doctors, supported by hospital and clinic workflows in the
            background.
          </p>
        </div>
        <div className="rounded-[22px] border border-border bg-[radial-gradient(circle_at_100%_0,rgb(239_213_185_/_35%),transparent_38%),rgb(255_253_248_/_74%)] px-[36px] py-[34px] shadow-[0_16px_44px_rgb(50_69_61_/_5%)] max-md:px-[22px] max-md:py-[24px] max-md:max-w-none">
          <span className="block font-serif text-[22px] max-md:text-[19px]">
            Why anonymous care feels different
          </span>
          <ul className="mt-[25px] mb-0 grid list-none gap-[17px] p-0 max-md:mt-[18px] max-md:gap-[13px]">
            {[
              "Start a conversation without public exposure",
              "Choose chat, video, or in-person care when ready",
              "Connect with doctors through structured, private sessions",
              "Hospitals and clinics support trust, safety, and continuity",
            ].map((text) => (
              <li
                className="grid grid-cols-[25px_1fr] items-start gap-4 text-[12px] text-foreground-secondary leading-[1.55] max-md:grid-cols-[22px_1fr] max-md:gap-[10px] max-md:text-[11px]"
                key={text}
              >
                <span className="box-content rounded-full bg-[#426156] p-[3px] text-white">
                  <Check aria-hidden="true" size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Appear>
  );
}
