/**
 * Hàm tiện ích tập trung để phân giải URL ảnh sản phẩm/tài nguyên.
 * Xử lý các trường hợp:
 * 1. IPFS hash (Qm... / bafy...) → pinata gateway
 * 2. URL cũ lưu trong DB dạng http://localhost:5000/... → rewrite sang backend thực tế
 * 3. URL http/https khác (từ Render, Unsplash...) → giữ nguyên
 * 4. Đường dẫn tương đối (/uploads/...) → thêm backend URL phía trước
 */
export const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

// Pattern khớp các URL localhost/127.0.0.1 cũ có thể được lưu trong DB
const LOCAL_BACKEND_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;

export function resolveImageUrl(path: any, fallback: string = ''): string {
  let resolvedPath = path;
  if (Array.isArray(path)) {
    resolvedPath = path[0];
  }

  if (!resolvedPath || typeof resolvedPath !== 'string' ||
    resolvedPath === 'undefined' || resolvedPath === 'null') {
    return fallback;
  }

  // 1. IPFS protocol prefix
  if (resolvedPath.startsWith('ipfs://')) {
    return resolvedPath.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }

  // 2. IPFS hash (Pinata)
  if (resolvedPath.startsWith('Qm') || resolvedPath.startsWith('bafy')) {
    return `https://gateway.pinata.cloud/ipfs/${resolvedPath}`;
  }

  // 3. URL cũ lưu trong DB: http://localhost:5000/uploads/... → rewrite sang backend thực tế
  if (LOCAL_BACKEND_PATTERN.test(resolvedPath)) {
    return resolvedPath.replace(LOCAL_BACKEND_PATTERN, BACKEND_URL);
  }

  // 4. URL http/https thực tế → giữ nguyên
  if (resolvedPath.startsWith('http')) {
    return resolvedPath;
  }

  // 5. Đường dẫn tương đối (/uploads/...)
  const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
  return `${BACKEND_URL}${cleanPath}`;
}
