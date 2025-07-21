// components/WalletConnection.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { useTranslation } from 'react-i18next';

export const WalletConnection = () => {
  const { t } = useTranslation();
  const address = useTonAddress();
  const wallet = useTonWallet();

  // Безопасное получение имени кошелька
  const getWalletName = () => {
    if (!wallet) return '';
    
    // Проверяем разные возможные свойства
    if ('name' in wallet && wallet.name) {
      return wallet.name;
    }
    
    if ('appName' in wallet && wallet.appName) {
      return wallet.appName;
    }
    
    // Пытаемся извлечь из device
    if (wallet.device && 'appName' in wallet.device) {
      return wallet.device.appName;
    }
    
    return 'Unknown Wallet';
  };

  return (
    <div className="wallet-section">
      <TonConnectButton />
      {wallet && address && (
        <div className="wallet-info">
          <p>{t('wallet.connected')}: {getWalletName()}</p>
          <p>{t('wallet.address')}: {address.slice(0, 6)}...{address.slice(-4)}</p>
        </div>
      )}
    </div>
  );
};