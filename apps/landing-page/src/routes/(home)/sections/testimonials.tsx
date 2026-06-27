import { Appear } from "../animations/appear";
import { StoryLabel } from "../helpers/typography";

const testimonials = [
  {
    context: "First step",
    quote:
      "I could finally reach out without the panic of being seen or judged.",
  },
  {
    context: "Right doctor, faster",
    quote:
      "Clear doctor profiles made it easy to trust who I was booking with.",
  },
  {
    context: "Continued care",
    quote:
      "Anonymous booking lowered the barrier, so care actually kept moving.",
  },
] as const;

export function Testimonials() {
  return (
    <Appear>
      <section
        className="pt-[105px] pb-[112px] max-xl:pt-[75px] max-xl:pb-[82px]"
        id="stories"
      >
        <div className="page-shell">
          <div className="mx-auto mb-[47px] max-w-[620px] text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-[rgb(255_253_248_/_82%)] px-[12px] py-[6px] font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
              The outcome Suwa is built for
            </span>
            <h2 className="mt-[14px] mb-[13px] font-normal font-serif text-[clamp(38px,4vw,54px)] leading-[1.08] tracking-[-0.04em]">
              "Care starts sooner when privacy comes first."
            </h2>
            <p className="m-0 text-[14px] text-foreground-muted leading-[1.75]">
              Suwa removes the awkward first step, so people can start privately
              and move into trusted care with confidence.
            </p>
          </div>
          <div className="mx-auto flex max-w-[1100px] flex-wrap justify-center gap-[18px] max-xl:max-w-[410px] max-xl:gap-[12px]">
            {testimonials.map(({ context, quote }) => (
              <figure
                className="m-0 min-h-[250px] w-full max-w-[360px] rounded-[22px] border border-border bg-[linear-gradient(180deg,rgb(255_253_248_/_92%),rgb(255_253_248_/_72%))] p-[32px] shadow-[0_18px_50px_rgb(25_17_6_/_5%)] max-xl:p-[26px]"
                key={context}
              >
                <StoryLabel>Outcome snapshot</StoryLabel>
                <blockquote className="mx-0 my-[26px] mb-[30px] font-serif text-[20px] leading-[1.45] text-foreground">
                  "{quote}"
                </blockquote>
                <figcaption className="flex flex-col gap-[4px] text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                  <span className="font-medium text-[10px] text-foreground normal-case">
                    Anonymous care journey
                  </span>
                  {context}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </Appear>
  );
}
