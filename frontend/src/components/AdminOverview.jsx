import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import api from '../lib/api';

function AdminOverview() {
  const [analytics, setAnalytics] = useState({ metrics: {}, latestContacts: [] });
  const [mlStatus, setMlStatus] = useState({
    dataset_size: 0,
    model_trained: false,
    last_training_time: null,
  });
  const [mlMessage, setMlMessage] = useState('');
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsResponse, mlResponse] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/ml/status'),
        ]);
        setAnalytics(analyticsResponse.data);
        setMlStatus(mlResponse.data);
      } catch (_error) {
        setAnalytics({ metrics: {}, latestContacts: [] });
      }
    };

    load();
  }, []);

  const retrainModel = async () => {
    setRetraining(true);
    setMlMessage('');

    try {
      const response = await api.post('/ml/retrain');
      setMlStatus((current) => ({
        ...current,
        ...(response.data.status || current),
      }));
      setMlMessage(`Model retrained on ${response.data.train?.dataset_size || 0} training rows.`);
    } catch (error) {
      setMlMessage(error.response?.data?.error || 'Unable to retrain the model right now.');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <Layout
      title="Admin Control"
      subtitle="Restricted admin hub for lead review, analytics, and platform-level monitoring."
      heroLabel="Admin Access"
      heroImage="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="fitai-ref-dashboard-hero p-6">
            <p className="fitai-ref-kicker">Admin Access</p>
            <h2 className="fitai-ref-app-title mt-3">Restricted management area</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Users', analytics.metrics.totalUsers || 0],
                ['Workouts', analytics.metrics.totalWorkouts || 0],
                ['Contacts', analytics.metrics.totalContacts || 0],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-stat-block p-4">
                  <p className="fitai-ref-stat-label">{label}</p>
                  <p className="fitai-ref-stat-value mt-3">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Admin Shortcuts</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Link to="/analytics" className="fitai-ref-app-card-soft p-5">
                <p className="text-lg font-semibold text-white">Analytics</p>
                <p className="mt-2 text-sm text-slate-400">Review users, workout activity, goals, and top exercise trends.</p>
              </Link>
              <Link to="/requests" className="fitai-ref-app-card-soft p-5">
                <p className="text-lg font-semibold text-white">Lead Inbox</p>
                <p className="mt-2 text-sm text-slate-400">Handle demo, premium, support, and partnership requests.</p>
              </Link>
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="fitai-ref-kicker">ML Control</p>
                <h3 className="fitai-ref-card-title mt-2">Dataset and model health</h3>
              </div>
              <button
                type="button"
                onClick={retrainModel}
                disabled={retraining}
                className="fitai-ref-action px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retraining ? 'Retraining...' : 'Retrain Model'}
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['Dataset Rows', mlStatus.dataset_size || 0],
                ['Model Status', mlStatus.model_trained ? 'Ready' : 'Not trained'],
                ['Last Training', mlStatus.last_training_time ? 'Available' : 'Pending'],
                ['ML Engine', 'Random Forest'],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-stat-block p-4">
                  <p className="fitai-ref-stat-label">{label}</p>
                  <p className="fitai-ref-stat-value mt-3">{value}</p>
                </div>
              ))}
            </div>

            {mlStatus.last_training_time ? (
              <p className="mt-4 text-sm text-slate-400">Last trained: {new Date(mlStatus.last_training_time).toLocaleString()}</p>
            ) : null}
            {mlMessage ? <p className="mt-4 text-sm text-rose-100">{mlMessage}</p> : null}
          </div>
        </section>

        <section className="fitai-ref-app-card p-6">
          <p className="fitai-ref-kicker">Recent Public Leads</p>
          <div className="mt-5 space-y-3">
            {analytics.latestContacts?.map((item) => (
              <div key={item._id} className="fitai-ref-app-card-soft p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.email}</p>
                  </div>
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
                    {item.interest}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{item.message || 'No message provided.'}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default AdminOverview;
