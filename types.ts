
export interface Media {
  src: string;
}

export interface Mission {
  codename: string;
  price: string;
  threat: 'Low' | 'Medium' | 'High' | 'Extreme';
  vfm: string;
  duration: string;
  brief: string;
  tacticalBrief: string;
  media: Media[];
  inclusions: string[];
  lockedInclusions: string[];
  intelLevel: number; // 1-5
  optimalSeason: string;
  weather: { temp: string; condition: string; humidity: string };
  transportMode: 'Land' | 'Air' | 'Water' | 'Mixed' | 'Trek';
  stayType: 'Hotel' | 'Resort' | 'Camp' | 'Homestay' | 'Hostel' | 'Villa' | 'Houseboat';
}

export interface PackageData {
  title: string;
  subtitle: string;
  coords: [number, number];
  missions: Mission[];
}

export type SectorKey = 'goa' | 'himachal' | 'rajasthan' | 'kerala' | 'uttarakhand' | 'karnataka' | 'meghalaya';

export interface Packages {
  [key: string]: PackageData;
}

export interface Ethos {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export interface UserProfile {
    credits: number; // Deprecated
    xp: number; // Deprecated
    rank: 'RECRUIT' | 'OPERATIVE' | 'GHOST' | 'LEGEND';
    unlockedMissions: string[];
}

export interface HandlerScript {
  greeting: string[];
  sectorIntro: {[key: string]: string};
  idle: string[];
  idleContext: {[key: string]: string[]};
  proactive: {[key: string]: string[]};
  rageClick: string[];
  highVelocity: string[];
  scrolling: string[];
  hover: string[];
  restricted: string[];
  success: string[];
  formPrompts: {
    askName: string;
    askEmail: string;
    processing: string;
    denied: string;
  };
  tutorial: string[];
}
