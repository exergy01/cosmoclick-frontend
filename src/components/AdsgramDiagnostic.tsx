// components/AdsgramDiagnostic.tsx

import React, { useState, useEffect } from 'react';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

const AdsgramDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [blockId, setBlockId] = useState('12355');

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setResults([]);
    setIsRunning(true);

    try {
      // Шаг 1: Проверка окружения
      addResult({
        step: '1',
        status: 'loading',
        message: 'Проверка окружения...'
      });

      const envInfo = {
        isTelegram: !!(window as any).Telegram?.WebApp,
        url: window.location.href,
        userAgent: navigator.userAgent,
        protocol: window.location.protocol
      };

      addResult({
        step: '1',
        status: 'success',
        message: 'Окружение проверено',
        details: envInfo
      });

      // Шаг 2: Проверка существующих скриптов
      addResult({
        step: '2',
        status: 'loading',
        message: 'Проверка существующих скриптов...'
      });

      const existingScripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      const adsgramScripts = existingScripts.filter(src => src.includes('adsgram'));

      addResult({
        step: '2',
        status: adsgramScripts.length > 0 ? 'success' : 'error',
        message: `Найдено Adsgram скриптов: ${adsgramScripts.length}`,
        details: adsgramScripts
      });

      // Шаг 3: Проверка window.Adsgram
      addResult({
        step: '3',
        status: 'loading',
        message: 'Проверка window.Adsgram...'
      });

      const hasAdsgram = !!(window as any).Adsgram;
      addResult({
        step: '3',
        status: hasAdsgram ? 'success' : 'error',
        message: hasAdsgram ? 'window.Adsgram найден' : 'window.Adsgram НЕ найден'
      });

      // Шаг 4: Попытка загрузки SDK
      if (!hasAdsgram) {
        addResult({
          step: '4',
          status: 'loading',
          message: 'Попытка загрузки SDK...'
        });

        await loadAdsgramSDK();

        const hasAdsgramAfter = !!(window as any).Adsgram;
        addResult({
          step: '4',
          status: hasAdsgramAfter ? 'success' : 'error',
          message: hasAdsgramAfter ? 'SDK загружен успешно' : 'Не удалось загрузить SDK'
        });
      }

      // Шаг 5: Попытка инициализации
      if ((window as any).Adsgram) {
        addResult({
          step: '5',
          status: 'loading',
          message: 'Попытка инициализации...'
        });

        try {
          const controller = (window as any).Adsgram.init({
            blockId: blockId,
            debug: true
          });

          addResult({
            step: '5',
            status: controller ? 'success' : 'error',
            message: controller ? 'Контроллер создан успешно' : 'Не удалось создать контроллер'
          });

          // Шаг 6: Попытка показа рекламы (тест)
          if (controller) {
            addResult({
              step: '6',
              status: 'loading',
              message: 'Тест показа рекламы...'
            });

            controller.show().then(() => {
              addResult({
                step: '6',
                status: 'success',
                message: 'Реклама показалась успешно!'
              });
            }).catch((error: any) => {
              addResult({
                step: '6',
                status: 'error',
                message: 'Ошибка показа рекламы',
                details: error
              });
            });
          }

        } catch (error) {
          addResult({
            step: '5',
            status: 'error',
            message: 'Ошибка инициализации',
            details: error
          });
        }
      }

    } catch (error) {
      addResult({
        step: 'ERROR',
        status: 'error',
        message: 'Критическая ошибка диагностики',
        details: error
      });
    } finally {
      setIsRunning(false);
    }
  };

  const loadAdsgramSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Пробуем разные URL
      const urls = [
        'https://sad.adsgram.ai/js/adsgram.min.js',
        'https://sad.adsgram.ai/js/sad.min.js'
      ];

      let currentUrlIndex = 0;

      const tryLoad = () => {
        if (currentUrlIndex >= urls.length) {
          reject(new Error('Все URL провалились'));
          return;
        }

        const script = document.createElement('script');
        script.src = urls[currentUrlIndex];
        script.async = true;

        script.onload = () => {
          setTimeout(() => {
            if ((window as any).Adsgram) {
              resolve();
            } else {
              currentUrlIndex++;
              tryLoad();
            }
          }, 1000);
        };

        script.onerror = () => {
          currentUrlIndex++;
          tryLoad();
        };

        document.head.appendChild(script);
      };

      tryLoad();
    });
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.9)',
      border: '2px solid #00f0ff',
      borderRadius: '15px',
      padding: '20px',
      margin: '20px',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ color: '#00f0ff', textAlign: 'center' }}>
        🔍 Диагностика Adsgram
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Block ID для теста:
        </label>
        <input
          type="text"
          value={blockId}
          onChange={(e) => setBlockId(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #00f0ff',
            background: '#222',
            color: 'white'
          }}
          placeholder="Введите Block ID"
        />
      </div>

      <button
        onClick={runDiagnostic}
        disabled={isRunning}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: 'none',
          background: isRunning ? '#666' : 'linear-gradient(45deg, #00f0ff, #0080ff)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRunning ? '🔄 Диагностика...' : '🚀 Запустить диагностику'}
      </button>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${
                result.status === 'success' ? '#4CAF50' :
                result.status === 'error' ? '#f44336' : '#ff9800'
              }`,
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '5px'
            }}>
              <span style={{
                color: result.status === 'success' ? '#4CAF50' :
                       result.status === 'error' ? '#f44336' : '#ff9800',
                fontSize: '18px',
                marginRight: '10px'
              }}>
                {result.status === 'success' ? '✅' :
                 result.status === 'error' ? '❌' : '⏳'}
              </span>
              <strong>Шаг {result.step}:</strong>
              <span style={{ marginLeft: '10px' }}>{result.message}</span>
            </div>
            
            {result.details && (
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdsgramDiagnostic;