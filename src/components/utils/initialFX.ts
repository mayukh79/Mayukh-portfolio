import gsap from "gsap";
import { smoother } from "../Navbar";


function splitChars(selector: string | string[]): HTMLElement[] {
  const selectors = Array.isArray(selector) ? selector : [selector];
  const allChars: HTMLElement[] = [];

  selectors.forEach((sel) => {
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (el.dataset.splitted) {
        el.querySelectorAll<HTMLElement>(".split-char-inner").forEach((s) => {
          gsap.killTweensOf(s);
          allChars.push(s);
        });
        return;
      }
      el.dataset.splitted = "true";

      // Recreate split logic but respect spaces cleanly
      const text = el.innerText.trim();
      el.innerHTML = text
        .split("")
        .map((c) => {
          if (c === " ") return " ";
          if (c === "\n") return "<br/>";
          return `<span class="split-char" style="display:inline-block;overflow:hidden"><span class="split-char-inner" style="display:inline-block">${c}</span></span>`;
        })
        .join("");

      el.querySelectorAll<HTMLElement>(".split-char-inner").forEach((s) => {
        gsap.killTweensOf(s);
        allChars.push(s);
      });
    });
  });

  return allChars;
}


export function initialFX() {
  document.body.style.overflow = "auto";
  document.documentElement.style.overflow = "auto";
  document.documentElement.style.overflowX = "auto";
  document.body.style.overflowX = "auto";
  smoother.paused();

  const mainEl = document.getElementsByTagName("main")[0];
  if (mainEl) mainEl.classList.add("main-active");

  gsap.to("body", { backgroundColor: "#0b080c", duration: 0.5, delay: 1 });

  // ── Landing intro chars ──────────────────────────────────────────────────
  const landingChars = splitChars([
    ".landing-info h3",
    ".landing-intro h2",
    ".landing-intro h1",
  ]);

  gsap.fromTo(
    landingChars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  const h2InfoChars = splitChars(".landing-h2-info");
  gsap.fromTo(
    h2InfoChars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    { opacity: 1, duration: 1.2, ease: "power1.inOut", y: 0, delay: 0.8 }
  );

  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: "power1.inOut", delay: 0.1 }
  );

}