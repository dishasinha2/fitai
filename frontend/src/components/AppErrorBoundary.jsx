import { Component } from 'react';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('FitAI render error:', error);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fitai-shell fitai-grid flex min-h-screen items-center justify-center px-6">
          <div className="glass-card max-w-xl rounded-[2rem] p-8 text-center">
            <p className="section-title text-sm text-fuchsia-300">FitAI Recovery</p>
            <h1 className="mt-4 text-3xl font-bold text-white">We ran into a loading problem.</h1>
            <p className="mt-3 text-slate-300">
              Try reloading first. If the problem came from saved browser session data, you can reset local app data and reopen FitAI cleanly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleRefresh}
                className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg"
              >
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="glass-morphism rounded-full px-6 py-3 font-semibold text-slate-100"
              >
                Reset Local Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
