'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Palette, Sparkles, ArrowRight } from 'lucide-react';
import { paintColors } from '@/lib/data/colors-data';

export default function ColorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<typeof paintColors[0] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredColors = paintColors.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.hex.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', ...Array.from(new Set(paintColors.map(c => c.category)))];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(139, 92, 246, 0.08))',
        borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-2xl)',
        marginBottom: 'var(--spacing-xl)', border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <Palette size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto var(--spacing-md)' }} />
        <h2 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, marginBottom: 8 }}>
          Bảng Mã Màu Sơn Tĩnh Điện
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-lg)' }}>
          AkzoNobel Interpon — Tiêu chuẩn chất lượng hàng đầu thế giới
        </p>
        <div className="search-box" style={{ maxWidth: 500, margin: '0 auto' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm theo mã màu, tên hoặc HEX..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: 'var(--font-base)', padding: '14px 14px 14px 44px' }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat === 'all' ? 'Tất cả' : cat}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {filteredColors.length} màu
        </span>
      </div>

      {/* Color Grid */}
      <div className="grid-4">
        {filteredColors.map(color => (
          <div
            key={color.code}
            className="color-swatch"
            onClick={() => setSelectedColor(selectedColor?.code === color.code ? null : color)}
          >
            <div className="swatch-preview" style={{ background: color.hex }} />
            <div className="swatch-info">
              <div className="swatch-code">{color.code}</div>
              <div className="swatch-name">{color.name}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                {color.hex} · {color.gloss}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-tertiary)' }}>
          <Search size={48} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.3 }} />
          <p>Không tìm thấy màu phù hợp. Thử nhập mã màu khác.</p>
        </div>
      )}

      {/* Color Detail Modal */}
      {selectedColor && (
        <div className="modal-overlay" onClick={() => setSelectedColor(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedColor.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedColor(null)}>✕</button>
            </div>
            
            <div style={{ 
              height: 160, borderRadius: 'var(--radius-md)', 
              background: selectedColor.hex, marginBottom: 'var(--spacing-lg)',
              boxShadow: `0 10px 40px ${selectedColor.hex}60`
            }} />

            <div className="contract-terms">
              <div className="term-row">
                <span className="term-label">Mã Màu</span>
                <span className="term-value">{selectedColor.code}</span>
              </div>
              <div className="term-row">
                <span className="term-label">HEX</span>
                <span className="term-value" style={{ fontFamily: 'monospace' }}>{selectedColor.hex}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Danh mục</span>
                <span className="term-value">{selectedColor.category}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Độ bóng</span>
                <span className="term-value">{selectedColor.gloss}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Bề mặt</span>
                <span className="term-value">{selectedColor.surface}</span>
              </div>
              <div className="term-row">
                <span className="term-label">Ứng dụng</span>
                <span className="term-value">{selectedColor.application}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
              <Link href="/rd-tracking/new" className="btn btn-primary" style={{ flex: 1 }}>
                <Sparkles size={16} /> Yêu cầu mẫu thử
              </Link>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedColor(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
