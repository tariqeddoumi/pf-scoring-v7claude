import { Card } from "@/components/ui/card";
import { RISK_CATEGORIES } from "@/lib/constants";

export default function MethodologyPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Méthodologie</h1>
        <p className="mt-2 text-muted-foreground">
          Méthodologie de scoring conforme IFC, EBRD, Basel, Bank Al-Maghrib
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Conformités réglementaires</h2>
          <ul className="space-y-2 text-sm">
            <li>✓ <strong>IFC</strong> - International Finance Corporation standards</li>
            <li>✓ <strong>EBRD</strong> - European Bank for Reconstruction standards</li>
            <li>✓ <strong>Basel III</strong> - International capital adequacy</li>
            <li>✓ <strong>Bank Al-Maghrib</strong> - Central bank regulations</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Catégories de risque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RISK_CATEGORIES.map((cat) => (
              <div key={cat.id} className="p-3 bg-secondary rounded-lg">
                <p className="font-semibold">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pondération: {(cat.ponderationDefaut * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Échelle de notation</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="text-emerald-400 font-bold">AAA (95-100)</div>
            <div className="text-emerald-500 font-bold">AA (85-94)</div>
            <div className="text-green-500 font-bold">A (75-84)</div>
            <div className="text-lime-500 font-bold">BBB (65-74)</div>
            <div className="text-yellow-500 font-bold">BB (55-64)</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mt-2">
            <div className="text-orange-400 font-bold">B (45-54)</div>
            <div className="text-orange-500 font-bold">CCC (35-44)</div>
            <div className="text-red-400 font-bold">CC (25-34)</div>
            <div className="text-red-500 font-bold">C (15-24)</div>
            <div className="text-red-600 font-bold">D (0-14)</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
