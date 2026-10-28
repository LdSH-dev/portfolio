import { About } from "@/components/about";
import { AskLeo } from "@/components/ask-leo";
import { ConsoleArt } from "@/components/console-art";
import { Cursor } from "@/components/cursor";
import { ExperienceList as Experience } from "@/components/experience-list";
import { Footer } from "@/components/footer";
import { GitHubActivity } from "@/components/github-activity";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { ProofStrip } from "@/components/proof-strip";
import { SpeedTest } from "@/components/speed-test";
import { Testimonials } from "@/components/testimonials";
import { ThemeToggle } from "@/components/theme-toggle";
import { VisitorConsent } from "@/components/visitor-consent";

export default function Home() {
  return (
    <>
      <Cursor />
      <Nav />
      <ThemeToggle />
      <VisitorConsent />
      <ConsoleArt />
      <main>
        <Hero />
        <ProofStrip />
        <About />
        <AskLeo />
        <Experience />
        <Testimonials />
        <GitHubActivity />
        <SpeedTest />
      </main>
      <Footer />
    </>
  );
}
