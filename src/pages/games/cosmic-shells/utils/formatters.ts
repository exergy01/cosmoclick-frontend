 
// cosmic-shells/utils/formatters.ts

export const formatDate = (dateString: string, locale: string = 'ru-RU'): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  export const formatShortDate = (dateString: string): string => {
    return formatDate(dateString).slice(0, 8); // Только дата без времени
  };
  
  export const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  export const formatProfit = (profit: number): string => {
    if (profit > 0) {
      return `+${formatNumber(profit)}`;
    } else if (profit < 0) {
      return formatNumber(profit); // Минус уже есть в числе
    } else {
      return '0';
    }
  };
  
  export const getProfitColor = (profit: number): string => {
    if (profit > 0) return '#00ff00';
    if (profit < 0) return '#ff0000';
    return '#ffffff';
  };
  
  export const formatTranslation = (template: string, values: Record<string, string | number>): string => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key]?.toString() || match;
    });
  };export {}; 
