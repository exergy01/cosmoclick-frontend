// pages/admin/components/AdminStatsCard.tsx
import React from 'react';
import type { AdminStatsCardProps } from '../types';

// Вспомогательная функция для безопасного форматирования чисел
const formatValue = (value: string | number, suffix?: string): string => {
  try {
    if (typeof value === 'string') {
      // Если это уже отформатированная строка (например, "$3.45"), возвращаем как есть
      if (value.includes('$') || value.includes('CS') || value === 'Не загружен') {
        return value;
      }
      // Иначе пытаемся преобразовать в число
      const num = parseFloat(value);
      if (isNaN(num)) {
        return value; // Возвращаем исходную строку если не число
      }
      return num.toLocaleString() + (suffix || '');
    }
    
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return '0' + (suffix || '');
      }
      return value.toLocaleString() + (suffix || '');
    }
    
    return String(value) + (suffix || '');
  } catch (error) {
    console.warn('Ошибка форматирования значения:', value, error);
    return '0' + (suffix || '');
  }
};

const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  icon,
  data,
  colorStyle,
  onClick,
  loading = false
}) => {
  return (
    <div 
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '12px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Фоновый эффект */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-20px',
        fontSize: '4rem',
        opacity: 0.08,
        color: colorStyle,
        transform: 'rotate(15deg)',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {icon}
      </div>

      {/* Заголовок */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '15px',
        position: 'relative',
        zIndex: 1
      }}>
        <span style={{ 
          fontSize: '1.3rem',
          filter: `drop-shadow(0 0 8px ${colorStyle})`
        }}>
          {icon}
        </span>
        <h3 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textShadow: `0 0 10px ${colorStyle}40`
        }}>
          {title}
        </h3>
      </div>

      {/* Загрузка */}
      {loading ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          fontSize: '0.9rem'
        }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            fontSize: '1.5rem',
            marginBottom: '8px'
          }}>
            ⏳
          </div>
          <div>Загрузка...</div>
        </div>
      ) : (
        /* Данные */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto', 
          gap: '12px 16px', 
          fontSize: '0.9rem',
          position: 'relative',
          zIndex: 1,
          flex: 1
        }}>
          {data.map((item, index) => (
            <React.Fragment key={index}>
              <div style={{ 
                color: '#e0e0e0',
                fontWeight: '500'
              }}>
                {item.label}:
              </div>
              <div style={{ 
                fontWeight: 'bold',
                color: item.color || '#fff',
                textAlign: 'right',
                fontSize: '1rem',
                textShadow: item.color ? `0 0 8px ${item.color}40` : 'none'
              }}>
                {formatValue(item.value, item.suffix)}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Индикатор клика */}
      {onClick && !loading && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '0.7rem',
          color: `${colorStyle}60`,
          fontStyle: 'italic',
          opacity: 0.8
        }}>
          Подробнее →
        </div>
      )}
    </div>
  );
};

export default AdminStatsCard;