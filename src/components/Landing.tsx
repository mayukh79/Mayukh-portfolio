import { PropsWithChildren } from "react";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              MAYUKH
              <br />
              <span>SRIVASTAVA</span>
            </h1>
          </div>
          <div className="landing-info">
            <h2 className="landing-info-h2">Backend developer</h2>
            <h2 className="landing-info-amp">&</h2>
            <h2 className="landing-info-h2-sub">AIML Engineer</h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
