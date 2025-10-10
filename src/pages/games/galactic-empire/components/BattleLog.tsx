import React, { useEffect, useRef } from 'react';

interface BattleLogProps {
  messages: string[];
}

const BattleLog: React.FC<BattleLogProps> = ({ messages }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="battle-log-container">
      <div className="battle-log-header">ЛОГ БОЯ</div>
      <div className="battle-log" ref={logRef}>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
};

export default BattleLog;
