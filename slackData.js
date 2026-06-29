// 알리고 슬랙 주간 리포트 데이터 (알리고_뉴스 채널 techbot 자동 집계)
// 마지막 업데이트: 2026-06-29 (06/21~06/27 기준)
// 업데이트 방법: Claude에게 "데이터 업데이트 해" 요청

window._SLACK_DATA = {
  period: { start: '2026-06-21', end: '2026-06-27', label: '06/21(일)~06/27(토)' },
  updatedAt: '2026-06-29',

  acquisition: {
    newUsers:      { val: 500,  avg12: 529,  diff: -5.5  },
    bizUsers:      { val: 231,  avg12: 228,  diff: +1.3  },
    personalUsers: { val: 268,  avg12: 287,  diff: -6.6  },
    churn:         { val: 43,   avg12: 47,   diff: -8.5  },
    dormant:       { val: 427,  avg12: 378,  diff: +13.0 },
    dormantResume: { val: 90,   avg12: 88,   diff: +2.3  }
  },

  funnel: {
    signup:      { val: 500, rate: 100.0, avg12Rate: 100.0 },
    callerAuth:  { val: 494, rate: 98.8,  avg12Rate: 99.1  },
    onboarding:  { val: 231, rate: 46.2,  avg12Rate: 42.5  },
    firstCharge: { val: 198, rate: 39.6,  avg12Rate: 36.3  },
    firstSend:   { val: 148, rate: 29.6,  avg12Rate: 28.7  }
  },

  activeUsers: {
    login:   { val: 12705, avg12: 13093, diff: -3.0 },
    send:    { val: 15075, avg12: 15189, diff: -0.8 },
    payment: { val: 1796,  avg12: 1914,  diff: -6.2 }
  },

  revenue: {
    sendRevenue:      { val: 498521828, avg12: 529635662, diff: -5.9  },
    chargeRevenue:    { val: 429850000, avg12: 505691666, diff: -15.0 },
    chargeCount:      { val: 2033,      avg12: 2183,      diff: -6.9  },
    wArpu:            { val: 277573,    avg12: 276674,    diff: +0.3  },
    wArppu:           { val: 239337,    avg12: 264222,    diff: -9.4  },
    bizSendRevenue:   { val: 471958790, avg12: 454165912, diff: +3.9  },
    bizChargeRevenue: { val: 403600000, avg12: 426441666, diff: -5.4  }
  },

  auth: {
    callerReg: {
      total: 987, avg12: 1027, diff: -3.9,
      approved: 740, rejected: 30, pending: 21, expired: 0,
      approveRate: 75.0, rejectRate: 3.0
    },
    bizAuth: {
      total: 323, avg12: 329, diff: -1.8,
      approved: 263, rejected: 18, pending: 42,
      approveRate: 81.4, rejectRate: 5.6
    }
  },

  cohort14d: {
    cohortSize: 491,
    payRate:  { val: 42.8, avg12: 42.0, diff: +0.8 },
    sendRate: { val: 36.7, avg12: 37.6, diff: -0.9 }
  },

  channels: {
    sms:    { val: 5668892,  avg12: 6762546,  diff: -16.2, share: 17.1 },
    lms:    { val: 11060890, avg12: 12198274, diff: -9.3,  share: 33.4 },
    mms:    { val: 2237394,  avg12: 2267715,  diff: -1.3,  share: 6.7  },
    kakao:  { val: 13600342, avg12: 11740369, diff: +15.8, share: 41.0 },
    friend: { val: 552119,   avg12: 673816,   diff: -18.1, share: 1.7  }
  },

  retention: {
    prevWeekSignup: 499,
    loginReturn:    { val: 158, rate: 31.7 },
    sendReturn:     { val: 93,  rate: 18.6 },
    avgFirstSendDays: 6.1
  }
};
