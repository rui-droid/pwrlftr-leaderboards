import { useEffect } from 'react';
import { renderLeaderboard } from '../../script.js';

export const LegacyLeaderboard = () => {
  useEffect(() => {
    renderLeaderboard();
  }, []);

  return (
    <section className="rounded-2xl bg-[#1a1a1a] p-4 text-sm text-white shadow-panel">
      <header>
        <h2 className="font-display text-2xl uppercase text-[#e10600]">Legacy Leaderboard</h2>
        <p className="text-sm text-gray-400">Powered by script.js + style.css</p>
      </header>
      <table className="mt-4">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Athlete</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="leaderboard-body" />
      </table>
    </section>
  );
};
