// ランチメニューデータ（広東語）
export const lunchMenuData = {
  today: "今日午餐菜單",
  items: [
    "叉燒飯 - 燒味叉燒配白飯",
    "燒鴨飯 - 燒鴨配白飯",
    "燒鵝飯 - 燒鵝配白飯",
    "燒肉飯 - 燒肉配白飯",
    "燒雞飯 - 燒雞配白飯",
    "燒鴨腿飯 - 燒鴨腿配白飯",
    "燒鵝腿飯 - 燒鵝腿配白飯",
    "燒肉腿飯 - 燒肉腿配白飯",
    "燒雞腿飯 - 燒雞腿配白飯",
    "燒鴨翼飯 - 燒鴨翼配白飯",
    "燒鵝翼飯 - 燒鵝翼配白飯",
    "燒肉翼飯 - 燒肉翼配白飯",
    "燒雞翼飯 - 燒雞翼配白飯"
  ],
  sides: [
    "油菜",
    "菜心",
    "芥蘭",
    "白菜",
    "生菜",
    "菜心",
    "芥蘭",
    "白菜",
    "生菜"
  ],
  soup: "例湯"
}

// ドリンクメニューデータ（広東語）
export const drinkMenuData = {
  today: "今日飲品菜單",
  hotDrinks: [
    "奶茶",
    "咖啡",
    "檸檬茶",
    "檸檬水",
    "熱水",
    "熱茶"
  ],
  coldDrinks: [
    "凍奶茶",
    "凍咖啡",
    "凍檸檬茶",
    "凍檸檬水",
    "凍水",
    "凍茶",
    "可樂",
    "雪碧",
    "七喜",
    "檸檬水",
    "橙汁",
    "蘋果汁",
    "葡萄汁",
    "芒果汁",
    "西瓜汁",
    "蜜瓜汁"
  ]
}

// ランチメニューを読み上げる関数
export const getLunchMenuText = () => {
  const menuText = `${lunchMenuData.today}：${lunchMenuData.items.join('、')}。配菜有：${lunchMenuData.sides.join('、')}。例湯：${lunchMenuData.soup}。`
  return menuText
}

// ドリンクメニューを読み上げる関数
export const getDrinkMenuText = () => {
  const hotText = `熱飲有：${drinkMenuData.hotDrinks.join('、')}。`
  const coldText = `凍飲有：${drinkMenuData.coldDrinks.join('、')}。`
  return `${drinkMenuData.today}：${hotText}${coldText}`
} 