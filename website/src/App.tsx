import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { FAQ } from "./components/FAQ";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { useReveal } from "./hooks/useReveal";

export default function App() {
  const rootRef = useReveal<HTMLDivElement>();

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
