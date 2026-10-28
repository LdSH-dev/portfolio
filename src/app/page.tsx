import { AskLeo } from "@/components/ask-leo";
import { Cursor } from "@/components/cursor";
import { ExperienceList as Experience } from "@/components/experience-list";
import { Footer } from "@/components/footer";
import { GitHubActivity } from "@/components/github-activity";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { ProofStrip } from "@/components/proof-strip";
import { SpeedTest } from "@/components/speed-test";
import { Testimonials } from "@/components/testimonials";

export default function Home() {
  return (
    <>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <ProofStrip />
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
