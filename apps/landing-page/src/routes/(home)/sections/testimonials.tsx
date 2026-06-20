import { StoryLabel } from "../helpers/typography";

const testimonials = [
  {
    context: "General consultation",
    quote:
      "I could finally ask for help without worrying who would know. That made starting feel possible.",
  },
  {
    context: "First consultation",
    quote:
      "Nothing felt clinical or rushed. I felt heard before I ever had to explain everything.",
  },
  {
    context: "Follow-up consultation",
    quote:
      "The privacy gave me room to be honest. It felt like the first session I did not have to perform in.",
  },
] as const;

export function Testimonials() {
  return (
    <section
      className="pt-[105px] pb-[112px] max-landing-md:pt-[75px] max-landing-md:pb-[82px]"
      id="stories"
    >
      <div className="page-shell">
        <div className="mx-auto mb-[47px] max-w-[620px] text-center">
          <span className="block font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
            The feeling Suwa is built for
          </span>
          <h2 className="mt-[11px] mb-[13px] font-normal font-serif text-[clamp(38px,4vw,54px)] leading-[1.08] tracking-[-0.04em]">
            "Finally. This feels safe."
          </h2>
          <p className="m-0 text-[14px] text-foreground-muted leading-[1.75]">
            Private consultations give people room to ask honest questions and
            make informed decisions about their health.
          </p>
        </div>
        <div className="mx-auto grid max-w-[1100px] grid-cols-3 gap-[18px] max-landing-md:max-w-[410px] max-landing-md:grid-cols-1 max-landing-lg:gap-[12px]">
          {testimonials.map(({ context, quote }) => (
            <figure
              className="m-0 min-h-[250px] rounded-[22px] border border-border bg-[rgb(255_253_248_/_72%)] p-[32px] max-landing-lg:p-[26px]"
              key={context}
            >
              <StoryLabel>Illustrative consultation story</StoryLabel>
              <blockquote className="mx-0 my-[26px] mb-[30px] font-serif text-[20px] leading-[1.45]">
                "{quote}"
              </blockquote>
              <figcaption className="flex flex-col gap-[4px] text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                <span className="font-medium text-[10px] text-foreground normal-case">
                  Anonymous scenario
                </span>
                {context}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
