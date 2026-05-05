'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { TrendingDown } from 'lucide-react';

interface Props {
  hotelId: string;
  roomTypeId: string;
  onSelectDate?: (date: string) => void;
  selectedCheckIn?: string;
}

export function PriceGraph({ hotelId, roomTypeId, onSelectDate, selectedCheckIn }: Props) {
  const [prices, setPrices] = useState<any[]>([]);
  const [baseRate, setBaseRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId || !roomTypeId) return;
    fetch(`/api/public/price-calendar?hotelId=${hotelId}&roomTypeId=${roomTypeId}&days=60`)
      .then(r => r.json())
      .then(d => { setPrices(d.prices || []); setBaseRate(d.baseRate || 0); setLoading(false); });
  }, [hotelId, roomTypeId]);

  if (loading) return <div className="h-24 bg-black/5 rounded-xl animate-pulse" />;
  if (prices.length === 0) return null;

  const minRate = Math.min(...prices.map(p => p.rate));
  const maxRate = Math.max(...prices.map(p => p.rate));
  const avgRate = prices.reduce((s, p) => s + p.rate, 0) / prices.length;

  // Show first 30 days
  const visible = prices.slice(0, 30);

  return (
    <div className="bg-white/60 rounded-xl p-4 border border-black/5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#2A2522]/60">ราคา 30 วันข้างหน้า</p>
        <div className="flex items-center gap-1 text-emerald-600 text-xs">
          <TrendingDown className="h-3 w-3" />
          <span>ราคาต่ำสุด {formatCurrency(minRate)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={visible} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="10%">
          <XAxis dataKey="date" tick={{ fontSize: 9 }}
            tickFormatter={d => format(parseISO(d), 'd', { locale: th })}
            interval={4} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: any) => [formatCurrency(Number(v)), 'ราคา']}
            labelFormatter={(l: string) => format(parseISO(l), 'EEE d MMM', { locale: th })}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee', background: 'white' }}
          />
          <ReferenceLine y={avgRate} stroke="#C66A30" strokeDasharray="3 3" strokeWidth={0.5} />
          <Bar dataKey="rate" radius={[2, 2, 0, 0]} cursor={onSelectDate ? 'pointer' : 'default'}
            onClick={onSelectDate ? (data: any) => onSelectDate(data.date) : undefined}>
            {visible.map((entry, idx) => {
              const isSelected = entry.date === selectedCheckIn;
              const isLowest = entry.rate === minRate;
              const isHigh = entry.rate > avgRate * 1.2;
              return (
                <Cell key={idx}
                  fill={isSelected ? '#2A2522' : isLowest ? '#16A34A' : isHigh ? '#EF4444' : '#C66A30'}
                  fillOpacity={isSelected ? 1 : 0.7}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1 text-2xs text-[#2A2522]/40">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" />ราคาต่ำ</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#C66A30]" />ปกติ</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" />ราคาสูง</span>
        {onSelectDate && <span className="ml-auto">คลิกวันเพื่อเลือก check-in</span>}
      </div>
    </div>
  );
}
