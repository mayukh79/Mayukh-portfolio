import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

// ── Replace these hrefs with your real profile URLs ──────────────────────────
const GITHUB_URL = "https://github.com/mayukh79";
const LINKEDIN_URL = "https://www.linkedin.com/in/mayukh-srivastava-b6025233b";
// ─────────────────────────────────────────────────────────────────────────────

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">

          {/* Email + Phone */}
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href="mailto:mayukhsrivastav8315@gmail.com" data-cursor="disable">
                mayukhsrivastav8315@gmail.com
              </a>
            </p>
            <h4>Phone</h4>
            <p>
              <a href="tel:+919628855577" data-cursor="disable">
                +91 96288 55577
              </a>
            </p>
          </div>

          {/* Social links — add more or remove as needed */}
          <div className="contact-box">
            <h4>Social</h4>
            <a
              href={GITHUB_URL}
              target="_blank"
              data-cursor="disable"
              className="contact-social"
            >
              Github <MdArrowOutward />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              data-cursor="disable"
              className="contact-social"
            >
              LinkedIn <MdArrowOutward />
            </a>
          </div>

          {/* Credit */}
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by{" "}
              <span>Mayukh Srivastava</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
            </h5>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
