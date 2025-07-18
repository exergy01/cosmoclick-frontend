// galactic-slots/utils/formatters.ts

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
  
  export const formatGameTime = (dateString: string | Date, format: 'short' | 'full' = 'full'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (format === 'short') {
      return `${day}.${month}, ${hours}:${minutes}`;
    } else {
      const year = date.getFullYear().toString().slice(-2);
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    }
  };
  
  export const formatShortDate = (dateString: string): string => {
    return formatGameTime(dateString, 'short');
  };
  
  export const formatNumber = (num: number): string => {
    return num.toLocaleString('ru-RU');
  };
  
  export const formatProfit = (profit: number): string => {
    if (profit > 0) {
      return `+${formatNumber(profit)}`;
    } else if (profit < 0) {
      return formatNumber(profit);
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
  };
  
  export const formatCurrency = (amount: number, currency: string = 'CCC'): string => {
    return `${formatNumber(amount)} ${currency}`;
  };
  
  export const formatWinMessage = (winAmount: number, betAmount: number, template: string): string => {
    const multiplier = Math.round(winAmount / betAmount);
    return formatTranslation(template, {
      amount: formatNumber(winAmount),
      multiplier: multiplier.toString()
    });
  };
  
  export const formatBalance = (balance: number): string => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toString();
  };