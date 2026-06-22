// 알리고 슬랙 주간 리포트 데이터 (알리고_뉴스 채널 techbot 자동 집계)
// 마지막 업데이트: 2026-06-15 (06/07~06/13 기준)
// 업데이트 방법: Claude에게 "슬랙 데이터 업데이트해줘" 요청

window._SLACK_DATA = {
  period: { start: '2026-06-07', end: '2026-06-13', label: '06/07(일)~06/13(토)' },
  updatedAt: '2026-06-15',

  // ── 가입자 지표 ──
  acquisition: {
    newUsers:      { val: 469,  avg12: 537,  diff: -12.7 },
    bizUsers:      { val: 219,  avg12: 229,  diff: -4.4  },
    personalUsers: { val: 250,  avg12: 291,  diff: -14.1 },
    churn:         { val: 48,   avg12: 45,   diff: +6.7  },
    dormant:       { val: 342,  avg12: 382,  diff: -10.5 },
    dormantResume: { val: 82,   avg12: 93,   diff: -11.8 }
  },

  // ── AARRR 활성화 퍼널 (신규 가입자 기준) ──
  funnel: {
    signup:          { val: 469, rate: 100.0,  avg12Rate: 100.0  },
    callerAuth:      { val: 465, rate: 99.1,   avg12Rate: 99.1   },
    onboarding:      { val: 216, rate: 46.1,   avg12Rate: 42.1   },
    firstCharge:     { val: 175, rate: 37.3,   avg12Rate: 36.9   },
    firstSend:       { val: 138, rate: 29.4,   avg12Rate: 29.6   }
  },

  // ── 활성 사용자 (WAU) ──
  activeUsers: {
    login:   { val: 13202, avg12: 13060, diff: +1.1  },
    send:    { val: 15158, avg12: 15137, diff: +0.1  },
    payment: { val: 1837,  avg12: 1916,  diff: -4.1  }
  },

  // ── 매출 ──
  revenue: {
    sendRevenue:    { val: 499649242,  avg12: 529840867,  diff: -5.7  },
    chargeRevenue:  { val: 477700000,  avg12: 509179166,  diff: -6.2  },
    chargeCount:    { val: 2079,       avg12: 2186,       diff: -4.9  },
    wArpu:          { val: 271992,     avg12: 276361,     diff: -1.6  },
    wArppu:         { val: 260044,     avg12: 265787,     diff: -2.2  },
    bizSendRevenue: { val: 468102220,  avg12: 448347045,  diff: +4.4  },
    bizChargeRevenue:{ val: 445700000, avg12: 421750000,  diff: +5.7  }
  },

  // ── 인증 지표 ──
  auth: {
    callerReg: {
      total: 923, avg12: 1047, diff: -11.8,
      approved: 676, rejected: 50, pending: 27, expired: 1,
      approveRate: 73.2, rejectRate: 5.4
    },
    bizAuth: {
      total: 336, avg12: 328, diff: +2.4,
      approved: 252, rejected: 23, pending: 61,
      approveRate: 75.0, rejectRate: 6.8
    }
  },

  // ── 14일 코호트 전환율 (가입 후 14일 내) ──
  cohort14d: {
    cohortSize: 520,  // 2026-05-24~05-30 가입자
    payRate:  { val: 43.5, avg12: 41.6, diff: +1.9 },
    sendRate: { val: 39.2, avg12: 37.3, diff: +1.9 }
  },

  // ── 채널별 발송 ──
  channels: {
    sms:    { val: 7172523,  avg12: 6921010,  diff: +3.6,  share: 21.4 },
    lms:    { val: 10130814, avg12: 12329712, diff: -17.8, share: 30.2 },
    mms:    { val: 2543583,  avg12: 2212686,  diff: +15.0, share: 7.6  },
    kakao:  { val: 12687330, avg12: 11540378, diff: +9.9,  share: 37.8 },
    friend: { val: 994084,   avg12: 651043,   diff: +52.7, share: 3.0  }
  },

  // ── 리텐션 ──
  retention: {
    prevWeekSignup: 507,
    loginReturn:    { val: 182, rate: 35.9 },
    sendReturn:     { val: 100, rate: 19.7 },
    avgFirstSendDays: 5.7
  }
};
