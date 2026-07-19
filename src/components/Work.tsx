import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);


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
const projects = [
  {
    id: "01",
    title: "Job-Parakh",
    description: "Intelligent job scam detection platform",
    tools: "Django • React • Python • SQLite • DRF",
    image: "/images/job parakh thumbnail.png",
    link: "https://job-parakh.vercel.app",
  },
  {
    id: "02",
    title: "Portfolio Website",
    description: "This portfolio website showcases my work and projects",
    tools: "React, TypeScript, Three.js, GSAP,CSS3",
    image: "/images/portfolio-preview.png",
    link: "",
  },
  {
    id: "03",
    title: "ReadMate",
    description: "AI-powered book recommendation chatbot",
    tools: "Python • IBM Watson • Flask • HTML • CSS",
    image: "/images/readmate-thumbnail.png",
    link: "https://github.com/mayukh79/Readmate",
  },
  
];

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
          <div className="work-flex">
  {projects.map((project) => (
    <div className="work-box" key={project.id}>
      <div className="work-info">
        <div className="work-title">
          <h3>{project.id}</h3>

          <div>
            <h4>{project.title}</h4>
            <p>{project.description}</p>
          </div>
        </div>

        <h4>Tools & Features</h4>
        <p>{project.tools}</p>

        <a
          href={project.link}
          target="_blank"
          rel="noreferrer"
          className="work-live"
        >
          Live Demo →
        </a>
      </div>

      <WorkImage
        image={project.image}
        alt={project.title}
      />
    </div>
  ))}
</div>
        </div>
      </div>
    </div>
  );
};

export default Work;
