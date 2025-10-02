"use client"

import React from 'react';
import CollectPaymentCard from './collect-payment-card';

// 共通のCollect Paymentカードラッパー
// どちらか一方を更新すると両方同時に変更される
const CollectPaymentCardWrapper = () => {
  return <CollectPaymentCard />;
}

export default CollectPaymentCardWrapper;



