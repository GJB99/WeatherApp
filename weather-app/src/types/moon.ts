export interface MoonPhase {
    date: string;
    phase: string;
    moonIllumination: number;
  }
  
  export interface MoonAPIResponse {
    phases: MoonPhase[];
  }