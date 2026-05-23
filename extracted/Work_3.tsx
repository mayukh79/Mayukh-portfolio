import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * Horizontal scroll fix
 * ─────────────────────
 * The Work section pins itself and translates .work-flex left as you scroll
 * down — giving the feel of horizontal scrolling while the page scrolls
 * vertically. Without ScrollSmoother the original had three bugs:
 *
 *   1. `end` was a static px value computed before layout settled → wrong pin
 *   2. Missing `anticipatePin:1` → visible jump when the pin engaged
 *   3. Missing `invalidateOnRefresh:true` → broke on window resize
 *
 * Fix: use arrow functions for `end` and the tween's `x` so ScrollTrigger
 * re-measures on every refresh. Add `anticipatePin` and `invalidateOnRefresh`.
 * Wrap in `gsap.matchMedia` so mobile gets normal vertical flow, no pin.
 */

function getScrollWidth(): number {
  const boxes = document.getElementsByClassName("work-box");
  if (!boxes.length) return 0;
  const containerLeft = document
    .querySelector(".work-container")!
    .getBoundingClientRect().left;
  const box = boxes[0];
  const boxWidth = box.getBoundingClientRect().width;
  const parentWidth = box.parentElement!.getBoundingClientRect().width;
  const padding = parseInt(window.getComputedStyle(box).padding) / 2;
  return boxWidth * boxes.length - (containerLeft + parentWidth) + padding;
}

const Work = () => {
  useGSAP(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ── Desktop: pinned horizontal scroll ─────────────────────────────
      mm.add("(min-width: 1025px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".work-section",
            start: "top top",
            end: () => `+=${getScrollWidth()}`,   // re-evaluated on refresh
            scrub: 1,
            pin: true,
            anticipatePin: 1,           // eliminates jump on pin engage
            invalidateOnRefresh: true,  // re-measures after resize
            id: "work",
          },
        });

        tl.to(".work-flex", {
          x: () => -getScrollWidth(),   // re-evaluated on refresh
          ease: "none",
        });

        return () => {
          tl.kill();
          ScrollTrigger.getById("work")?.kill();
        };
      });

      // ── Mobile: reset any leftover transform, normal flow ─────────────
      mm.add("(max-width: 1024px)", () => {
        gsap.set(".work-flex", { x: 0 });
        ScrollTrigger.getById("work")?.kill();
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {[...Array(6)].map((_value, index) => (
            <div className="work-box" key={index}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>
                  <div>
                    <h4>Project Name</h4>
                    <p>Category</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>Javascript, TypeScript, React, Threejs</p>
              </div>
              <WorkImage image="/images/placeholder.webp" alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
