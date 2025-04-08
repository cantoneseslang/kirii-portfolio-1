"use client"

import React, { useState, useEffect } from 'react';
import Lunar from 'lunar-javascript';

const ChineseLunar = Lunar.Lunar;


const DashboardDateDisplay = () => {
  // 初期値はnullに設定し、クライアントサイドでのみ更新
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [lunarDate, setLunarDate] = useState<any>(null);
  const [yellowDate, setYellowDate] = useState<string>("");

  useEffect(() => {
    // 初期値を設定
    const now = new Date();
    setCurrentDate(now);
    
    // 中国旧暦の計算
    const lunar = ChineseLunar.fromDate(now);
    setLunarDate(lunar);
    
    // 1秒ごとに更新するタイマー
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);
      
      if (lunarDate) {
        // 干支（十干十二支）の配列
        const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]; // 天干
        const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]; // 地支
        
        // 西暦から干支を計算（簡易的な方法）
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        // 年の干支計算（西暦を使用）
        const yearGanIndex = (year - 4) % 10; // 甲子から数えて4年が基準年
        const yearZhiIndex = (year - 4) % 12;
        const yearGanZhi = tianGan[yearGanIndex] + diZhi[yearZhiIndex];
        
        // 月の干支計算（簡易版）
        const monthGanIndex = (yearGanIndex * 2 + month) % 10;
        const monthZhiIndex = (month + 2) % 12 || 12; // 子月（11月）から始まる
        const monthGanZhi = tianGan[monthGanIndex] + diZhi[monthZhiIndex - 1];
        
        // 日の干支計算（簡易版）
        // 1900年1月31日は辛丑日
        const baseDate = new Date(1900, 0, 31);
        const baseGanIndex = 8; // 辛
        const baseZhiIndex = 1; // 丑
        
        // 基準日からの経過日数を計算
        const days = Math.floor((now.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
        const dayGanIndex = (baseGanIndex + days) % 10;
        const dayZhiIndex = (baseZhiIndex + days) % 12;
        const dayGanZhi = tianGan[dayGanIndex] + diZhi[dayZhiIndex];
        
        // 黄歴の情報を設定
        setYellowDate(`${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日`);
      }
    }, 1000);

    // コンポーネントのアンマウント時にタイマーをクリア
    return () => clearInterval(timer);
  }, [lunarDate]);

  // 日付をフォーマット (YYYY年MM月DD日 曜日)
  const formatDate = () => {
    if (!currentDate) return '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    
    // 中国語の曜日表記
    const chineseWeekDay = ['日', '一', '二', '三', '四', '五', '六'][currentDate.getDay()];
    // 英語の曜日略称
    const englishWeekDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
    
    return `${year}年${month}月${day}日 星期${chineseWeekDay} (${englishWeekDay})`;
  };

  // 時間をフォーマット (HH:MM:SS)
  const formatTime = () => {
    if (!currentDate) return '';
    
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  // 旧暦をフォーマット
  const formatLunar = () => {
    if (!lunarDate) return '';
    
    return `${lunarDate.getYearInChinese()}年 ${lunarDate.getMonthInChinese()}月 ${lunarDate.getDayInChinese()}`;
  };

  // 日の「宜」と「忌」を取得
  const getYiJi = () => {
    if (!lunarDate) return { yi: '', ji: '' };
    
    // lunar-javascriptライブラリから実際のデータを取得
    const yi = lunarDate.getDayYi() || [];
    const ji = lunarDate.getDayJi() || [];
    
    return {
      yi: yi.join(' '),
      ji: ji.join(' ')
    };
  };

  const yiJi = getYiJi();

  // クライアントサイドでのレンダリングのみを行うためのフラグ
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // サーバーサイドレンダリング時は静的な内容を返す
  if (!isClient) {
    return (
      <div className="text-right text-sm">
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="text-right text-sm">
      <div>{formatDate()}</div>
      <div className="text-xl font-bold">{formatTime()}</div>
      <div className="text-xs text-gray-500">{formatLunar()}</div>
      <div className="text-xs text-green-600">宜: {yiJi.yi}</div>
      <div className="text-xs text-red-600">忌: {yiJi.ji}</div>
    </div>
  );
};

export default DashboardDateDisplay;
