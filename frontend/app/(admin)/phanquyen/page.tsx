'use client';

import React, { useState } from 'react';
import { ShieldAlert, Save, Info, CheckCircle2, Circle } from 'lucide-react';

interface Permission {
  id: string;
  module: string;
  description: string;
  roles: {
    Admin: boolean;
    NhanVien: boolean;
    KhachHangB2B: boolean;
    KhachHangB2C: boolean;
  };
}

const mockPermissions: Permission[] = [
  {
    id: '1',
    module: 'Quản trị Hệ thống & Bảo mật',
    description: 'Toàn quyền cấu hình máy chủ, phân quyền người dùng và quản lý nhật ký hệ thống (System Logs)',
    roles: { Admin: true, NhanVien: false, KhachHangB2B: false, KhachHangB2C: false }
  },
  {
    id: '2',
    module: 'Bảng điều khiển BI & Analytics',
    description: 'Truy cập các biểu đồ doanh thu, hiệu suất sản xuất và dự báo thị trường AI',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: false }
  },
  {
    id: '3',
    module: 'Quản lý Kho & Chuỗi cung ứng',
    description: 'Quản lý danh mục sản phẩm, kiểm kê tồn kho, và điều phối nhập xuất nguyên vật liệu',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: false }
  },
  {
    id: '4',
    module: 'Quản trị Đối tác & Hợp đồng (B2B)',
    description: 'Quản lý hồ sơ doanh nghiệp, trình ký hợp đồng điện tử và hạn mức tín dụng',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: true }
  },
  {
    id: '5',
    module: 'Phòng Lab R&D & Công thức Sơn',
    description: 'Quản lý công thức pha chế, quy trình thử nghiệm mẫu mới và tiêu chuẩn kỹ thuật',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: false }
  },
  {
    id: '6',
    module: 'Lệnh sản xuất & Quy trình MES',
    description: 'Điều hành dây chuyền sản xuất, gán việc cho kỹ thuật viên và theo dõi tiến độ MES',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: false, KhachHangB2C: false }
  },
  {
    id: '7',
    module: 'Đơn hàng & Theo dõi Logistics',
    description: 'Tạo đơn hàng mới, tra cứu trạng thái vận chuyển và xử lý khiếu nại/đổi trả',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: true }
  },
  {
    id: '8',
    module: 'Catalog Sơn & Visualizer AI',
    description: 'Tra cứu bảng màu thực tế, xem giá niêm yết và trải nghiệm mô phỏng không gian 3D',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: true }
  },
  {
    id: '9',
    module: 'Trung tâm Hỗ trợ & Trợ lý AI',
    description: 'Tương tác với AI Chatbot hỗ trợ kỹ thuật và gửi yêu cầu hỗ trợ trực tiếp (Ticket)',
    roles: { Admin: true, NhanVien: true, KhachHangB2B: true, KhachHangB2C: true }
  },
];

const ROLES = [
  { id: 'Admin', name: 'Admin', color: 'var(--accent-purple)' },
  { id: 'NhanVien', name: 'Nhân viên / Đại lý', color: 'var(--accent-cyan)' },
  { id: 'KhachHangB2B', name: 'Khách B2B (Doanh nghiệp)', color: 'var(--accent-amber)' },
  { id: 'KhachHangB2C', name: 'Khách B2C (Cá nhân)', color: 'var(--accent-emerald)' },
];

export default function PhanQuyenPage() {
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (permId: string, roleId: keyof Permission['roles']) => {
    if (roleId === 'Admin') return;

    setPermissions(permissions.map(p => {
      if (p.id === permId) {
        return {
          ...p,
          roles: {
            ...p.roles,
            [roleId]: !p.roles[roleId]
          }
        };
      }
      return p;
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    alert('Đã lưu cấu hình phân quyền mới xuống hệ thống thành công!');
    setHasChanges(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <h1 style={{ margin: 0, fontSize: 'var(--font-xl)', color: 'var(--text-primary)', fontWeight: 700 }}>Phân quyền tài khoản</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`btn ${hasChanges ? 'btn-primary' : 'btn-ghost'}`}
            style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <Save size={16} /> Lưu cập nhật
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Module Hệ thống</th>
              {ROLES.map(role => (
                <th key={role.id} style={{ textAlign: 'center', color: role.color }}>
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-base)' }}>{perm.module}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', gap: 6, marginTop: 4 }}>
                    <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>{perm.description}</span>
                  </div>
                </td>
                {ROLES.map(role => {
                  const isGranted = perm.roles[role.id as keyof Permission['roles']];
                  const isAdmin = role.id === 'Admin';
                  return (
                    <td key={role.id} style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => togglePermission(perm.id, role.id as keyof Permission['roles'])}
                        className="btn btn-ghost"
                        style={{
                          padding: 8,
                          cursor: isAdmin ? 'not-allowed' : 'pointer',
                          opacity: isAdmin ? 0.5 : 1,
                          color: isGranted ? role.color : 'var(--text-tertiary)'
                        }}
                        title={isAdmin ? 'Quyền Admin là bắt buộc' : 'Thay đổi quyền truy cập'}
                      >
                        {isGranted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
