declare module 'suncalc' {
  export interface MoonIllumination {
    fraction: number;
    phase: number; // 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
    angle: number;
  }

  const SunCalc: {
    getMoonIllumination(date: Date): MoonIllumination;
  };

  export default SunCalc;
}
