import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CirclePlay,
  HeartHandshake,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

const getSignUpUrl = (): string => {
  if (import.meta.env.VITE_WEB_URL) {
    return new URL("/sign-up", import.meta.env.VITE_WEB_URL).toString();
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3001/sign-up";
  }

  return "/sign-up";
};

const SIGN_UP_URL = getSignUpUrl();

const trustItems = [
  {
    description: "Your identity is never shared. Not even with us.",
    icon: LockKeyhole,
    theme: "green",
    title: "Private by default",
  },
  {
    description: "Licensed. Trusted. Compassionate.",
    icon: BadgeCheck,
    theme: "peach",
    title: "Verified professionals",
  },
  {
    description: "Your concerns are valid. We’re here to listen.",
    icon: HeartHandshake,
    theme: "lavender",
    title: "Judgment-free care",
  },
  {
    description: "Your conversations are private and secure.",
    icon: ShieldCheck,
    theme: "gold",
    title: "Secure & confidential",
  },
] as const;

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

const proofItems = [
  { label: "professional profiles", value: "5" },
  { label: "ways to connect", value: "3" },
  { label: "identity details shared", value: "0" },
  { label: "standard private session", value: "50 min" },
] as const;

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

const faqItems = [
  {
    answer:
      "Your public identity is not shown to the professional you speak with. Suwa is designed to keep the care experience separate from unnecessary identity details.",
    question: "Is Suwa really anonymous?",
  },
  {
    answer:
      "Each professional profile includes its specialty, approach, education, and verification details so you can choose with confidence.",
    question: "Who will I speak with?",
  },
  {
    answer:
      "Create your private account, choose the consultation you need, and select an available professional. The path is intentionally short and free of long intake forms.",
    question: "How quickly can I get started?",
  },
  {
    answer:
      "You can choose from chat, video, or in-person consultations when those options are available on a professional’s profile.",
    question: "How do consultations work?",
  },
] as const;

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <ProofBar />
        <ProblemSolution />
        <Services />
        <HowItWorks />
        <Testimonials />
        <Faq />
        <ClosingCallout />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <nav aria-label="Main navigation" className="site-nav page-shell">
        <a aria-label="Suwa home" className="wordmark" href="#top">
          Suwa
        </a>
        <div className="nav-links">
          <a className="active" href="#top">
            Home
          </a>
          <a href="#how-it-works">How it works</a>
          <a href="#why-suwa">Why Suwa</a>
          <a href="#stories">Stories</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="header-actions">
          <span className="header-privacy">
            <ShieldCheck aria-hidden="true" size={19} strokeWidth={1.7} />
            100% Anonymous
          </span>
          <a className="header-cta" href={SIGN_UP_URL}>
            Book privately
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero page-shell" id="top">
      <div className="hero-copy">
        <span className="hero-eyebrow">A private place to feel heard</span>
        <h1>
          Private health consultations with <em>licensed professionals.</em>
        </h1>
        <span aria-hidden="true" className="hero-flourish" />
        <p className="hero-subtitle">
          Ask questions, discuss symptoms, or get guidance without putting your
          identity on display.
          <br />
          Private by design. Human by nature.
        </p>
        <div className="hero-actions">
          <a className="primary-cta" href={SIGN_UP_URL}>
            <span>Book a private consultation</span>
            <span className="round-arrow">
              <ArrowRight aria-hidden="true" size={20} strokeWidth={1.7} />
            </span>
          </a>
          <a className="secondary-cta" href="#how-it-works">
            <span className="play-circle">
              <CirclePlay aria-hidden="true" size={23} strokeWidth={1.5} />
            </span>
            <span>See how it works</span>
          </a>
        </div>
        <div className="privacy-note">
          <ShieldCheck aria-hidden="true" size={19} strokeWidth={1.6} />
          <strong>Private by default</strong>
          <span aria-hidden="true" className="privacy-dot" />
          <span>No public profile. No judgment. No pressure.</span>
        </div>
      </div>
      <div aria-hidden="true" className="hero-art">
        <img
          alt=""
          fetchPriority="high"
          height={1024}
          src="/images/suwa-hero-watercolor.png"
          width={1536}
        />
      </div>
    </section>
  );
}

