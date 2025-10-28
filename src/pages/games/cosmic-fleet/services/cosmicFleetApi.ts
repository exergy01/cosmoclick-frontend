import axios from 'axios';
import { Ship, ShipTemplate } from '../types/ships';
import { CosmicFleetPlayer, LuminiosTransaction } from '../types/luminios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

export interface BattleResult {
  victory: boolean;
  experienceGained: number;
  luminiosReward: number;
  damageReceived: number;
}

export interface ExchangeResponse {
  success: boolean;
  newLuminiosBalance: number;
  newCsBalance: number;
  transaction: LuminiosTransaction;
}

export interface PurchaseShipResponse {
  success: boolean;
  ship: Ship;
  newLuminiosBalance: number;
}

export interface BattleResponse {
  success: boolean;
  result: BattleResult;
  updatedShip: Ship;
  newLuminiosBalance: number;
}

class CosmicFleetApi {
  private getAuthHeaders(telegramId: number) {
    return {
      'Content-Type': 'application/json',
      'X-Telegram-ID': telegramId.toString()
    };
  }

  async getPlayer(telegramId: number): Promise<CosmicFleetPlayer> {
    try {
      const response = await axios.get(
        `${API_URL}/api/cosmic-fleet/user/${telegramId}`,
        { headers: this.getAuthHeaders(telegramId) }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return this.initializePlayer(telegramId);
      }
      throw error;
    }
  }

  async initializePlayer(telegramId: number): Promise<CosmicFleetPlayer> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/user/${telegramId}/init`,
      {},
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async getFleet(telegramId: number): Promise<Ship[]> {
    const response = await axios.get(
      `${API_URL}/api/cosmic-fleet/fleet/${telegramId}`,
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async exchangeCSToLuminios(telegramId: number, csAmount: number): Promise<ExchangeResponse> {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Отправка запроса обмена:', { telegramId, csAmount, types: { telegramId: typeof telegramId, csAmount: typeof csAmount } });
    const response = await axios.post(
      `${API_URL}/api/luminios/exchange`,
      {
        telegramId,
        csAmount
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async purchaseShip(telegramId: number, shipTemplate: ShipTemplate): Promise<PurchaseShipResponse> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/ships/buy`,
      {
        telegramId,
        shipTemplateId: shipTemplate.id,
        price: shipTemplate.price
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async repairShip(telegramId: number, shipId: string): Promise<{ success: boolean; ship: Ship; cost: number }> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/ships/repair`,
      {
        telegramId,
        shipId
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async battlePvE(telegramId: number, shipId: string): Promise<BattleResponse> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/battle/pve`,
      {
        telegramId,
        shipId
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async battleBot(telegramId: number, difficulty: string = 'medium', adaptive: boolean = true): Promise<any> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/battles/bot`,
      {
        telegramId,
        difficulty,
        adaptive
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async getLuminiosBalance(telegramId: number): Promise<number> {
    const response = await axios.get(
      `${API_URL}/api/luminios/balance/${telegramId}`,
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data.balance;
  }

  async getLuminiosTransactions(telegramId: number): Promise<LuminiosTransaction[]> {
    const response = await axios.get(
      `${API_URL}/api/luminios/transactions/${telegramId}`,
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data;
  }

  async getLeaderboard(): Promise<CosmicFleetPlayer[]> {
    const response = await axios.get(`${API_URL}/api/cosmic-fleet/leaderboard`);
    return response.data;
  }

  async getFormation(telegramId: number): Promise<{ ships: Ship[]; maxSlots: number }> {
    const response = await axios.get(
      `${API_URL}/api/cosmic-fleet/formation/${telegramId}`,
      { headers: this.getAuthHeaders(telegramId) }
    );
    return {
      ships: response.data.ships || [],
      maxSlots: response.data.max_slots || 5
    };
  }

  async setFormation(telegramId: number, shipIds: (string | null)[]): Promise<boolean> {
    const response = await axios.post(
      `${API_URL}/api/cosmic-fleet/formation/set`,
      {
        telegramId,
        shipIds
      },
      { headers: this.getAuthHeaders(telegramId) }
    );
    return response.data.success;
  }
}

export const cosmicFleetApi = new CosmicFleetApi();