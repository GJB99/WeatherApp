export interface PollenTypeInfo {
    code: string;
    indexInfo?: {
      value: number;
      category: string;
    };
    inSeason: boolean;
    healthRecommendations: string[];
  }
  
  export interface PollenAPIResponse {
    dailyInfo: Array<{
      pollenTypeInfo: PollenTypeInfo[];
    }>;
  }