// pages/admin/components/QuestCreator.tsx
import React, { useState } from 'react';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface QuestCreatorProps {
  colorStyle: string;
  onQuestCreated: (message: string) => void;
}

const QuestCreator: React.FC<QuestCreatorProps> = ({
  colorStyle,
  onQuestCreated
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quest_key: '',
    quest_type: 'partner_link',
    reward_cs: '100',
    url: '',
    timer_seconds: '30',
    target_languages: '',
    sort_order: '100',
    quest_name_ru: '',
    description_ru: '',
    quest_name_en: '',
    description_en: ''
  });

  const questTypes = [
    { value: 'partner_link', label: 'Партнерская ссылка' },
    { value: 'telegram_channel', label: 'Telegram канал' },
    { value: 'social_media', label: 'Социальные сети' },
    { value: 'daily_bonus', label: 'Ежедневный бонус' },
    { value: 'referral', label: 'Реферальное задание' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quest_key.trim() || !formData.quest_name_ru.trim()) {
      alert('❌ Заполните обязательные поля: ключ задания и название на русском');
      return;
    }

    setLoading(true);
    
    try {
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const questData = {
        quest_key: formData.quest_key.trim(),
        quest_type: formData.quest_type,
        reward_cs: parseInt(formData.reward_cs),
        quest_data: {
          url: formData.url.trim() || 'https://example.com',
          timer_seconds: parseInt(formData.timer_seconds)
        },
        target_languages: formData.target_languages.trim() 
          ? formData.target_languages.split(',').map(s => s.trim()) 
          : null,
        sort_order: parseInt(formData.sort_order),
        translations: {
          ru: {
            quest_name: formData.quest_name_ru.trim(),
            description: formData.description_ru.trim() || 'Описание задания'
          },
          en: {
            quest_name: formData.quest_name_en.trim() || formData.quest_name_ru.trim(),
            description: formData.description_en.trim() || formData.description_ru.trim() || 'Quest description'
          }
        }
      };
      
      const response = await axios.post(`${apiUrl}/api/admin/quests/create/${adminId}`, questData);
      
      if (response.data.success) {
        onQuestCreated(`✅ Задание создано: ${formData.quest_key}`);
        
        // Очищаем форму
        setFormData({
          quest_key: '',
          quest_type: 'partner_link',
          reward_cs: '100',
          url: '',
          timer_seconds: '30',
          target_languages: '',
          sort_order: '100',
          quest_name_ru: '',
          description_ru: '',
          quest_name_en: '',
          description_en: ''
        });
        
        setIsExpanded(false);
      } else {
        onQuestCreated(`❌ Ошибка создания: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('❌ Ошибка создания задания:', error);
      onQuestCreated(`❌ Создание задания: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          color: colorStyle, 
          marginTop: 0, 
          marginBottom: '15px', 
          fontSize: '1.1rem' 
        }}>
          🛠️ Конструктор заданий
        </h3>
        
        <p style={{ color: '#aaa', marginBottom: '15px', fontSize: '0.9rem' }}>
          Создавайте новые задания с полной настройкой переводов и параметров
        </p>
        
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            padding: '12px 24px',
            background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🚀 Открыть конструктор
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: colorStyle, 
          margin: 0, 
          fontSize: '1.1rem' 
        }}>
          🛠️ Конструктор заданий
        </h3>
        
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ❌ Свернуть
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          
          {/* Ключ задания */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              🔑 Ключ задания *
            </label>
            <input
              type="text"
              value={formData.quest_key}
              onChange={(e) => setFormData(prev => ({ ...prev, quest_key: e.target.value }))}
              placeholder="unique_quest_key"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          
          {/* Тип задания */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              📋 Тип задания
            </label>
            <select
              value={formData.quest_type}
              onChange={(e) => setFormData(prev => ({ ...prev, quest_type: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            >
              {questTypes.map(type => (
                <option key={type.value} value={type.value} style={{ background: '#1a1a2e', color: '#fff' }}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Награда */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              💰 Награда CS
            </label>
            <input
              type="number"
              min="1"
              value={formData.reward_cs}
              onChange={(e) => setFormData(prev => ({ ...prev, reward_cs: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* URL */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              🔗 URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        {/* Переводы */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          
          {/* Русский */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              🇷🇺 Название (русский) *
            </label>
            <input
              type="text"
              value={formData.quest_name_ru}
              onChange={(e) => setFormData(prev => ({ ...prev, quest_name_ru: e.target.value }))}
              placeholder="Название задания"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
              required
            />
            <textarea
              value={formData.description_ru}
              onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
              placeholder="Описание задания"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                marginTop: '5px',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Английский */}
          <div>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
              🇺🇸 Название (английский)
            </label>
            <input
              type="text"
              value={formData.quest_name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, quest_name_en: e.target.value }))}
              placeholder="Quest name"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
              placeholder="Quest description"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                marginTop: '5px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
        
        {/* Кнопка создания */}
        <button
          type="submit"
          disabled={loading || !formData.quest_key.trim() || !formData.quest_name_ru.trim()}
          style={{
            width: '100%',
            padding: '12px',
            background: loading || !formData.quest_key.trim() || !formData.quest_name_ru.trim()
              ? 'rgba(255, 255, 255, 0.1)'
              : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: loading || !formData.quest_key.trim() || !formData.quest_name_ru.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? '⏳ Создание задания...' : '🚀 Создать задание'}
        </button>
      </form>
    </div>
  );
};

export default QuestCreator;