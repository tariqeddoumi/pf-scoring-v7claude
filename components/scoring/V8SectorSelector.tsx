"use client";

import { useEffect, useState } from "react";
import { ChevronDown, AlertCircle, TrendingDown } from "lucide-react";
import { V8SectorData } from "@/lib/scoring-engine-v8";

interface V8SectorSelectorProps {
  selected?: string;
  onChange: (sectorCode: string) => void;
  disabled?: boolean;
}

export default function V8SectorSelector({
  selected,
  onChange,
  disabled = false,
}: V8SectorSelectorProps) {
  const [sectors, setSectors] = useState<V8SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const response = await fetch("/api/v8/sectors");
      if (!response.ok) throw new Error("Failed to fetch sectors");
      const data = await response.json();
      setSectors(data.data || []);
    } catch (error) {
      console.error("Failed to fetch V8 sectors:", error);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedSector = sectors.find((s) => s.code === selected);

  const sectorLabels: Record<string, string> = {
    ENR: "Énergies Renouvelables",
    EAU: "Eau & Assainissement",
    TRA: "Transport",
    POR: "Ports",
    IND: "Industrie",
    MIN: "Mines",
    TOU: "Tourisme",
    TEL: "Télécommunications",
    SAN: "Santé",
    AGR: "Agriculture",
    ETH: "Éthanol & Bioénergie",
    IMM: "Immobilier",
  };

  const sectorRiskLevels: Record<string, "low" | "medium" | "high"> = {
    ENR: "low",
    EAU: "low",
    TRA: "medium",
    POR: "medium",
    IND: "medium",
    MIN: "high",
    TOU: "high",
    TEL: "low",
    SAN: "medium",
    AGR: "medium",
    ETH: "high",
    IMM: "medium",
  };

  return (
    <div className="w-full">
      {/* Dropdown Button */}
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-colors ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-white border-slate-300 hover:border-cyan-500 hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-slate-500">Chargement...</span>
          ) : selectedSector ? (
            <div>
              <div className="font-semibold text-slate-900">
                {sectorLabels[selectedSector.code] || selectedSector.label}
              </div>
              <div className="text-xs text-slate-500">{selectedSector.code}</div>
            </div>
          ) : (
            <span className="text-slate-500">Sélectionner un secteur</span>
          )}
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && !disabled && (
        <div className="absolute mt-2 w-96 bg-white border border-slate-300 rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {sectors.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500">
                Aucun secteur disponible
              </div>
            ) : (
              sectors.map((sector) => (
                <button
                  key={sector.code}
                  onClick={() => {
                    onChange(sector.code);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-slate-50 transition-colors ${
                    selected === sector.code ? "bg-cyan-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {sectorLabels[sector.code] || sector.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {sector.code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sectorRiskLevels[sector.code] === "high" && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      {sectorRiskLevels[sector.code] === "medium" && (
                        <TrendingDown size={16} className="text-orange-500" />
                      )}
                      {selected === sector.code && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
