import React, { useState } from 'react'
import { INITIAL_BOMS } from '@/lib/mockData'
import { BillOfMaterials } from '@/types/production'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatNaira, formatQuantity } from '@/lib/utils'
import { ScrollText, Layers, Plus, Check } from 'lucide-react'

export const BOMPage: React.FC = () => {
  const [boms] = useState<BillOfMaterials[]>(INITIAL_BOMS)
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials>(INITIAL_BOMS[0])

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Recipes & Food Costing
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Formulation recipes, raw ingredient consumption rates, kitchen trim allowances, and unit costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-72"
            value={selectedBOM.id}
            onChange={(e) => {
              const found = boms.find((b) => b.id === e.target.value)
              if (found) setSelectedBOM(found)
            }}
            options={boms.map((b) => ({
              value: b.id,
              label: `${b.finished_product_name} (${b.version})`
            }))}
          />
        </div>
      </div>

      {/* Selected BOM Plate */}
      <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kumo-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kumo-brand/10 text-kumo-brand flex items-center justify-center font-bold">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-kumo-strong">
                  {selectedBOM.finished_product_name}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-kumo-tint text-kumo-default ring ring-kumo-line/50">
                  {selectedBOM.version}
                </span>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>
              <p className="text-xs text-kumo-subtle font-mono mt-0.5">
                Target SKU: {selectedBOM.finished_product_sku} • Batch Base: {selectedBOM.standard_batch_size} {selectedBOM.uom}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase">Expected Yield</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {selectedBOM.standard_yield_percent}%
              </span>
            </div>
            <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">Standard Unit Cost</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatNaira(selectedBOM.unit_cost)}
              </span>
            </div>
          </div>
        </div>

        {/* Recipe Components Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">Component / Raw Material</th>
                <th className="px-3.5 py-2.5 font-mono">SKU Code</th>
                <th className="px-3.5 py-2.5 text-right font-mono">Batch Qty</th>
                <th className="px-3.5 py-2.5 text-right font-mono">Unit Cost</th>
                <th className="px-3.5 py-2.5 text-right font-mono">Subtotal</th>
                <th className="px-3.5 py-2.5 text-center">Substitutions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedBOM.components.map(comp => (
                <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {comp.raw_material_name}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-slate-500">{comp.raw_material_sku}</td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {comp.required_quantity} {comp.uom}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatNaira(comp.unit_cost)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatNaira(comp.required_quantity * comp.unit_cost)}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    {comp.allow_substitution ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                        Authorized
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Strict Single Source</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-800 font-mono text-xs">
              <tr>
                <td colSpan={4} className="px-3.5 py-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                  Total Calculated Batch Recipe Cost ({selectedBOM.standard_batch_size} units):
                </td>
                <td className="px-3.5 py-2.5 text-right font-bold text-sm text-[#0051C3] dark:text-blue-400">
                  {formatNaira(selectedBOM.total_batch_cost)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {selectedBOM.notes && (
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-[4px] border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <strong>Production Engineering Notes:</strong> {selectedBOM.notes}
          </div>
        )}
      </div>
    </div>
  )
}
