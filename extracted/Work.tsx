import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const projects = [
  {
    id: "01",
    name: "Video Authenticator & Uploader",
    category: "Backend / Django",
    tools: "Python, Django, HTML, CSS",
    description:
      "Secure backend system for video upload, authentication, and session management with file validation and storage handling.",
    image: "/images/placeholder.webp",
    link: "",
  },
  {
    id: "02",
    name: "ReadMate — Recommendation Platform",
    category: "Backend / REST APIs",
    tools: "Python, Django, REST APIs",
    description:
      "Backend services for a recommendation-based app. Implemented endpoints to serve recommendation logic and manage structured data flow.",
    image: "/images/placeholder.webp",
    link: "",
  },
  {
    id: "03",
    name: "PHARMACIA",
    category: "Full Stack / Django",
    tools: "Python, Django, HTML, JavaScript",
    description:
      "Pharmacy management system with inventory management, billing, prescription workflows, CRUD operations and authentication.",
    image: "/images/placeholder.webp",
    link: "",
  },
  {
    id: "04",
    name: "CI/CD Portfolio Website",
    category: "DevOps / Full Stack",
    tools: "Django, React.js, GitHub Actions, HTML, CSS, JS",
    description:
      "Portfolio with automated deployment pipelines via GitHub Actions CI/CD. Integrated frontend and backend for fullstack deployment.",
    image: "/images/placeholder.webp",
    link: "",
  },
];

const Work = () => {
  useGSAP(() => {
    let translateX: number = 0;

    function setTranslateX() {
      const box = document.getElementsByClassName("work-box");
      const rectLeft = document
        .querySelector(".work-container")!
        .getBoundingClientRect().left;
      const rect = box[0].getBoundingClientRect();
      const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
      let padding: number =
        parseInt(window.getComputedStyle(box[0]).padding) / 2;
      translateX =
        rect.width * box.length - (rectLeft + parentWidth) + padding;
    }

    setTranslateX();

    let timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: `+=${translateX}`,
        scrub: true,
        pin: true,
        id: "work",
      },
    });

    timeline.to(".work-flex", {
      x: -translateX,
      ease: "none",
    });

    return () => {
      timeline.kill();
      ScrollTrigger.getById("work")?.kill();
    };
  }, []);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {projects.map((project, index) => (
            <div className="work-box" key={index}>
              <div className="work-info">
                <div className="work-title">
                  <h3>{project.id}</h3>
                  <div>
                    <h4>{project.name}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.tools}</p>
                <p className="work-description">{project.description}</p>
              </div>
              <WorkImage
                image={project.image}
                alt={project.name}
                link={project.link || undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
