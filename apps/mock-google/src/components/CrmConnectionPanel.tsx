"use client";

import React, { useState } from "react";

interface CrmConnectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lastWebhookPayload?: any;
}

export function CrmConnectionPanel({
  isOpen,
  onClose,
  lastWebhookPayload,
}: CrmConnectionPanelProps) {
  const [activeTab, setActiveTab] = useState<"architecture" | "pubsub" | "contracts">("architecture");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-integration-title"
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              ⚡
            </div>
            <div>
              <h2 id="crm-integration-title" className="text-base font-bold">
                Revora AI CRM — Platform Integration Architecture
              </h2>
              <p className="text-xs text-stone-300">
                Google Business Profile Mock Sandbox (Port 3001) ⟷ Revora CRM (Port 4000 / 3000)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-gray-200 bg-gray-50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`py-3 border-b-2 transition ${
              activeTab === "architecture"
                ? "border-[#1a73e8] text-[#1a73e8] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Live Flow & Topology
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pubsub")}
            className={`py-3 border-b-2 transition ${
              activeTab === "pubsub"
                ? "border-[#1a73e8] text-[#1a73e8] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Cloud Pub/Sub Webhook Envelope
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contracts")}
            className={`py-3 border-b-2 transition ${
              activeTab === "contracts"
                ? "border-[#1a73e8] text-[#1a73e8] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Multi-Property Mapping & Auth
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
          {activeTab === "architecture" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-xs mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                    Mock Google Platform
                  </div>
                  <div className="font-mono text-[11px] text-blue-800">http://localhost:3001</div>
                  <p className="mt-2 text-[11px] text-gray-600 leading-normal">
                    Serves authentic Google Hotel & Business Profile reviews UI. Stores reviews in <code>data/reviews.json</code>.
                  </p>
                </div>

                <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-xs mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                    Revora AI CRM Backend
                  </div>
                  <div className="font-mono text-[11px] text-purple-800">http://localhost:4000</div>
                  <p className="mt-2 text-[11px] text-gray-600 leading-normal">
                    Receives Google Cloud Pub/Sub webhooks at <code>/api/webhooks/google</code>, analyzes reviews, and generates AI draft replies.
                  </p>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                    Revora CRM Dashboard
                  </div>
                  <div className="font-mono text-[11px] text-emerald-800">http://localhost:3000</div>
                  <p className="mt-2 text-[11px] text-gray-600 leading-normal">
                    Hospitality manager dashboard to approve/edit responses. Publishes reply back to this mock via REST PUT.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Flow */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">
                  5-Step Live Hackathon Presentation Storyboard:
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-700 leading-relaxed">
                  <li>
                    <strong>Open Mock Google (Port 3001)</strong>: Show authentic Aurum Grand Bengaluru Google Hotel listing.
                  </li>
                  <li>
                    <strong>Inspect Guest Feedback</strong>: Scroll down to reviews, click <em>&quot;Read more&quot;</em> / <em>&quot;More&quot;</em> to expand truncated reviews.
                  </li>
                  <li>
                    <strong>Write a Review (1-Click Preset)</strong>: Click <em>&quot;Write a review&quot;</em> and use Preset A (5★ Praise) or Preset B (1★ Dispute).
                  </li>
                  <li>
                    <strong>Pub/Sub Webhook Dispatch</strong>: Mock platform saves review to <code>data/reviews.json</code> and immediately pushes Base64 Cloud Pub/Sub envelope to <code>http://localhost:4000/api/webhooks/google</code>.
                  </li>
                  <li>
                    <strong>Zero-Reload Live Auto-Sync</strong>: UI polls every 3 seconds. Once Revora CRM publishes the owner response via <code>PUT /api/v4/accounts/.../reply</code>, the indented <em>&quot;Response from the owner&quot;</em> appears live on the page!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "pubsub" && (
            <div className="space-y-3">
              <p className="text-gray-700">
                Whenever a review is submitted via the UI route (<code>POST /api/ui/reviews</code>), this exact Google Cloud Pub/Sub push notification is fired:
              </p>
              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2">
                <div className="text-stone-400">// POST http://localhost:4000/api/webhooks/google</div>
                <div className="text-stone-400">// Header: X-Sandbox-Webhook-Secret: sandbox-gbp-webhook-secret</div>
                <pre>{`{
  "message": {
    "data": "eyJ0eXBlIjoiTkVXX1JFVklFVyIsImxvY2F0aW9uIjoiYWNjb3VudHMvYWNjLWF1cnVtLTAxL2xvY2F0aW9ucy9sb2MtYmxyLTAwMSIsInJldmlldyI6ImFjY291bnRzL2FjYy1hdXJ1bS0wMS9sb2NhdGlvbnMvbG9jLWJsci0wMDEvcmV2aWV3cy9nYnBfcmV2XzEwMSJ9",
    "attributes": {
      "accountId": "acc-aurum-01"
    },
    "messageId": "msg-1732520000000"
  },
  "subscription": "projects/revora-sandbox/subscriptions/gbp-reviews-push"
}`}</pre>
                <div className="text-stone-400 pt-2">// Decoded Base64 Inner JSON:</div>
                <pre className="text-emerald-400">{`{
  "type": "NEW_REVIEW",
  "location": "accounts/acc-aurum-01/locations/loc-blr-001",
  "review": "accounts/acc-aurum-01/locations/loc-blr-001/reviews/gbp_rev_101"
}`}</pre>
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Multi-Property Canonical Mapping</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 font-semibold text-gray-800">
                      <th className="p-2.5">Canonical ID</th>
                      <th className="p-2.5">Hotel Name</th>
                      <th className="p-2.5">Google Location Path</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700">HOTEL001</td>
                      <td className="p-2.5 font-sans">Aurum Grand Bengaluru</td>
                      <td className="p-2.5 text-gray-600">accounts/acc-aurum-01/locations/loc-blr-001</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700">HOTEL002</td>
                      <td className="p-2.5 font-sans">Aurum Seaside Goa</td>
                      <td className="p-2.5 text-gray-600">accounts/acc-aurum-01/locations/loc-goa-002</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700">HOTEL003</td>
                      <td className="p-2.5 font-sans">Aurum Heritage Jaipur</td>
                      <td className="p-2.5 text-gray-600">accounts/acc-aurum-01/locations/loc-jpr-003</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 mt-2">
                <strong>Authorization Header:</strong> All <code>/api/v4/**</code> endpoints strictly enforce:
                <br />
                <code>Authorization: Bearer sandbox-gbp-token</code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-full transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
