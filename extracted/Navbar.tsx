import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import "./styles/Navbar.css";

/*
 * Step 10 replacement: removed gsap-trial/ScrollSmoother entirely.
 *
 * ScrollSmoother is a Club GSAP plugin — it cannot be used in production
 * without a paid licence. Replaced with:
 *   - CSS `scroll-behavior: smooth` (already in index.css)
 *   - Native scrollIntoView() for nav link clicks
 *   - Standard gsap/ScrollTrigger (free) for all scroll animations
 *
 * The `smoother` export is kept as a no-op shim so other files that import
 * it (initialFX.ts) won't crash during migration.
 */

gsap.registerPlugin(ScrollTrigger);

// Shim: keeps the import in initialFX.ts from crashing.
// Callers use smoother.paused() and smoother.scrollTop() only.
export const smoother = {
  paused: (_v: boolean) => {},
  scrollTop: (_v: number) => {
    window.scrollTo({ top: _v, behavior: "smooth" });
  },
  scrollTo: (_target: string, _smooth: boolean, _pos: string) => {
    const el = document.querySelector(_target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  },
};

const Navbar = () => {
  useEffect(() => {
    // Smooth-scroll nav links via native scrollIntoView
    const links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const section = element.getAttribute("data-href");
        if (section) {
          const target = document.querySelector(section);
          if (target)
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Refresh ScrollTrigger on resize
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          Mayukh
        </a>
        <a
          href="mailto:mayukhsrivastav8315@gmail.com"
          className="navbar-connect"
          data-cursor="disable"
        >
          mayukhsrivastav8315@gmail.com
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
