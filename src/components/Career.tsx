import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>AI Intern</h4>
                <h5>IBM</h5>
              </div>
              <h3>June 2025 - August 2025</h3>
            </div>
            <p>
              Built and evaluated ML pipelines covering data preprocessing,
              feature engineering, and model evaluation. Integrated ML logic
              into backend workflows and application APIs for real-world data
              processing. Worked with structured datasets and collaborated using
              version control and structured engineering workflows.
            </p>
          </div>
        </div>
        <div className="career-info-box">
  <div className="career-info-in">
    <div className="career-role">
      <h4>Vice President</h4>
      <h5>Binary Brains, BBDITM</h5>
    </div>
    <h3>September 2025 – Present</h3>
  </div>
  <p>
    Leading the official technical club of BBDITM by organizing technical
    events, hackathons, coding workshops, and mentoring student teams while
    fostering a collaborative developer community.
  </p>
</div>
        <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>B.Tech  CSE (AIML)</h4>
                <h5>BBDITM , Lucknow</h5>
              </div>
              <h3>2023-2027</h3>
            </div>
            <p>
              Specialising in Artificial Intelligence & Machine Learning.
              Building a strong foundation in backend systems, data structures,
              and software engineering alongside core CS coursework.
            </p>
          </div>
      </div>
    </div>
  );
};

export default Career;
