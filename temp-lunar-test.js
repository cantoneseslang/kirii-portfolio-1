const {Lunar} = require('lunar-javascript');

// 現在の日付の旧暦インスタンスを取得
const lunar = Lunar.fromDate(new Date());

// 利用可能なメソッドを確認
console.log('=== Lunar Instance Methods ===');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(lunar)));

// 日の十二直を取得
console.log('=== 十二直 ===');
console.log(lunar.getDayZhi());

// 日の宜と忌の確認（各種メソッドを試す）
console.log('=== 宜忌関連 ===');
console.log('getDayYi:', lunar.getDayYi ? lunar.getDayYi() : 'Method not available');
console.log('getDayJi:', lunar.getDayJi ? lunar.getDayJi() : 'Method not available');
console.log('getDayJiShen:', lunar.getDayJiShen ? lunar.getDayJiShen() : 'Method not available');
console.log('getDayXiongSha:', lunar.getDayXiongSha ? lunar.getDayXiongSha() : 'Method not available');
console.log('getDayYiJi:', lunar.getDayYiJi ? lunar.getDayYiJi() : 'Method not available');

// lunarオブジェクトの全プロパティを表示
console.log('=== All Properties ===');
console.log(Object.getOwnPropertyNames(lunar).filter(prop => typeof lunar[prop] !== 'function'));
