import React, { useState, useEffect } from 'react';
import { Lock, ExternalLink, AlertTriangle, Calendar, Clock, KeyRound } from 'lucide-react';
import licenseBg from '../assets/licensing.png';

const LICENSE_API_ENDPOINT = 'https://activate.imcbs.com/mobileapp/api/project/customdev/';
const CURRENT_CLIENT_ID = "A3CT852X34GSS"; // Kanaka Spices
const CUSTOMER_LABEL = "KANAKA SPICES";
const POLL_INTERVAL = 3000;

// Fallback license data (used only if the API is unreachable) — keep Active for production
const DEFAULT_LICENSE_DATA = {
  "success": true,
  "project_name": "Custom Dev",
  "demo_licenses": [],
  "customers": [
    {
      "customer_name": "KANAKA SPICES",
      "client_id": "A3CT852X34GSS",
      "license_key": "AD1W-O2U6-MDFN-0I15",
      "package": "Custom Dev",
      "modules": [{ "module_name": "Custom Dev", "module_code": "MOD062" }],
      "license_summary": { "registered_devices": 0, "max_devices": 0 },
      "license_validity": { "expiry_date": "2027-06-01", "remaining_days": 268, "is_expired": false },
      "registered_devices": [],
      "status": "Active"
    }
  ]
};

// ───────────────────────── Embedded CSS (no .scss file needed) ─────────────────────────
const LICENSING_CSS = `
.lic-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  width: 100vw;
  height: 100vh;
  background-color: #050608;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.lic-overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, rgba(3,4,6,0.15) 0%, rgba(3,4,6,0.4) 100%);
  pointer-events: none;
}

.lic-frame {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 620px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 10, 14, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 36px 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: lic-frame-in 0.5s ease-out;
}

@keyframes lic-frame-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.lic-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  filter: drop-shadow(0 0 16px rgba(255, 70, 60, 0.55));
  animation: lic-seal-in 0.5s ease-out both, lic-pulse 2.4s ease-in-out 0.5s infinite;
}

@keyframes lic-seal-in {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.lic-seal-icon {
  color: #ff5a45;
}

@keyframes lic-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.93); }
}

.lic-headline {
  margin: 0 0 12px 0;
  font-size: clamp(24px, 2.4vw, 32px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #ff4d3d;
  text-shadow: 0 0 20px rgba(255, 77, 61, 0.45);
  opacity: 0;
  animation: lic-text-in 0.5s ease-out 0.15s both;
}

.lic-message {
  margin: 0 0 26px 0;
  max-width: 360px;
  font-size: 13.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  opacity: 0;
  animation: lic-text-in 0.5s ease-out 0.25s both;
}

@keyframes lic-text-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lic-record {
  width: 100%;
  border: 1px solid rgba(255, 90, 69, 0.4);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
  padding: 20px 22px 6px;
  margin-bottom: 22px;
  box-sizing: border-box;
  box-shadow: 0 0 20px rgba(255, 90, 69, 0.1);
  animation: lic-record-in 0.6s ease-out 0.15s both;
}

@keyframes lic-record-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lic-record-head {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #ff6a5a;
  margin-bottom: 12px;
}

.lic-record-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #ff5a45;
  margin: 0 0 18px;
  animation: lic-status-pulse 2s ease-in-out infinite;
}

@keyframes lic-status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

.lic-row-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(255, 90, 69, 0.25);
}

.lic-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  opacity: 0;
  animation: lic-row-in 0.5s ease-out forwards;
  text-align: left;
}

.lic-row:nth-child(1) { animation-delay: 0.3s; }
.lic-row:nth-child(2) { animation-delay: 0.4s; }
.lic-row:nth-child(3) { animation-delay: 0.5s; }

@keyframes lic-row-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.lic-row-icon {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.lic-row > span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.lic-row-full {
  padding: 14px 2px 4px;
  border-top: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lic-label {
  font-size: 10.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.lic-value {
  font-size: 13px;
  font-weight: 600;
  color: #f0eeee;
  word-break: break-word;
}

.lic-value-accent {
  color: #ff5a45;
}

.lic-mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.lic-retry {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 14px 20px;
  margin-bottom: 22px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #ff5a45 0%, #d6321f 100%);
  box-shadow: 0 10px 24px rgba(214, 50, 31, 0.35);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.lic-retry:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(214, 50, 31, 0.45);
}

.lic-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.lic-help-link {
  font-size: 12px;
  color: #ff6a5a;
  text-decoration: none;
}

.lic-help-link:hover {
  color: #ff8a7a;
  text-decoration: underline;
}

.lic-provider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 90, 69, 0.3);
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.lic-provider:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 90, 69, 0.4);
}

.lic-provider-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.lic-provider-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.lic-provider-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #ff6a5a;
}

.lic-secure {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

@media (max-width: 480px) {
  .lic-frame {
    padding: 28px 20px;
  }
}
`;

