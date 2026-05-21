import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, ChevronRight, BarChart3, Users, Home, Target, Shield, Zap, Globe, LineChart } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('warp-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.warp-animate').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="warp-landing">
      {/* Navbar */}
      <nav className="warp-nav">
        <div className="warp-nav-inner">
          <div className="warp-nav-logo" onClick={() => navigate('/')}>
            <div className="warp-logo-circle">
              <Building size={16} />
            </div>
            <span className="warp-logo-text">PropTrack</span>
          </div>
          <div className="warp-nav-links">
            <a href="#features">Features</a>
            <a href="#product">Product</a>
            <a href="#testimonials">Customers</a>
          </div>
          <div className="warp-nav-actions">
            <button className="warp-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
            <button className="warp-btn-primary" onClick={() => navigate('/register')}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="warp-hero">
        <div className="warp-hero-content">
          <h1 className="warp-hero-title">
            Property management<br />
            <span className="warp-hero-highlight">that runs itself.</span>
          </h1>
          <p className="warp-hero-subtitle">
            Built for ambitious, fast-growing real estate agencies. Manage properties, track leads, close deals, and monitor agent performance — all from one premium dashboard.
          </p>
          <div className="warp-hero-actions">
            <button className="warp-btn-primary warp-btn-lg" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="warp-btn-outline warp-btn-lg" onClick={() => navigate('/login')}>
              View Demo <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="warp-hero-preview warp-animate">
          <div className="warp-preview-window">
            <div className="warp-preview-dots">
              <span style={{ background: '#FF5F57' }}></span>
              <span style={{ background: '#FFBD2E' }}></span>
              <span style={{ background: '#27C93F' }}></span>
            </div>
            <img src="/dashboard-preview.png" alt="PropTrack Dashboard" className="warp-preview-img" />
          </div>
        </div>

        {/* Trusted by */}
        <div className="warp-trusted warp-animate">
          <p className="warp-trusted-label">Trusted by leading agencies across the UAE</p>
          <div className="warp-trusted-logos">
            <span>🏢 Emirates Real Estate</span>
            <span>🏗️ Dubai Properties</span>
            <span>🌇 Gulf Estates</span>
            <span>🏠 Al Dar Homes</span>
            <span>🏙️ Nakheel Group</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="warp-features" id="features">
        <div className="warp-section-header warp-animate">
          <h2 className="warp-section-title">Everything your agency needs.<br />Nothing it doesn't.</h2>
        </div>

        <div className="warp-features-grid">
          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#E8F5EE', color: '#2D6A4F' }}>
              <Home size={22} />
            </div>
            <h3>Property Portfolio</h3>
            <p>Manage apartments, villas, and commercial properties. Track availability, pricing, and images — all in one beautiful interface.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>

          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
              <Target size={22} />
            </div>
            <h3>Lead Pipeline</h3>
            <p>Visualize your sales funnel from first contact to closed deal. Never lose track of a prospect again with real-time status tracking.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>

          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <BarChart3 size={22} />
            </div>
            <h3>Deal Analytics</h3>
            <p>Track revenue, commissions, and conversion rates. Get actionable insights into your agency's performance with real-time dashboards.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>

          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#FCE7F3', color: '#BE185D' }}>
              <Users size={22} />
            </div>
            <h3>Agent Management</h3>
            <p>Monitor agent performance, track deal closings, and optimize your team's efficiency. Know who's performing and who needs support.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>

          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
              <LineChart size={22} />
            </div>
            <h3>Revenue Tracker</h3>
            <p>Set monthly and yearly targets. Watch your revenue grow with visual progress indicators and intelligent forecasting.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>

          <div className="warp-feature-card warp-animate" onClick={() => navigate('/register')}>
            <div className="warp-feature-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Globe size={22} />
            </div>
            <h3>Client Relations</h3>
            <p>Build lasting relationships with buyers and renters. Manage contacts, track interactions, and schedule follow-ups seamlessly.</p>
            <span className="warp-feature-link">Explore <ChevronRight size={14} /></span>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="warp-product" id="product">
        <div className="warp-product-grid">
          <div className="warp-product-text warp-animate">
            <div className="warp-product-badge">Powered by Data</div>
            <h2>Your entire agency,<br />one intelligent dashboard.</h2>
            <p>PropTrack gives you a bird's-eye view of your entire operation. Pipeline analytics, revenue tracking, team performance, and upcoming meetings — all updated in real-time. No spreadsheets. No guesswork.</p>
          </div>
          <div className="warp-product-visual warp-animate">
            <div className="warp-stat-pill">
              <Zap size={16} />
              <span><strong>15.0%</strong> Conversion Rate</span>
            </div>
            <div className="warp-stat-pill">
              <Shield size={16} />
              <span><strong>AED 250K</strong> Revenue Tracked</span>
            </div>
            <div className="warp-stat-pill">
              <Users size={16} />
              <span><strong>20+</strong> Active Leads</span>
            </div>
          </div>
        </div>

        <div className="warp-product-grid warp-reverse">
          <div className="warp-product-visual warp-animate">
            <div className="warp-stat-pill">
              <Home size={16} />
              <span><strong>For Sale</strong> & <strong>For Rent</strong> Tags</span>
            </div>
            <div className="warp-stat-pill">
              <Target size={16} />
              <span><strong>VIP</strong>, <strong>Hot Lead</strong>, <strong>Premium</strong></span>
            </div>
            <div className="warp-stat-pill">
              <BarChart3 size={16} />
              <span><strong>1-Click</strong> Property Overview</span>
            </div>
          </div>
          <div className="warp-product-text warp-animate">
            <div className="warp-product-badge">Designed for Speed</div>
            <h2>Property listings that<br />sell themselves.</h2>
            <p>Beautiful property cards with images, dynamic tags, and instant overview modals. Click any listing to see the full details — beds, baths, price, agent info, and a rich description. No forms, no friction.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="warp-testimonials" id="testimonials">
        <div className="warp-section-header warp-animate">
          <h2 className="warp-section-title">Loved by the most ambitious agencies.<br />Join teams that left spreadsheets behind.</h2>
        </div>

        <div className="warp-testimonials-grid warp-animate">
          <div className="warp-testimonial-card">
            <p>"We switched from manual tracking to PropTrack — the difference has been striking. Our agents close deals 3x faster now."</p>
            <div className="warp-testimonial-author">
              <img src="/avatars/avatar-1.png" alt="Sara" className="warp-testimonial-avatar" />
              <div>
                <strong>Sara Khan</strong>
                <span>Senior Agent, Dubai Properties</span>
              </div>
            </div>
          </div>
          <div className="warp-testimonial-card">
            <p>"PropTrack feels like the first time I used a truly modern tool. If you never want to lose a lead again, you should use this."</p>
            <div className="warp-testimonial-author">
              <img src="/avatars/avatar-2.png" alt="Mohammed" className="warp-testimonial-avatar" />
              <div>
                <strong>Mohammed Al Rashid</strong>
                <span>Broker, Gulf Estates</span>
              </div>
            </div>
          </div>
          <div className="warp-testimonial-card">
            <p>"PropTrack has been essential for our growth — we can focus on relationships instead of worrying about data entry."</p>
            <div className="warp-testimonial-author">
              <img src="/avatars/avatar-3.png" alt="Emily" className="warp-testimonial-avatar" />
              <div>
                <strong>Emily Carter</strong>
                <span>Operations Lead, Al Dar Homes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="warp-final-cta">
        <div className="warp-animate">
          <h2>Join ambitious agencies that never<br />lose track of a deal again.</h2>
          <div className="warp-hero-actions" style={{ justifyContent: 'center', marginTop: '32px' }}>
            <button className="warp-btn-primary warp-btn-lg" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="warp-btn-outline warp-btn-lg" onClick={() => navigate('/login')}>
              View Demo <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="warp-footer">
        <div className="warp-footer-inner">
          <div className="warp-footer-brand">
            <div className="warp-nav-logo">
              <div className="warp-logo-circle">
                <Building size={16} />
              </div>
              <span className="warp-logo-text">PropTrack</span>
            </div>
            <p>Copyright © PropTrack 2026, All rights reserved</p>
          </div>
          <div className="warp-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Properties</a>
              <a href="#features">Lead Pipeline</a>
              <a href="#features">Deal Analytics</a>
              <a href="#features">Agents</a>
            </div>
            <div>
              <h4>Solutions</h4>
              <a href="#product">Small Agencies</a>
              <a href="#product">Mid-Market</a>
              <a href="#product">Enterprise</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a onClick={() => navigate('/login')}>Log In</a>
              <a onClick={() => navigate('/register')}>Register</a>
              <a href="#testimonials">Customers</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
