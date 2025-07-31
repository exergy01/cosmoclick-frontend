import React from 'react';

interface AdminStatsCardProps {
  title: string;
  icon: string;
  data: Array<{
    label: string;
    value: string | number;
    color?: string;
    suffix?: string;
  }>;
  colorStyle: string;
  onClick?: () => void;
  loading?: boolean;
}

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
                {typeof item.value === 'number' 
                  ? item.value.toLocaleString() 
                  : item.value
                }{item.suffix || ''}
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

      {/* Эффект свечения при наведении */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(45deg, transparent 30%, ${colorStyle}05 50%, transparent 70%)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        borderRadius: '12px'
      }} />
    </div>
  );
};

// Добавляем анимацию вращения
const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default AdminStatsCard;