// ───────────────────────── Notice screen ─────────────────────────
const NoticeShell = ({ statusCode, headline, message, customer, onRefresh, showButton }) => (
  <div
    className="lic-overlay"
    style={{ backgroundImage: `url(${licenseBg})` }}
  >
    <style>{LICENSING_CSS}</style>
    <div className="lic-frame">
      <div className="lic-seal">
        <AlertTriangle size={90} className="lic-seal-icon" strokeWidth={1.5} />
      </div>

      <h1 className="lic-headline">{headline}</h1>
      <p className="lic-message">{message}</p>

      {customer && (
        <div className="lic-record">
          <div className="lic-record-head">License Status</div>
          <div className="lic-record-status">
            <AlertTriangle size={20} />
            <span>{customer.status}</span>
            <AlertTriangle size={20} />
          </div>

          <div className="lic-row-group">
            {customer.license_validity?.expiry_date && (
              <div className="lic-row">
                <Calendar size={16} className="lic-row-icon" />
                <span>
                  <span className="lic-label">Expiry Date</span>
                  <span className="lic-value lic-mono lic-value-accent">{customer.license_validity.expiry_date}</span>
                </span>
              </div>
            )}

            {customer.license_validity?.remaining_days !== null &&
              customer.license_validity?.remaining_days !== undefined && (
              <div className="lic-row">
                <Clock size={16} className="lic-row-icon" />
                <span>
                  <span className="lic-label">Remaining Days</span>
                  <span className="lic-value lic-mono lic-value-accent">{customer.license_validity.remaining_days}</span>
                </span>
              </div>
            )}

            <div className="lic-row">
              <KeyRound size={16} className="lic-row-icon" />
              <span>
                <span className="lic-label">License Key</span>
                <span className="lic-value lic-mono lic-value-accent">{customer.license_key}</span>
              </span>
            </div>
          </div>

          <div className="lic-row lic-row-full">
            <span className="lic-label">Customer</span>
            <span className="lic-value">{customer.customer_name}</span>
          </div>
        </div>
      )}

      {showButton && (
        <button onClick={onRefresh} className="lic-retry">
          <Lock size={16} />
          Retry Connection
        </button>
      )}

      <div className="lic-footer">
        <a href="mailto:support@imcbs.com" className="lic-help-link">Need Help? Contact Support</a>

        <a href="https://imcbs.com" target="_blank" rel="noopener noreferrer" className="lic-provider">
          <span className="lic-provider-meta">
            <span className="lic-provider-name">IMCBS</span>
            <span className="lic-provider-link">Visit website <ExternalLink size={11} /></span>
          </span>
        </a>

        <div className="lic-secure">
          <Lock size={12} />
          <span>Secure license management system</span>
        </div>
      </div>
    </div>
  </div>
);

const Licensing = ({ children }) => {
  const [licenseData, setLicenseData] = useState(null);
  const [error, setError] = useState(null);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);

  const fetchLicenseData = async () => {
    try {
      const response = await fetch(LICENSE_API_ENDPOINT, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`API returned ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setLicenseData(data);
      setError(null);
    } catch (err) {
      setLicenseData(DEFAULT_LICENSE_DATA);
      setError(err.message);
    }
  };

  const handleManualRefresh = () => {
    setForceRefreshCount(prev => prev + 1);
    fetchLicenseData();
  };

  useEffect(() => {
    fetchLicenseData();
    const pollInterval = setInterval(fetchLicenseData, POLL_INTERVAL);
    return () => clearInterval(pollInterval);
  }, [forceRefreshCount]);

  // First check still resolving -> show app silently. NO loading screen.
  if (!licenseData) {
    return children;
  }

  const customer = licenseData?.customers?.find(c => c.client_id === CURRENT_CLIENT_ID);

  if (!customer || customer.client_id !== CURRENT_CLIENT_ID) {
    return (
      <NoticeShell
        statusCode="ERR 403"
        headline="Access Denied"
        message={`This application is licensed for ${CUSTOMER_LABEL} only. Please contact support@imcbs.com.`}
        customer={null}
        onRefresh={handleManualRefresh}
        showButton={false}
      />
    );
  }

  const isExpired = customer.license_validity.is_expired === true;
  const status = (customer.status || "").toLowerCase().trim();
  const isActive = status === "active";

  if (isExpired || !isActive) {
    const statusCode = isExpired ? "ERR 410" : "ERR 423";
    const headline = isExpired ? "License Expired" : "License Inactive";
    const message = isExpired
      ? "Your application license has expired. Please renew your subscription to continue."
      : "Your application license is currently inactive. Please contact your system administrator to activate it.";

    return (
      <NoticeShell
        statusCode={statusCode}
        headline={headline}
        message={message}
        customer={customer}
        onRefresh={handleManualRefresh}
        showButton={false}
      />
    );
  }

  return children;
};

export default Licensing;