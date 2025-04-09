declare module 'lunar-javascript' {
  namespace Lunar {
    class Lunar {
      static fromDate(date: Date): Lunar;
      getYearInChinese(): string;
      getMonthInChinese(): string;
      getDayInChinese(): string;
      
      // 干支暦（黄暦）関連のメソッド
      getYearGan(): string;  // 年の十干（甲、乙、丙、丁...）
      getYearZhi(): string;  // 年の十二支（子、丑、寅、卯...）
      getMonthGan(): string; // 月の十干
      getMonthZhi(): string; // 月の十二支
      getDayGan(): string;   // 日の十干
      getDayZhi(): string;   // 日の十二支
    }
  }
  export = Lunar;
}
