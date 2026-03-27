import type { Locale } from './i18n';

export type VoiceoverScript = string[][];

export const voiceoverScripts: Record<Locale, VoiceoverScript> = {
  vi: [
    // Scene 1 (0-8s) - Hero
    ['Làm việc nhưng dễ bị mạng xã hội làm phiền?', 'ZFocus giúp bạn tập trung ngay trên trình duyệt.'],
    // Scene 2 (8-16s) - Smart Blocking
    ['Chặn thông minh, không chặn bừa.', 'Chỉ chặn thứ gây xao nhãng, vẫn giữ nội dung cần.'],
    // Scene 3 (16-24s) - Time Control
    ['Chặn theo giờ làm việc.', 'Cần nghỉ? Tạm dừng nhanh.'],
    // Scene 4 (24-32s) - Advanced Actions
    ['Không chỉ chặn web.', 'Tự đóng tab, chuyển hướng và giới hạn thời gian.'],
    // Scene 5 (32-40s) - Privacy
    ['Dữ liệu luôn ở máy bạn.', 'Không thu thập, không gửi server.'],
    // Scene 6 (40-48s) - Comparison
    ['Kiểm soát tốt hơn tool chặn web thường.', 'Thông minh hơn, riêng tư hơn.'],
    // Scene 7 (48-56s) - Pricing
    ['Dùng thử premium 30 ngày, không cần đăng ký.', 'Cài ZFocus ngay.'],
  ],
  en: [
    // Scene 1 (0-8s) - Hero
    [
      'Working remotely but social media keeps pulling you away?',
      'ZFocus helps you get back to work right in your browser.',
    ],
    // Scene 2 (8-16s) - Smart Blocking
    ['ZFocus blocks smart, not blanket blocking.', 'Block distracting content while keeping what you need.'],
    // Scene 3 (16-24s) - Time Control
    ['Schedule blocking based on your work hours.', 'Need a short break? Pause for a few minutes, then auto-resume.'],
    // Scene 4 (24-32s) - Advanced Actions
    [
      'Not just blocking websites, ZFocus handles distracting behaviors.',
      'Auto-close tabs, redirect, and limit entertainment time.',
    ],
    // Scene 5 (32-40s) - Privacy
    ['Your data stays on your device.', 'No collection, no server uploads, completely private.'],
    // Scene 6 (40-48s) - Comparison
    ['ZFocus gives you more control than typical web blockers.', 'Smarter, more private, and more modern.'],
    // Scene 7 (48-56s) - Pricing
    ['Free 30-day trial, no card required.', 'Install ZFocus today on Chrome Web Store.'],
  ],
  ko: [
    // Scene 1 - Hero
    [
      '재택근무 중인데 소셜 미디어가 집중을 방해하나요?',
      'ZFocus가 브라우저에서 바로 업무에 복귀할 수 있게 도와드립니다.',
    ],
    // Scene 2 - Smart Blocking
    ['ZFocus는 무차별 차단이 아닌 스마트 차단을 합니다.', '방해되는 콘텐츠는 차단하고 필요한 콘텐츠는 유지합니다.'],
    // Scene 3 - Time Control
    ['업무 시간에 맞춰 차단 일정을 설정하세요.', '짧은 휴식이 필요하세요? 몇 분 일시정지 후 자동 재개됩니다.'],
    // Scene 4 - Advanced Actions
    ['웹사이트 차단뿐만 아니라 방해 행동도 처리합니다.', '탭 자동 닫기, 리다이렉트, 엔터테인먼트 시간 제한.'],
    // Scene 5 - Privacy
    ['데이터는 항상 기기에 저장됩니다.', '수집 없음, 서버 업로드 없음, 완전한 프라이버시.'],
    // Scene 6 - Comparison
    ['ZFocus는 일반 웹 차단기보다 더 많은 제어 기능을 제공합니다.', '더 스마트하고, 더 프라이빗하고, 더 현대적입니다.'],
    // Scene 7 - Pricing
    ['30일 무료 체험, 카드 필요 없음.', '오늘 Chrome 웹 스토어에서 ZFocus를 설치하세요.'],
  ],
  ja: [
    // Scene 1 - Hero
    [
      'リモートワーク中なのにSNSに集中を奪われていませんか?',
      'ZFocusがブラウザ上ですぐに仕事に戻れるようサポートします。',
    ],
    // Scene 2 - Smart Blocking
    ['ZFocusは無差別ブロックではなくスマートブロック。', '気が散るコンテンツをブロックし、必要なものは維持します。'],
    // Scene 3 - Time Control
    ['勤務時間に合わせてブロックをスケジュール。', '短い休憩が必要? 数分一時停止して自動再開。'],
    // Scene 4 - Advanced Actions
    [
      'ウェブサイトのブロックだけでなく、気が散る行動も処理。',
      'タブの自動クローズ、リダイレクト、エンタメ時間の制限。',
    ],
    // Scene 5 - Privacy
    ['データは常にあなたのデバイスに保存。', '収集なし、サーバーアップロードなし、完全プライベート。'],
    // Scene 6 - Comparison
    [
      'ZFocusは一般的なウェブブロッカーよりも多くのコントロールを提供。',
      'よりスマート、よりプライベート、よりモダン。',
    ],
    // Scene 7 - Pricing
    ['30日間無料トライアル、カード不要。', '今すぐChrome ウェブストアでZFocusをインストール。'],
  ],
  zh: [
    // Scene 1 - Hero
    ['远程工作却总被社交媒体分散注意力?', 'ZFocus帮你在浏览器中立即回归工作。'],
    // Scene 2 - Smart Blocking
    ['ZFocus智能拦截，不是无差别拦截。', '拦截干扰内容，保留你需要的。'],
    // Scene 3 - Time Control
    ['根据工作时间设置拦截计划。', '需要短暂休息? 暂停几分钟后自动恢复。'],
    // Scene 4 - Advanced Actions
    ['不仅拦截网站，ZFocus还处理分心行为。', '自动关闭标签页、重定向、限制娱乐时间。'],
    // Scene 5 - Privacy
    ['数据始终保存在你的设备上。', '不收集、不上传服务器、完全私密。'],
    // Scene 6 - Comparison
    ['ZFocus比普通网页拦截器提供更多控制。', '更智能、更私密、更现代。'],
    // Scene 7 - Pricing
    ['30天免费试用，无需信用卡。', '立即在Chrome网上应用店安装ZFocus。'],
  ],
};