function ProofBar() {
  return (
    <section aria-label="Suwa by the numbers" className="proof-bar page-shell">
      {proofItems.map(({ label, value }) => (
        <div className="proof-item" key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

function ProblemSolution() {
  return (
    <section className="problem-solution page-shell" id="why-suwa">
      <div className="problem-copy">
        <span className="section-kicker">When asking for help feels hard</span>
        <h2>You should not have to trade your privacy for healthcare.</h2>
        <p>
          Fear of being judged, exposed, or misunderstood keeps too many people
          quiet. Suwa removes that weight, so the first step can feel like
          relief—not another risk.
        </p>
      </div>
      <div className="solution-card">
        <span>This is why Suwa feels different</span>
        <ul>
          <li>
            <Check aria-hidden="true" className="solution-check" size={17} />
            Stay anonymous while consulting a licensed professional
          </li>
          <li>
            <Check aria-hidden="true" className="solution-check" size={17} />
            Choose a verified professional who fits your needs
          </li>
          <li>
            <Check aria-hidden="true" className="solution-check" size={17} />
            Start without a long, intrusive intake process
          </li>
          <li>
            <Check aria-hidden="true" className="solution-check" size={17} />
            Speak in a calm, judgment-free environment
          </li>
        </ul>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section aria-label="Why Suwa is safe" className="trust-strip page-shell">
      {trustItems.map(({ description, icon: Icon, theme, title }) => (
        <article className="trust-item" key={title}>
          <span className={`trust-icon ${theme}`}>
            <Icon aria-hidden="true" size={27} strokeWidth={1.55} />
          </span>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function Services() {
  return (
    <section aria-label="Suwa services" className="services page-shell">
      <article className="service" id="consultations">
        <div className="service-copy">
          <span className="section-number">01</span>
          <h2>Consultations</h2>
          <p>
            Talk to verified health professionals about what matters to you.
          </p>
          <a className="text-link" href={SIGN_UP_URL}>
            Find your professional
            <ArrowRight
              aria-hidden="true"
              className="text-link-icon"
              size={18}
            />
          </a>
        </div>
        <section
          aria-label="Private consultation preview"
          className="consultation-visual"
        >
          <span className="mini-anonymous">
            <ShieldCheck aria-hidden="true" size={12} />
            Anonymous
          </span>
          <div className="consultation-card">
            <h3>
              Talk privately.
              <br />
              Feel understood.
            </h3>
            <a href={SIGN_UP_URL}>
              Book a private consultation
              <ChevronRight aria-hidden="true" size={15} />
            </a>
            <p>
              <ShieldCheck aria-hidden="true" size={13} />
              Your conversation is private and secure.
            </p>
          </div>
        </section>
      </article>

      <article className="service" id="library">
        <div className="service-copy">
          <span className="section-number">02</span>
          <h2>Health Library</h2>
          <p>Reliable information. Easy to understand. Always here for you.</p>
          <a className="text-link" href="#about">
            Explore Library
            <ArrowRight
              aria-hidden="true"
              className="text-link-icon"
              size={18}
            />
          </a>
        </div>
        <section aria-label="Health library preview" className="library-visual">
          <span className="mini-anonymous peach-label">
            <ShieldCheck aria-hidden="true" size={12} />
            Anonymous
          </span>
          <div aria-hidden="true" className="library-plant">
            <span />
            <span />
            <span />
            <span />
          </div>
          <h3>
            Knowledge
            <br />
            empowers
            <br />
            you.
          </h3>
          <form action="#library" className="library-search">
            <Search aria-hidden="true" size={14} />
            <label className="sr-only" htmlFor="library-query">
              Search health topics
            </label>
            <input
              id="library-query"
              name="query"
              placeholder="Search topics, conditions, guides..."
            />
            <button aria-label="Search library" type="submit">
              <Search aria-hidden="true" size={14} />
            </button>
          </form>
        </section>
      </article>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="page-shell">
        <div className="section-heading">
          <span>Start in under a minute</span>
          <h2>Getting help should feel easy.</h2>
          <p>
            No long forms. No confusing choices. Just a calm path to a
            professional who can help.
          </p>
        </div>
        <div className="steps-grid">
          {steps.map(({ description, icon: Icon, number, title }) => (
            <article className="step-card" key={number}>
              <span className="step-number">{number}</span>
              <Icon
                aria-hidden="true"
                className="step-card-icon"
                size={30}
                strokeWidth={1.35}
              />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="testimonials" id="stories">
      <div className="page-shell">
        <div className="section-heading">
          <span>The feeling Suwa is built for</span>
          <h2>“Finally. This feels safe.”</h2>
          <p>
            Private consultations give people room to ask honest questions and
            make informed decisions about their health.
          </p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map(({ context, quote }) => (
            <figure className="testimonial-card" key={context}>
              <span className="story-label">
                Illustrative consultation story
              </span>
              <blockquote>“{quote}”</blockquote>
              <figcaption>
                <span>Anonymous scenario</span>
                {context}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="faq page-shell" id="faq">
      <div className="faq-heading">
        <span className="section-kicker">Questions are welcome</span>
        <h2>Know what to expect.</h2>
        <p>
          Clear answers, because trust starts before the first conversation.
        </p>
      </div>
      <div className="faq-list">
        {faqItems.map(({ answer, question }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ClosingCallout() {
  return (
    <section className="closing-callout page-shell" id="about">
      <ShieldCheck aria-hidden="true" size={31} strokeWidth={1.3} />
      <p>Your first step can stay private</p>
      <h2>Feel lighter. Start anonymously.</h2>
      <a className="light-cta" href={SIGN_UP_URL}>
        Book a private consultation
        <ArrowRight aria-hidden="true" size={18} />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        <div>
          <a aria-label="Back to Suwa home" className="wordmark" href="#top">
            Suwa
          </a>
          <p>Private, compassionate healthcare—built around you.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-suwa">Why Suwa</a>
          <a href="#stories">Stories</a>
          <a href="#faq">FAQ</a>
        </nav>
        <p>© 2026 Suwa. Privacy is part of the care.</p>
      </div>
    </footer>
  );
}
