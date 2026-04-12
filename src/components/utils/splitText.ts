import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


interface SplitResult {
  words: HTMLElement[];
  chars: HTMLElement[];
  revert: () => void;
}

function splitElement(el: HTMLElement, type: "words" | "chars"): SplitResult {
  const original = el.innerHTML;
  const text = el.innerText;

  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];

  if (type === "words") {
    // Wrap each word
    el.innerHTML = text
      .split(" ")
      .map((w) => `<span class="sw" style="display:inline-block;overflow:hidden"><span class="sw-inner" style="display:inline-block">${w}</span></span>`)
      .join(" ");

    el.querySelectorAll<HTMLElement>(".sw-inner").forEach((span) =>
      words.push(span)
    );
  } else {
    // Wrap each char
    el.innerHTML = text
      .split("")
      .map((c) =>
        c === " "
          ? " "
          : `<span class="sc" style="display:inline-block;overflow:hidden"><span class="sc-inner" style="display:inline-block">${c}</span></span>`
      )
      .join("");

    el.querySelectorAll<HTMLElement>(".sc-inner").forEach((span) =>
      chars.push(span)
    );
  }

  return {
    words,
    chars,
    revert: () => {
      el.innerHTML = original;
    },
  };
}



interface ParaEl extends HTMLElement {
  _anim?: gsap.core.Animation;
  _split?: SplitResult;
}

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.innerWidth < 900) return;

  const paras = document.querySelectorAll<ParaEl>(".para");
  const titles = document.querySelectorAll<ParaEl>(".title");

  const triggerStart = window.innerWidth <= 1024 ? "top 60%" : "20% 60%";
  const toggleActions = "play pause resume reverse";

  paras.forEach((para) => {
    para.classList.add("visible");

    // Kill previous animation and revert split
    if (para._anim) {
      para._anim.progress(1).kill();
      para._split?.revert();
    }

    para._split = splitElement(para, "words");

    para._anim = gsap.fromTo(
      para._split.words,
      { autoAlpha: 0, y: 80 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: para.parentElement?.parentElement,
          toggleActions,
          start: triggerStart,
        },
        duration: 1,
        ease: "power3.out",
        y: 0,
        stagger: 0.02,
      }
    );
  });

  titles.forEach((title) => {
    if (title._anim) {
      title._anim.progress(1).kill();
      title._split?.revert();
    }

    title._split = splitElement(title, "chars");

    title._anim = gsap.fromTo(
      title._split.chars,
      { autoAlpha: 0, y: 80, rotate: 10 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: title.parentElement?.parentElement,
          toggleActions,
          start: triggerStart,
        },
        duration: 0.8,
        ease: "power2.inOut",
        y: 0,
        rotate: 0,
        stagger: 0.03,
      }
    );
  });

  ScrollTrigger.addEventListener("refresh", () => setSplitText());
}
