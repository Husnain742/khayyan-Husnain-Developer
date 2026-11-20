import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('UI crashed:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream">
        <div className="card card-white max-w-md w-full text-center p-8">
          <h1 className="text-2xl font-bold">Kuch ghalat ho gaya</h1>
          <p className="text-sm text-muted mt-2">Page load karte waqt masla aaya. Refresh karke dekhein.</p>
          <button className="btn btn-primary mt-6" onClick={() => window.location.assign('/')}>Home par wapas</button>
        </div>
      </div>
    );
  }
}
