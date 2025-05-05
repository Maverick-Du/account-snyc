export function formatTime(timestamp: number): string {
  const seconds = Math.floor(timestamp / 1);
  if (seconds < 60) {
    return `${seconds} 秒 `;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} 分钟 ` + (seconds % 60 > 0 ? `${seconds % 60} 秒` : "");
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时 ` + (minutes % 60 > 0 ? `${minutes % 60} 分钟` : "");
  }
  const days = Math.floor(hours / 24);
  return `${days} 天 ` + (hours % 24 > 0 ? `${hours % 24} 小时` : "");
}
