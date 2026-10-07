import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, CATEGORY_COLORS } from '../types';
import { PieChart, Filter, CheckCircle2, RotateCcw } from 'lucide-react';

interface InteractivePieChartProps {
  expenses: Expense[];
  selectedCategory: ExpenseCategory | null;
  onSelectCategory: (category: ExpenseCategory | null) => void;
  periodLabel: string;
}

interface CategorySlice {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  expenses,
  selectedCategory,
  onSelectCategory,
  periodLabel,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(null);

  // Group expenses by category
  const { slices, totalSpent } = useMemo(() => {
    const categoryTotals = new Map<ExpenseCategory, { total: number; count: number }>();

    expenses.forEach((e) => {
      const current = categoryTotals.get(e.category) || { total: 0, count: 0 };
      categoryTotals.set(e.category, {
        total: current.total + e.amount,
        count: current.count + 1,
      });
    });

    const total = Array.from(categoryTotals.values()).reduce((sum, c) => sum + c.total, 0);

    let accumulatedAngle = 0;
    const computedSlices: CategorySlice[] = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, { total: catTotal, count }]) => {
        const percentage = total > 0 ? (catTotal / total) * 100 : 0;
        const sliceAngle = total > 0 ? (catTotal / total) * 360 : 0;
        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + sliceAngle;
        accumulatedAngle += sliceAngle;

        const colorInfo = CATEGORY_COLORS[category] || { fill: '#64748b' };

        return {
          category,
          total: catTotal,
          percentage,
          count,
          startAngle,
          endAngle,
          color: colorInfo.fill,
        };
      });

    return { slices: computedSlices, totalSpent: total };
  }, [expenses]);

  // Helper to convert polar coordinates to Cartesian
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // SVG arc path generator
  const createArcPath = (
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    // If arc is full circle 360deg
    const angleDiff = endAngle - startAngle;
    if (angleDiff >= 359.99) {
      return `
        M ${centerX} ${centerY - outerRadius}
        A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY + outerRadius}
        A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY - outerRadius}
        M ${centerX} ${centerY - innerRadius}
        A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY + innerRadius}
        A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY - innerRadius}
        Z
      `;
    }

    const startOuter = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const endOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const startInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    const endInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);

    const largeArcFlag = angleDiff <= 180 ? '0' : '1';

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  const activeCategory = hoveredCategory || selectedCategory;
  const activeSlice = slices.find((s) => s.category === activeCategory);

  if (expenses.length === 0 || totalSpent === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center mb-3">
          <PieChart className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
          Nessuna spesa per {periodLabel}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Aggiungi la tua prima spesa per visualizzare la ripartizione per categoria e il grafico a torta interattivo.
        </p>
      </div>
    );
  }

  const svgSize = 280;
  const center = svgSize / 2;
  const normalOuterRadius = 120;
  const normalInnerRadius = 72;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Ripartizione Spese per Categoria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tocca o passa il mouse sulle fette per filtrare le transazioni in tempo reale.
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mostra Tutte</span>
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Interactive Pie Chart Graphic */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="overflow-visible select-none"
            >
              <g>
                {slices.map((slice) => {
                  const isHovered = hoveredCategory === slice.category;
                  const isSelected = selectedCategory === slice.category;
                  const isDimmed =
                    (hoveredCategory && !isHovered) || (selectedCategory && !isSelected && !hoveredCategory);

                  const outerR = isHovered || isSelected ? normalOuterRadius + 8 : normalOuterRadius;
                  const innerR = isHovered || isSelected ? normalInnerRadius - 2 : normalInnerRadius;

                  const path = createArcPath(
                    center,
                    center,
                    outerR,
                    innerR,
                    slice.startAngle,
                    slice.endAngle
                  );

                  return (
                    <path
                      key={slice.category}
                      d={path}
                      fill={slice.color}
                      opacity={isDimmed ? 0.35 : 1}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all duration-200 cursor-pointer hover:filter hover:drop-shadow-md"
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => {
                        onSelectCategory(
                          selectedCategory === slice.category ? null : slice.category
                        );
                      }}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Central Donut Readout */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
              style={{ width: svgSize, height: svgSize }}
            >
              {activeSlice ? (
                <div className="animate-in fade-in zoom-in-90 duration-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block max-w-[130px] truncate">
                    {activeSlice.category}
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                    €{activeSlice.total.toFixed(2)}
                  </div>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {activeSlice.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {activeSlice.count} {activeSlice.count === 1 ? 'spesa' : 'spese'}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Totale Speso
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                    €{totalSpent.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {slices.length} categorie
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="lg:col-span-7 space-y-2">
          {slices.map((slice) => {
            const isSelected = selectedCategory === slice.category;
            const isHovered = hoveredCategory === slice.category;

            return (
              <div
                key={slice.category}
                onMouseEnter={() => setHoveredCategory(slice.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() =>
                  onSelectCategory(selectedCategory === slice.category ? null : slice.category)
                }
                className={`p-2.5 rounded-xl transition cursor-pointer border flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20'
                    : isHovered
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {slice.category}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      )}
                    </div>
                    <div className="w-24 sm:w-36 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${slice.percentage}%`,
                          backgroundColor: slice.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    €{slice.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {slice.percentage.toFixed(1)}% ({slice.count})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
