# Implementation Plan - Redesign of Billing & Shipping UI

This plan covers modernizing and refactoring the UI of two admin pages:
1. **Billing & Receivables Page** (`app/(admin)/thanh-toan/page.tsx`)
2. **Shipping & Delivery Tracking Page** (`app/(admin)/van-chuyen/page.tsx`)

Both pages will be migrated to the premium, responsive design system utilizing Tailwind CSS v4, aligning their visual language with the recently redesigned Order Management dashboard.

---

## Proposed Changes

### 1. Billing & Receivables Page (`frontend/app/(admin)/thanh-toan/page.tsx`)
- **Structure**: Wrap the page in `<div className="space-y-8 animate-in fade-in duration-700">` and add an elegant header section with page description.
- **KPI Metrics Cards**:
  - Re-implement using card wrappers with `bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300`.
  - Add soft gradient backdrops (`bg-[color]12`) and hover scales.
  - Use custom lucide-react icons styled matching each metric category (emerald for revenue, blue for collected, rose for debt, amber for pending counts).
- **Toolbar & Filter TABS**:
  - Style search input with an absolute placed icon and soft background tint.
  - Convert custom raw tabs to the sleek, interactive capsule layout (`p-1 bg-slate-50 rounded-2xl`).
  - Upgrade the "Làm mới dữ liệu" button to use primary ghost styling.
- **Receivables Table**:
  - Restructure under `<div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">`.
  - Apply clean borders, custom font sizing, and padded rows.
  - Use Tailwind badges for payment status (`bg-emerald-50 text-emerald-600` for Paid, `bg-blue-50 text-blue-600` for Partial, etc.).
  - Redesign action buttons (Eye, Wallet) with custom icon triggers and hover indicators.

### 2. Shipping & Delivery Tracking Page (`frontend/app/(admin)/van-chuyen/page.tsx`)
- **List View**:
  - Redesign the 4 KPI transport status cards using matching card wrappers, gradients, and custom lucide-react icons (`Map`, `Truck`, `PackageCheck`, `AlertTriangle`).
  - Align search field and table structure to the new layout tokens.
  - Standardize status badges (e.g. "Đang giao hàng" as amber, "Giao hàng thành công" as green/emerald).
- **Detail View**:
  - **Header**: Beautiful back button styling (`bg-white hover:bg-slate-100 border border-slate-200 shadow-sm rounded-xl`) alongside bold upper-case tracking ID titles.
  - **Visual Route Map**: Refactor the custom track graphic to look highly premium with rounded borders, a slate-themed gradient backdrop, smooth active tracking bars, pulsing indicator nodes, and subtle drop-shadows on the truck icon.
  - **Structured Info Cards**: Convert "Chi tiết lô hàng", "Thông tin vận chuyển", and "Chi tiết phiếu giao" into a responsive layout of grid cards with clean typography and custom icon accents.
  - **Timeline**: Upgrade the vertical timeline layout with clean fonts, explicit dot colors, and subtle left margins for a balanced grid.
  - **Evidence Gallery**: Render delivery images inside custom aspect-ratio boxes with subtle hover zoom effects.
  - **Footer Action Buttons**: Refactor buttons with appropriate branding colors (rose border for calling driver, blue border for sharing location, emerald/solid blue for updating images and confirmation).

---

## Verification Plan

### Manual Verification
- Build checking: Run `npm run build` to verify clean compilation.
- Visual inspection: Run the Next.js dev server and check that page layouts render correctly without any formatting breakages.
