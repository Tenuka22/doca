import { ArrowRight, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { SectionNumber, TextLink } from "../helpers/section-heading";
import { SIGN_UP_URL } from "../helpers/sign-up-url";

export function Services() {
  return (
    <section
      aria-label="Suwa services"
      className="page-shell grid max-w-[1335px] grid-cols-2 gap-[62px] border-border border-t pt-[48px] pb-[95px] max-landing-lg:grid-cols-1 max-landing-lg:gap-[46px] max-landing-xl:gap-[36px] max-landing-md:pt-[50px] max-landing-md:pb-[70px]"
    >
      <article
        className="grid min-w-0 grid-cols-[220px_1fr] items-center gap-[38px] max-landing-lg:grid-cols-[240px_1fr] max-landing-md:grid-cols-1 max-landing-xl:grid-cols-[180px_1fr] max-landing-md:gap-[25px] max-landing-xl:gap-[24px]"
        id="consultations"
      >
        <div className="self-center max-landing-md:max-w-[300px]">
          <SectionNumber>01</SectionNumber>
          <h2 className="m-0 mb-[12px] font-normal font-serif text-[25px] tracking-[-0.03em]">
            Consultations
          </h2>
          <p className="m-0 text-[#31423d] text-[13px] leading-[1.65]">
            Talk to verified health professionals about what matters to you.
          </p>
          <TextLink href={SIGN_UP_URL}>
            Find your professional
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-160 ease-default group-hover:translate-x-1"
              size={18}
            />
          </TextLink>
        </div>
        <section
          aria-label="Private consultation preview"
          className="relative h-[242px] overflow-hidden rounded-[15px] border border-[rgb(225_218_208_/_72%)] bg-[linear-gradient(38deg,transparent_44%,rgb(242_208_174_/_70%)_45%_63%,transparent_64%)_100%_0_/_74%_85%_no-repeat,linear-gradient(134deg,rgb(218_227_215_/_74%),transparent_43%),#f8f5ed] shadow-[0_5px_18px_rgb(57_67_61_/_7%)] before:absolute before:-top-[106px] before:right-[35px] before:size-[210px] before:rounded-full before:border before:border-[rgb(195_168_135_/_30%)] before:content-[''] after:absolute after:-top-[74px] after:right-[5px] after:size-[210px] after:rounded-full after:border after:border-[rgb(195_168_135_/_30%)] after:content-[''] max-landing-lg:h-[280px] max-landing-md:h-[250px]"
        >
          <span className="absolute top-[13px] right-[16px] z-[2] flex items-center gap-[5px] rounded-full bg-[rgb(240_240_227_/_84%)] px-[11px] py-[6px] text-[8px]">
            <ShieldCheck aria-hidden="true" size={12} />
            Anonymous
          </span>
          <div className="absolute right-[37px] -bottom-[22px] z-[3] min-h-[188px] w-[258px] rounded-[15px] border border-[rgb(228_222_212_/_82%)] bg-[rgb(255_253_248_/_88%)] p-[20px] shadow-[0_8px_20px_rgb(62_69_64_/_10%)] backdrop-blur-[8px] max-landing-md:right-[18px] max-landing-xl:right-[18px] max-landing-md:w-[min(258px,calc(100%-36px))]">
            <h3 className="m-0 font-normal font-serif text-[24px] leading-[1.05] tracking-[-0.035em]">
              Talk privately.
              <br />
              Feel understood.
            </h3>
            <a
              className="mt-[20px] flex h-[36px] items-center justify-between rounded-full bg-[#426156] px-[22px] pr-[7px] pl-[22px] text-[9px] text-white"
              href={SIGN_UP_URL}
            >
              Book a private consultation
              <span className="box-content rounded-full bg-white p-[5px] text-foreground">
                <ChevronRight aria-hidden="true" size={15} />
              </span>
            </a>
            <p className="mx-0 mt-[8px] mb-0 flex items-center gap-[7px] text-[8px]">
              <ShieldCheck aria-hidden="true" size={13} />
              Your conversation is private and secure.
            </p>
          </div>
        </section>
      </article>

      <article
        className="grid min-w-0 grid-cols-[220px_1fr] items-center gap-[38px] max-landing-lg:grid-cols-[240px_1fr] max-landing-md:grid-cols-1 max-landing-xl:grid-cols-[180px_1fr] max-landing-md:gap-[25px] max-landing-xl:gap-[24px]"
        id="library"
      >
        <div className="self-center max-landing-md:max-w-[300px]">
          <SectionNumber>02</SectionNumber>
          <h2 className="m-0 mb-[12px] font-normal font-serif text-[25px] tracking-[-0.03em]">
            Health Library
          </h2>
          <p className="m-0 text-[#31423d] text-[13px] leading-[1.65]">
            Reliable information. Easy to understand. Always here for you.
          </p>
          <TextLink href="#about">
            Explore Library
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-160 ease-default group-hover:translate-x-1"
              size={18}
            />
          </TextLink>
        </div>
        <section
          aria-label="Health library preview"
          className="relative h-[242px] overflow-hidden rounded-[15px] border border-[rgb(225_218_208_/_72%)] bg-[radial-gradient(ellipse_at_97%_62%,#ead0b6_0_26%,transparent_26.5%),radial-gradient(ellipse_at_78%_100%,rgb(223_207_187_/_70%)_0_24%,transparent_24.5%),linear-gradient(134deg,#fffdf8,#f5f0e7)] px-[24px] pt-[62px] pb-[22px] shadow-[0_5px_18px_rgb(57_67_61_/_7%)] max-landing-lg:h-[280px] max-landing-md:h-[250px]"
        >
          <span className="absolute top-[13px] right-[16px] z-[2] flex items-center gap-[5px] rounded-full bg-[rgb(253_237_220_/_82%)] px-[11px] py-[6px] text-[#a96940] text-[8px]">
            <ShieldCheck aria-hidden="true" size={12} />
            Anonymous
          </span>
          <div
            aria-hidden="true"
            className="absolute top-[27px] right-[57px] z-[1] h-[92px] w-[2px] -rotate-[7deg] bg-[#426156]"
          >
            {[12, 31, 52, 70].map((top) => (
              <span
                className="absolute h-[13px] w-[33px] origin-[0_50%] rounded-[100%_0] bg-[#426156]"
                key={top}
                style={getLeafStyle(top)}
              />
            ))}
          </div>
          <h3 className="relative z-[2] m-0 font-normal font-serif text-[24px] leading-[1.05] tracking-[-0.035em]">
            Knowledge
            <br />
            empowers
            <br />
            you.
          </h3>
          <form
            action="#library"
            className="absolute right-[27px] bottom-[28px] left-[23px] grid h-[38px] grid-cols-[17px_1fr_20px] items-center gap-[6px] rounded-full border border-[#eee8df] bg-[rgb(255_255_255_/_92%)] px-[12px] pr-[10px] pl-[12px] text-[#66736d] shadow-[0_6px_16px_rgb(56_64_59_/_7%)]"
          >
            <Search aria-hidden="true" size={14} />
            <input
              className="sr-only min-w-0 border-0 bg-transparent p-0 text-[8px] text-foreground outline-none"
              id="library-query"
              name="query"
              placeholder="Search topics, conditions, guides..."
            />
            <button
              aria-label="Search library"
              className="grid cursor-pointer place-items-center border-0 bg-transparent p-0 text-foreground"
              type="submit"
            >
              <Search aria-hidden="true" size={14} />
            </button>
          </form>
        </section>
      </article>
    </section>
  );
}

function getLeafStyle(top: number) {
  if (top < 40) {
    return { top: `${top}px`, left: "0", transform: "rotate(-38deg)" };
  }
  if (top < 50) {
    return { top: `${top}px`, left: "1px", transform: "rotate(200deg)" };
  }
  if (top < 65) {
    return {
      top: `${top}px`,
      left: "0",
      transform: "rotate(-30deg) scale(0.9)",
    };
  }
  return {
    top: `${top}px`,
    left: "1px",
    transform: "rotate(195deg) scale(0.8)",
  };
}
