export interface MoonPhase {
    date: string;
    phase: string;
    illumination: number;
  }
  
  export interface MoonAPIResponse {
    phases: MoonPhase[];
  }