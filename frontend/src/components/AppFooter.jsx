import { Link } from 'react-router-dom';

function AppFooter() {
  return (
    <footer className="fitai-ref-footer">
      <div className="ft-top">
        <div>
          <Link to="/" className="fitai-ref-logo fitai-ref-footer-logo">
            <span className="fitai-ref-logo-mark">F</span>
            <span className="fitai-ref-logo-word">FITAI</span>
          </Link>
          <p className="ft-desc fitai-ref-copy">
            Smart training for gym users and home athletes. Track workouts, improve nutrition, find nearby gyms, and
            stay consistent with AI guidance.
          </p>
        </div>

        <div className="ft-col">
          <h4>Platform</h4>
          <ul>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/workout">Workout</Link>
            </li>
            <li>
              <Link to="/progress">Progress</Link>
            </li>
            <li>
              <Link to="/diet">Diet</Link>
            </li>
          </ul>
        </div>

        <div className="ft-col">
          <h4>Account</h4>
          <ul>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/signup">Signup</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <Link to="/notifications">Reminders</Link>
            </li>
          </ul>
        </div>

        <div className="ft-col">
          <h4>FitAI</h4>
          <ul>
            <li>
              <Link to="/">About</Link>
            </li>
            <li>
              <Link to="/requests">Requests</Link>
            </li>
            <li>
              <Link to="/analytics">Analytics</Link>
            </li>
            <li>
              <Link to="/workout">Start Training</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="ft-btm">
        <span>© 2026 FitAI Technologies. All rights reserved.</span>
        <span>Built for consistency, recovery, and stronger training decisions.</span>
      </div>
    </footer>
  );
}

export default AppFooter;
