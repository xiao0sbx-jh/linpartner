/**
 * 把后端返回的时间格式化成 YYYY-MM-DD HH:mm
 * 后端用 Jackson 序列化 Date，默认格式可能是时间戳或 ISO 字符串，这里都兼容
 */
export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * 把 Date 对象转成后端能接收的 "YYYY-MM-DD HH:mm:ss" 字符串
 * DatePicker 传的是 dayjs 对象，调用前先 .toDate()
 */
export function toBackendDateTime(date) {
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
