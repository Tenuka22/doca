import { Navbar } from "./helpers/navbar";
import { ClosingCallout } from "./sections/closing-callout";
import { Faq } from "./sections/faq";
import { Footer } from "./sections/footer";
import { Hero } from "./sections/hero";
import { HowItWorks } from "./sections/how-it-works";
import { ProblemSolution } from "./sections/problem-solution";
import { ProofBar } from "./sections/proof-bar";
import { Services } from "./sections/services";
import { Testimonials } from "./sections/testimonials";
import { TrustStrip } from "./sections/trust-strip";

export function LandingPage() {
  return (
    <div className="overflow-hidden bg-background">
      <Navbar />
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
