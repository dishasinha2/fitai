import { useEffect, useMemo, useState } from 'react';
import Layout from './Layout';
import api from '../lib/api';

const interestMeta = {
  demo: {
    label: 'Demo',
    className: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  },
  premium: {
    label: 'Premium',
    className: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200',
  },
  partnership: {
    label: 'Partnership',
    className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  },
  support: {
    label: 'Support',
    className: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  },
};

function Requests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    demo: 0,
    premium: 0,
    partnership: 0,
    support: 0,
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/contact');
        setSubmissions(response.data.submissions || []);
        setSummary(response.data.summary || {});
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load request inbox.');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const visibleSubmissions = useMemo(() => {
    if (filter === 'all') {
      return submissions;
    }

    return submissions.filter((item) => item.interest === filter);
  }, [filter, submissions]);

  const summaryCards = [
    ['All Requests', summary.total || 0],
    ['Demo', summary.demo || 0],
    ['Premium', summary.premium || 0],
    ['Partnership', summary.partnership || 0],
    ['Support', summary.support || 0],
  ];

  return (
    <Layout
      title="Request Inbox"
      subtitle="Review incoming public website requests for demos, premium plans, partnerships, and product questions."
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-cyan-300">Lead Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Public contact pipeline</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {summaryCards.map(([label, value]) => (
                <div key={label} className="glass-morphism metric-glow rounded-3xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Filters</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {['all', 'demo', 'premium', 'partnership', 'support'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    filter === item
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {item === 'all' ? 'All' : interestMeta[item].label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-fuchsia-300">How To Use</p>
            <div className="mt-5 space-y-3">
              {[
                'Review fresh public-site leads in one place.',
                'Identify demo requests versus premium or partnership interest.',
                'Use the message and company field to prioritize follow-up.',
                'Pair this inbox with your hackathon demo flow for a fuller product story.',
              ].map((item) => (
                <div key={item} className="glass-morphism rounded-2xl px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card glass-morphism rounded-[2rem] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title text-sm font-semibold text-amber-300">Live Requests</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {filter === 'all' ? 'All submissions' : `${interestMeta[filter].label} submissions`}
              </h2>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible</p>
              <p className="mt-1 text-xl font-semibold text-white">{visibleSubmissions.length}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">Loading requests...</p>
            ) : null}

            {!loading && visibleSubmissions.length === 0 ? (
              <div className="glass-morphism rounded-3xl px-5 py-6 text-sm text-slate-400">
                No requests match this filter yet.
              </div>
            ) : null}

            {!loading &&
              visibleSubmissions.map((submission) => {
                const meta = interestMeta[submission.interest] || {
                  label: submission.interest,
                  className: 'border-slate-600 bg-slate-800/80 text-slate-200',
                };

                return (
                  <article key={submission._id} className="feature-panel glass-morphism rounded-3xl p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">{submission.name}</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{submission.email}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {submission.company || 'Independent user'} •{' '}
                          {new Date(submission.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={`mailto:${submission.email}`}
                        className="rounded-2xl border border-cyan-400/30 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300"
                      >
                        Reply by Email
                      </a>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Message</p>
                      <p className="mt-3 leading-7 text-slate-300">
                        {submission.message || 'No custom message was included with this request.'}
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Requests;
