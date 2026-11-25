'use client';

import React from 'react';
import {
  DEMO_ROLES,
  DemoRole,
  PROPERTIES,
  PropertyId,
  ROLE_PERMISSIONS,
} from '@revora/shared';
import {
  AlertTriangle,
  Building2,
  Cpu,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface TopGovernanceBarProps {
  activeRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
  selectedProperty: PropertyId | 'ALL';
  onPropertyChange: (prop: PropertyId | 'ALL') => void;
}

export function TopGovernanceBar({
  activeRole,
  onRoleChange,
  selectedProperty,
  onPropertyChange,
}: TopGovernanceBarProps) {
  const roleInfo = ROLE_PERMISSIONS[activeRole];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      {/* Mandatory Sandbox Banner per Spec §7.1 */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            SANDBOX / SIMULATION — Local Hackathon Environment (External Review Platform
            Publishing Disabled • Simulated RBAC)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-900">
          <span className="inline-flex items-center gap-1 rounded bg-amber-400/70 px-2 py-0.5">
            <Sparkles className="h-3 w-3" /> Gemini Flash + Zod
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-amber-400/70 px-2 py-0.5">
            <Database className="h-3 w-3" /> SQLite + Qdrant SOP RAG
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-amber-400/70 px-2 py-0.5">
            <Cpu className="h-3 w-3" /> UI Preview Mode (Ready for :4000 Engine)
          </span>
        </div>
      </div>

      {/* Main Governance Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              RA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  Revora AI CRM
                </h1>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  PS 224
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Aurum Grand Hospitality • Multi-Property Command Center
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-200 md:block" />

          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <label htmlFor="property-filter" className="sr-only">
              Property Filter
            </label>
            <select
              id="property-filter"
              value={selectedProperty}
              onChange={(e) => onPropertyChange(e.target.value as PropertyId | 'ALL')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Properties (3 Hotels)</option>
              {PROPERTIES.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.propertyId} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Simulated RBAC Role Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-slate-700">Simulated RBAC Role:</span>
          </div>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
            role="group"
            aria-label="Simulated RBAC Role Switcher"
          >
            {DEMO_ROLES.map((role) => {
              const active = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(role)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
          <span
            title={roleInfo.description}
            className="hidden max-w-xs truncate rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 xl:inline-block"
          >
            {roleInfo.title}
          </span>
        </div>
      </div>
    </header>
  );
}
