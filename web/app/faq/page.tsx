const FAQS = [
  { q: 'What are Tokens?', a: 'Closed-loop in-app currency. Buy packs, spend on Gifts. You cannot withdraw or sell Tokens.' },
  { q: 'Do Favorites get 100% of what I spend?', a: 'No. A published share of Token value becomes Gift Points after platform and payment costs (target ~60%+ to Favorites, validated in pilot).' },
  { q: 'Can I tip cash directly?', a: 'No. Support is via Gifts (and charity donations to verified orgs).' },
  { q: 'Do rankings favor big spenders?', a: 'Rally Score caps and log-scales money signals; unique supporters and engagement matter more.' },
  { q: 'Are charity funds paid to Favorites?', a: 'Never. Only verified beneficiaries receive campaign funds.' },
  { q: 'What about minors?', a: 'Age gating, spend limits, guardian consent where required, restricted feeds.' },
];

export default function FaqPage() {
  return (
    <div>
      <h1>FAQ</h1>
      {FAQS.map((f) => (
        <div key={f.q} className="card">
          <h2>{f.q}</h2>
          <p className="muted">{f.a}</p>
        </div>
      ))}
    </div>
  );
}
