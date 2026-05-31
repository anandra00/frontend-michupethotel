import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Users, TrendingUp, TrendingDown, Cat, CalendarCheck, Star, Award, MapPin, Phone, DollarSign, Activity } from 'lucide-react';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOccupancyIdx, setActiveOccupancyIdx] = useState(null);
  const [activeRevenueIdx, setActiveRevenueIdx] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/admin/reports');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = async (type) => {
    try {
      const response = await api.get(`/admin/reports/export/${type}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_booking_michu.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      alert('Gagal mengunduh file.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse p-4">
          <div className="h-10 bg-gray-200 rounded w-1/3 neo-skeleton border-4 border-neo-dark shadow-[4px_4px_0_0_#1E1E1E]"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]"></div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]"></div>
            <div className="h-80 bg-gray-200 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { summary, popular_rooms, chart_data, occupancy_chart_data, revenue_chart_data, sitter_performance } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowth = (current, last) => {
    if (last === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - last) / last) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const getGrowthColor = (current, last) => {
    if (current >= last) return 'text-[#1E1E1E] bg-[#4ADE80] border-2 border-neo-dark px-2 py-0.5 rounded';
    return 'text-[#1E1E1E] bg-[#FF6B6B] border-2 border-neo-dark px-2 py-0.5 rounded';
  };

  // Occupancy Chart Constants
  const occWidth = 600;
  const occHeight = 240;
  const occPadding = { left: 45, right: 20, top: 20, bottom: 40 };
  const occPlotWidth = occWidth - occPadding.left - occPadding.right;
  const occPlotHeight = occHeight - occPadding.top - occPadding.bottom;

  // Process occupancy data coordinates
  const occupancyPoints = occupancy_chart_data ? occupancy_chart_data.map((item, i) => {
    const x = occPadding.left + (i / (occupancy_chart_data.length - 1)) * occPlotWidth;
    const y = occHeight - occPadding.bottom - (item.rate / 100) * occPlotHeight;
    return { x, y, ...item };
  }) : [];

  const occupancyLinePath = occupancyPoints.length > 0 
    ? 'M ' + occupancyPoints.map(p => `${p.x},${p.y}`).join(' L ') 
    : '';

  const occupancyAreaPath = occupancyPoints.length > 0 
    ? `${occupancyLinePath} L ${occupancyPoints[occupancyPoints.length - 1].x},${occHeight - occPadding.bottom} L ${occupancyPoints[0].x},${occHeight - occPadding.bottom} Z` 
    : '';

  // Revenue Chart Constants
  const revWidth = 600;
  const revHeight = 240;
  const revPadding = { left: 80, right: 20, top: 25, bottom: 40 };
  const revPlotWidth = revWidth - revPadding.left - revPadding.right;
  const revPlotHeight = revHeight - revPadding.top - revPadding.bottom;

  const maxRevenueVal = revenue_chart_data 
    ? Math.max(...revenue_chart_data.map(d => d.total), 100000) 
    : 100000;

  const revenueBars = revenue_chart_data ? revenue_chart_data.map((item, i) => {
    const barWidth = 32;
    const x = revPadding.left + (i / (revenue_chart_data.length - 1)) * (revPlotWidth - barWidth) + barWidth / 2;
    
    const boardHeight = (item.board / maxRevenueVal) * revPlotHeight;
    const sitterHeight = (item.sitter / maxRevenueVal) * revPlotHeight;
    
    const yBoard = revHeight - revPadding.bottom - boardHeight;
    const ySitter = yBoard - sitterHeight;
    
    return {
      x,
      barWidth,
      yBoard,
      ySitter,
      boardHeight,
      sitterHeight,
      ...item
    };
  }) : [];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 border-b-4 border-neo-dark pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Award size={36} className="text-neo-pink bg-neo-yellow border-4 border-neo-dark p-1.5 rounded-xl shadow-[2px_2px_0_0_#1E1E1E]" />
            <h1 className="text-4xl font-black uppercase tracking-tight">Reports & Analytics</h1>
          </div>
          <p className="text-gray-600 font-medium text-lg">Interactive real-time monitoring of MeowStay business operations and metrics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('excel')}
            className="neo-btn bg-[#10B981] hover:bg-[#059669] text-white flex items-center gap-2"
          >
            <DollarSign size={20} />
            Download Excel
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="neo-btn bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center gap-2"
          >
            <Activity size={20} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-[#4ADE80] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1E1E1E] transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="font-black text-xs uppercase tracking-wider bg-white border-2 border-neo-dark px-2 py-1 rounded">REVENUE BULAN INI</span>
            {summary.revenue.current >= summary.revenue.last ? <TrendingUp size={24} className="stroke-[3]" /> : <TrendingDown size={24} className="stroke-[3]" />}
          </div>
          <p className="font-black text-3xl mb-3 text-neo-dark leading-none">{formatCurrency(summary.revenue.current)}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${getGrowthColor(summary.revenue.current, summary.revenue.last)}`}>
              {getGrowth(summary.revenue.current, summary.revenue.last)}
            </span>
            <span className="text-xs font-bold text-neo-dark opacity-80">vs bulan lalu</span>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="bg-neo-yellow p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1E1E1E] transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="font-black text-xs uppercase tracking-wider bg-white border-2 border-neo-dark px-2 py-1 rounded">BOOKINGS BULAN INI</span>
            <CalendarCheck size={24} className="stroke-[3]" />
          </div>
          <p className="font-black text-3xl mb-3 text-neo-dark leading-none">{summary.bookings.current}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${getGrowthColor(summary.bookings.current, summary.bookings.last)}`}>
              {getGrowth(summary.bookings.current, summary.bookings.last)}
            </span>
            <span className="text-xs font-bold text-neo-dark opacity-80">vs bulan lalu</span>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-[#B983FF] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1E1E1E] transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="font-black text-xs uppercase tracking-wider bg-white border-2 border-neo-dark px-2 py-1 rounded">PELANGGAN BARU</span>
            <Users size={24} className="stroke-[3]" />
          </div>
          <p className="font-black text-3xl mb-3 text-neo-dark leading-none">{summary.users.current}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${getGrowthColor(summary.users.current, summary.users.last)}`}>
              {getGrowth(summary.users.current, summary.users.last)}
            </span>
            <span className="text-xs font-bold text-neo-dark opacity-80">vs bulan lalu</span>
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="bg-[#FF9B50] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1E1E1E] transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="font-black text-xs uppercase tracking-wider bg-white border-2 border-neo-dark px-2 py-1 rounded">OCCUPANCY RATE</span>
            <Cat size={24} className="stroke-[3]" />
          </div>
          <p className="font-black text-3xl mb-3 text-neo-dark leading-none">{summary.occupancy}%</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-white border-2 border-neo-dark px-2 py-0.5 rounded">Target: 85%</span>
            <span className="text-xs font-bold text-neo-dark opacity-80">Kamar Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        
        {/* CHART 1: 30-Day Daily Room Occupancy Timeline */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Activity className="text-neo-pink stroke-[3]" size={20} />
              <h2 className="text-2xl font-black uppercase">Occupancy Timeline (30 Hari)</h2>
            </div>
            <span className="text-xs font-black bg-gray-100 border-2 border-neo-dark px-2 py-1 rounded">REAL-TIME OCCUPANCY</span>
          </div>

          <div className="relative h-60 w-full mt-4">
            {/* Custom Responsive SVG Curve Chart */}
            <svg viewBox={`0 0 ${occWidth} ${occHeight}`} className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((pct, idx) => {
                const y = occHeight - occPadding.bottom - (pct / 100) * occPlotHeight;
                return (
                  <g key={idx}>
                    <line 
                      x1={occPadding.left} 
                      y1={y} 
                      x2={occWidth - occPadding.right} 
                      y2={y} 
                      stroke="#E5E7EB" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={occPadding.left - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="text-[10px] font-black fill-gray-400"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Area Shading under the curve */}
              {occupancyPoints.length > 0 && (
                <path 
                  d={occupancyAreaPath} 
                  fill="url(#occGrad)" 
                />
              )}

              {/* Curve Line */}
              {occupancyPoints.length > 0 && (
                <path 
                  d={occupancyLinePath} 
                  fill="none" 
                  stroke="#B983FF" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Active hover crosshair and point */}
              {activeOccupancyIdx !== null && occupancyPoints[activeOccupancyIdx] && (
                <g>
                  {/* Vertical indicator line */}
                  <line 
                    x1={occupancyPoints[activeOccupancyIdx].x} 
                    y1={occPadding.top} 
                    x2={occupancyPoints[activeOccupancyIdx].x} 
                    y2={occHeight - occPadding.bottom} 
                    stroke="#1E1E1E" 
                    strokeWidth="2" 
                    strokeDasharray="2 2" 
                  />
                  {/* Glowing core dot */}
                  <circle 
                    cx={occupancyPoints[activeOccupancyIdx].x} 
                    cy={occupancyPoints[activeOccupancyIdx].y} 
                    r="8" 
                    fill="#B983FF" 
                    stroke="#1E1E1E" 
                    strokeWidth="3" 
                  />
                </g>
              )}

              {/* Custom Tooltip Slices (hover targets) */}
              {occupancyPoints.map((p, idx) => {
                const sliceWidth = occPlotWidth / occupancyPoints.length;
                return (
                  <rect
                    key={idx}
                    x={p.x - sliceWidth / 2}
                    y={occPadding.top}
                    width={sliceWidth}
                    height={occPlotHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setActiveOccupancyIdx(idx)}
                    onMouseLeave={() => setActiveOccupancyIdx(null)}
                  />
                );
              })}

              {/* X Axis Labels */}
              {occupancyPoints.filter((_, idx) => idx % 6 === 0 || idx === occupancyPoints.length - 1).map((p, idx) => (
                <text 
                  key={idx}
                  x={p.x} 
                  y={occHeight - occPadding.bottom + 20} 
                  textAnchor="middle" 
                  className="text-[10px] font-black fill-gray-500"
                >
                  {p.date}
                </text>
              ))}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B983FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#B983FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Custom Interactive Floating Tooltip HTML Overlay */}
            <AnimatePresence>
              {activeOccupancyIdx !== null && occupancyPoints[activeOccupancyIdx] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute z-20 bg-white border-4 border-neo-dark p-3 rounded-lg shadow-[4px_4px_0_0_#1E1E1E] pointer-events-none"
                  style={{
                    left: `${Math.min(75, Math.max(10, (occupancyPoints[activeOccupancyIdx].x / occWidth) * 100))}%`,
                    top: '20px'
                  }}
                >
                  <p className="font-black text-xs text-gray-400 uppercase tracking-wider">{occupancyPoints[activeOccupancyIdx].date}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2.5 h-2.5 bg-[#B983FF] border-2 border-neo-dark rounded-full"></div>
                    <p className="font-black text-sm">Occupancy: <span className="text-neo-pink">{occupancyPoints[activeOccupancyIdx].rate}%</span></p>
                  </div>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{occupancyPoints[activeOccupancyIdx].bookings} Active Bookings</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CHART 2: 6-Month Monthly Revenue Split (Board vs Sitter) */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="text-neo-yellow stroke-[3]" size={20} />
              <h2 className="text-2xl font-black uppercase">Revenue Split (6 Bulan)</h2>
            </div>
            {/* Chart Legend badges */}
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-black bg-white border-2 border-neo-dark px-2 py-1 rounded">
                <span className="w-2.5 h-2.5 bg-[#FF9B50] border-2 border-neo-dark rounded-full"></span> Boarding
              </span>
              <span className="flex items-center gap-1.5 text-xs font-black bg-white border-2 border-neo-dark px-2 py-1 rounded">
                <span className="w-2.5 h-2.5 bg-[#4ADE80] border-2 border-neo-dark rounded-full"></span> Sitter
              </span>
            </div>
          </div>

          <div className="relative h-60 w-full mt-4">
            {/* Custom Stacked Bar Chart SVG */}
            <svg viewBox={`0 0 ${revWidth} ${revHeight}`} className="w-full h-full overflow-visible">
              {/* Y Axis Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = revHeight - revPadding.bottom - pct * revPlotHeight;
                const valueStr = formatCurrency(pct * maxRevenueVal);
                return (
                  <g key={idx}>
                    <line 
                      x1={revPadding.left} 
                      y1={y} 
                      x2={revWidth - revPadding.right} 
                      y2={y} 
                      stroke="#E5E7EB" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={revPadding.left - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="text-[9px] font-black fill-gray-400"
                    >
                      {pct === 1 ? 'Max' : valueStr}
                    </text>
                  </g>
                );
              })}

              {/* Drawing bars */}
              {revenueBars.map((bar, idx) => {
                const isHovered = activeRevenueIdx === idx;
                return (
                  <g key={idx}>
                    {/* Boarding Stack (Bottom part - Orange) */}
                    {bar.boardHeight > 0 && (
                      <motion.rect
                        x={bar.x - bar.barWidth / 2}
                        y={bar.yBoard}
                        width={bar.barWidth}
                        height={bar.boardHeight}
                        fill="#FF9B50"
                        stroke="#1E1E1E"
                        strokeWidth="3"
                        rx="4"
                        animate={{
                          scale: isHovered ? 1.05 : 1,
                          opacity: activeRevenueIdx !== null && !isHovered ? 0.6 : 1
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    )}

                    {/* Sitter Stack (Top part - Green) */}
                    {bar.sitterHeight > 0 && (
                      <motion.rect
                        x={bar.x - bar.barWidth / 2}
                        y={bar.ySitter}
                        width={bar.barWidth}
                        height={bar.sitterHeight}
                        fill="#4ADE80"
                        stroke="#1E1E1E"
                        strokeWidth="3"
                        rx="4"
                        animate={{
                          scale: isHovered ? 1.05 : 1,
                          opacity: activeRevenueIdx !== null && !isHovered ? 0.6 : 1
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    )}

                    {/* Hover Target Invisible slice */}
                    <rect
                      x={bar.x - bar.barWidth}
                      y={revPadding.top}
                      width={bar.barWidth * 2}
                      height={revPlotHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveRevenueIdx(idx)}
                      onMouseLeave={() => setActiveRevenueIdx(null)}
                    />

                    {/* X Axis label centered */}
                    <text 
                      x={bar.x} 
                      y={revHeight - revPadding.bottom + 20} 
                      textAnchor="middle" 
                      className={`text-xs font-black transition-colors ${isHovered ? 'fill-neo-dark' : 'fill-gray-500'}`}
                    >
                      {bar.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Floating Tooltip HTML Overlay */}
            <AnimatePresence>
              {activeRevenueIdx !== null && revenueBars[activeRevenueIdx] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute z-20 bg-white border-4 border-neo-dark p-3 rounded-lg shadow-[4px_4px_0_0_#1E1E1E] pointer-events-none"
                  style={{
                    left: `${Math.min(75, Math.max(10, (revenueBars[activeRevenueIdx].x / revWidth) * 100))}%`,
                    top: '15px'
                  }}
                >
                  <p className="font-black text-xs text-gray-400 uppercase tracking-wider">{revenueBars[activeRevenueIdx].month}</p>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#FF9B50] border-2 border-neo-dark rounded-full"></div>
                        <span className="text-xs font-bold text-gray-500">Boarding</span>
                      </div>
                      <span className="font-black text-xs">{formatCurrency(revenueBars[activeRevenueIdx].board)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-[#4ADE80] border-2 border-neo-dark rounded-full"></div>
                        <span className="text-xs font-bold text-gray-500">Sitter</span>
                      </div>
                      <span className="font-black text-xs">{formatCurrency(revenueBars[activeRevenueIdx].sitter)}</span>
                    </div>
                    <div className="border-t-2 border-dashed border-gray-300 pt-1.5 flex items-center justify-between gap-4">
                      <span className="text-xs font-black text-neo-dark">Total</span>
                      <span className="font-black text-sm text-[#10B981]">{formatCurrency(revenueBars[activeRevenueIdx].total)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Breakdowns & Leaderboard Row */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        
        {/* SECTION 3: Sitter Performance Leaderboard */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex items-center gap-2 mb-6 border-b-4 border-neo-dark pb-3">
            <Award className="text-[#FF9B50] stroke-[3]" size={24} />
            <h2 className="text-2xl font-black uppercase">Top Performing Sitters</h2>
          </div>

          <div className="space-y-4">
            {(!sitter_performance || sitter_performance.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                <Cat size={40} className="text-gray-300 mb-2 stroke-[1.5]" />
                <p className="text-gray-400 font-bold italic">Belum ada sitter terdaftar yang menyelesaikan kunjungan.</p>
              </div>
            ) : (
              sitter_performance.map((sitter, idx) => (
                <div 
                  key={sitter.id}
                  className="bg-white border-4 border-neo-dark rounded-xl p-4 flex items-center justify-between gap-4 shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0_0_0_0_#1E1E1E] transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank initials badge */}
                    <div className={`w-12 h-12 rounded-full border-4 border-neo-dark flex items-center justify-center font-black text-lg ${
                      idx === 0 ? 'bg-neo-yellow' : idx === 1 ? 'bg-[#4ADE80]' : 'bg-[#B983FF]'
                    }`}>
                      {sitter.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-lg text-neo-dark">{sitter.name}</p>
                        <span className="flex items-center gap-0.5 bg-yellow-100 text-yellow-800 border-2 border-neo-dark px-1.5 py-0.5 rounded font-black text-[10px]">
                          <Star size={10} className="fill-yellow-600 stroke-yellow-800" />
                          {parseFloat(sitter.rating).toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-bold mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="stroke-[2.5]" /> {sitter.area}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 border-2 border-neo-dark px-1.5 rounded text-[10px] text-neo-dark uppercase font-black">
                          {sitter.speciality}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 border-2 border-neo-dark rounded-lg px-2 py-0.5 font-black text-[10px] uppercase mb-1">
                      {sitter.completed_visits} Kunjungan
                    </span>
                    <p className="font-black text-lg text-[#10B981] leading-none">{formatCurrency(sitter.total_earnings)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 4: Room popularity & breakdowns */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 border-b-4 border-neo-dark pb-3">
              <Cat className="text-[#B983FF] stroke-[3]" size={24} />
              <h2 className="text-2xl font-black uppercase">Revenue per Layanan</h2>
            </div>
            <div className="space-y-6">
              {/* Boarding Revenue Progress */}
              <div>
                <div className="flex justify-between font-black mb-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-[#FF9B50] border-2 border-neo-dark rounded"></span> Cat Boarding
                  </span>
                  <span>{formatCurrency(summary.revenue.board)} ({summary.revenue.current > 0 ? Math.round((summary.revenue.board / summary.revenue.current) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-8 bg-gray-200 border-4 border-neo-dark rounded-xl overflow-hidden shadow-[2px_2px_0_0_#1E1E1E]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.revenue.current > 0 ? (summary.revenue.board / summary.revenue.current) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[#FF9B50] rounded-r-lg border-r-4 border-neo-dark"
                  ></motion.div>
                </div>
              </div>

              {/* Sitter Revenue Progress */}
              <div>
                <div className="flex justify-between font-black mb-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-[#4ADE80] border-2 border-neo-dark rounded"></span> Cat Sitter
                  </span>
                  <span>{formatCurrency(summary.revenue.sitter)} ({summary.revenue.current > 0 ? Math.round((summary.revenue.sitter / summary.revenue.current) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-8 bg-gray-200 border-4 border-neo-dark rounded-xl overflow-hidden shadow-[2px_2px_0_0_#1E1E1E]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.revenue.current > 0 ? (summary.revenue.sitter / summary.revenue.current) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[#4ADE80] rounded-r-lg border-r-4 border-neo-dark"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t-4 border-neo-dark pt-6">
            <h3 className="font-black text-lg uppercase mb-4 flex items-center gap-2">
              <Award size={18} className="text-[#FF9B50]" /> Kamar Terpopuler
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {popular_rooms.map((room, i) => (
                <div 
                  key={room.id}
                  className="bg-white border-2 border-neo-dark p-3 rounded-xl text-center shadow-[2px_2px_0_0_#1E1E1E]"
                >
                  <div className={`w-8 h-8 rounded-full border-2 border-neo-dark flex items-center justify-center font-black mx-auto mb-2 text-xs ${
                    i === 0 ? 'bg-neo-yellow' : i === 1 ? 'bg-[#4ADE80]' : 'bg-[#B983FF]'
                  }`}>
                    #{i + 1}
                  </div>
                  <p className="font-black text-xs truncate">{room.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{room.bookings_count} Bookings</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
