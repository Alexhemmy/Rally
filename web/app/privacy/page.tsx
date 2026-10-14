export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy policy</h1>
      <div className="card stack">
        <p className="muted">Summary aligned with PRD (GDPR / NDPR readiness).</p>
        <h2>Data we process</h2>
        <p className="muted">Account, payments via providers (no raw card storage), gifts, content, device/locale signals for rankings and fraud.</p>
        <h2>Your rights</h2>
        <p className="muted">Access, export, deletion. Favorites can export supporter lists with fan consent for contact details.</p>
        <h2>Security</h2>
        <p className="muted">Encryption in transit and at rest; PCI via tokenized providers; role-based admin audit logs.</p>
      </div>
    </div>
  );
}
