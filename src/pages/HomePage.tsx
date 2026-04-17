import { PresetCard } from "../components/practice/PresetCard";
import { tabPresets } from "../data/tabPresets";

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Tab Practice</h2>
        <p className="text-sm text-slate-400">
          メトロノームに合わせてタブ譜を演奏しよう。タイミングの正確さを評価します。
        </p>
      </div>

      <div className="grid gap-4">
        {tabPresets.map((preset) => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </div>
    </div>
  );
}
