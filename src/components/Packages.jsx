import React, { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const PLANS = [
  { id: "monthly", duration: "1", unit: "Month", price: "999", featured: false },
  { id: "quarterly", duration: "3", unit: "Months", price: "2,999", featured: false },
  { id: "half-yearly", duration: "6", unit: "Months", price: "5,999", featured: false },
  { id: "yearly", duration: "12", unit: "Months", price: "11,999", featured: true },
];

const Packages = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const cards = sectionRef.current.querySelectorAll(".pkg-anim");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.classList.add("visible");
            }, i * 250); // stagger delay
          });
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="pkg-section" ref={sectionRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');

        .pkg-section {
          --paper: #fcfcfa;
          --line: #d8e3ec;
          --slate: #5b7186;
          --glaze: #2e5c8a;
          --glaze-light: #6f9dc4;
          --navy: #16324f;
          --navy-soft: #1e3f61;

          background: var(--paper);
          padding: 100px 24px;
          font-family: 'Inter', -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .pkg-header {
          text-align: center;
          max-width: 620px;
          margin: 0 auto 64px;
        }

        .pkg-eyebrow {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--glaze);
          margin-bottom: 18px;
        }

        .pkg-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          line-height: 1.08;
          color: var(--navy);
          margin: 0 0 16px;
        }

        .pkg-title em {
          font-style: italic;
          color: var(--glaze);
        }

        .pkg-sub {
          font-size: 1.02rem;
          line-height: 1.6;
          color: var(--slate);
          margin: 0;
        }

        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          max-width: 1180px;
          margin: 0 auto;
        }

        /* Jump animation */
        @keyframes pkgJump {
          0% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          60% { opacity: 1; transform: translateY(10px) scale(1.05); }
          80% { transform: translateY(-5px) scale(0.98); }
          100% { transform: translateY(0) scale(1); }
        }

        .pkg-anim {
          opacity: 0;
        }

       .pkg-anim.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  animation: pkgJump 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}



        .pkg-card {
          position: relative;
          background: #ffffff;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 36px 28px 30px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 2px rgba(22, 50, 79, 0.04);
          transition: transform 0.4s, border-color 0.4s, box-shadow 0.4s;
        }

        .pkg-card:hover {
          transform: translateY(-8px);
          border-color: var(--glaze-light);
          box-shadow: 0 20px 36px -18px rgba(22, 50, 79, 0.22);
        }

        .pkg-card.featured {
          background: linear-gradient(165deg, var(--navy-soft), var(--navy));
          border: 1px solid var(--navy);
          box-shadow: 0 20px 44px -16px rgba(22, 50, 79, 0.45);
        }

        .pkg-badge {
          position: absolute;
          top: -13px;
          left: 28px;
          background: #ffffff;
          color: var(--navy);
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 20px;
        }

        .pkg-duration-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
        }

        .pkg-duration-num {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.1rem;
          font-weight: 500;
          color: var(--navy);
        }

        .pkg-card.featured .pkg-duration-num {
          color: #ffffff;
        }

        .pkg-duration-unit {
          font-size: 0.95rem;
          color: var(--slate);
          font-weight: 500;
        }

        .pkg-card.featured .pkg-duration-unit {
          color: rgba(255, 255, 255, 0.65);
        }

        .pkg-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 6px;
        }

        .pkg-currency {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.4rem;
          color: var(--glaze);
        }

        .pkg-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 2.6rem;
          font-weight: 500;
          color: var(--navy);
        }

        .pkg-card.featured .pkg-currency,
        .pkg-card.featured .pkg-price {
          color: #ffffff;
        }

        .pkg-cycle {
          font-size: 0.82rem;
          color: var(--slate);
          margin-bottom: 28px;
        }

        .pkg-card.featured .pkg-cycle {
          color: rgba(255, 255, 255, 0.6);
        }

        .pkg-btn {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--navy);
          color: var(--navy);
          font-size: 0.92rem;
          font-weight: 600;
          padding: 13px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s, border-color 0.3s, color 0.3s;
        }

        .pkg-btn:hover {
          background: var(--navy);
          color: #ffffff;
        }

        .pkg-card.featured .pkg-btn {
          background: #ffffff;
          border-color: #ffffff;
          color: var(--navy);
        }

        .pkg-card.featured .pkg-btn:hover {
          background: var(--glaze-light);
          border-color: var(--glaze-light);
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .pkg-section { padding: 70px 18px; }
          .pkg-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pkg-header">
        <div className="pkg-eyebrow">Membership</div>
        <h2 className="pkg-title">
          Choose your <em>duration</em>
        </h2>
        <p className="pkg-sub">
          Full access, every tier — pick the commitment that fits your rhythm.
        </p>
      </div>

      <div className="pkg-grid">
        {PLANS.map((plan, i) => (
          <div className="pkg-anim" key={plan.id}>
            <div className={`pkg-card${plan.featured ? " featured" : ""}`}>
              {plan.featured && <span className="pkg-badge">Best Value</span>}

              <svg className="pkg-emblem" viewBox="0 0 34 34" fill="none">
                <circle
                  cx="17"
                  cy="17"
                  r="15.5"
                  stroke={plan.featured ? "#ffffff" : "#2e5c8a"}
                  strokeWidth="1"
                  opacity={plan.featured ? 0.85 : 1}
                />
                <circle
                  cx="17"
                  cy="17"
                  r="10.5"
                  stroke={plan.featured ? "#ffffff" : "#2e5c8a"}
                  strokeWidth="1"
                  opacity={plan.featured ? 0.45 : 0.5}
                />
                <circle cx="17" cy="17" r="2" fill={plan.featured ? "#ffffff" : "#2e5c8a"} />
              </svg>

              <div className="pkg-duration-row">
                <span className="pkg-duration-num">{plan.duration}</span>
                <span className="pkg-duration-unit">{plan.unit}</span>
              </div>

              <div className="pkg-rim" />

              <div className="pkg-price-row">
                <span className="pkg-currency">₹</span>
                <span className="pkg-price">{plan.price}</span>
              </div>

              <div className="pkg-cycle">
                Full access for {plan.duration} {plan.unit.toLowerCase()}
              </div>

              <button
                className="pkg-btn"
                aria-label={`Get started with the ${plan.duration} ${plan.unit} plan`}
              >
                Get Started
                <ArrowUpRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Packages;
