import type { Locale } from './i18n';

export type VoiceoverScript = string[][];

export const voiceoverScripts: Record<Locale, VoiceoverScript> = {
  vi: [
    // Scene 1 (0-8s) - Hero
    [
      'Làm việc từ xa, bạn có bị phân tâm bởi mạng xã hội không?',
      'YouTube, Facebook, Instagram, Reddit... chiếm hết thời gian làm việc của bạn.',
      'ZFocus giúp bạn tập trung trở lại - Pomodoro và Focus Zones ngay trên trình duyệt!',
    ],
    // Scene 2 (8-16s) - Smart Blocking
    [
      'ZFocus chặn thông minh, không chặn bừa.',
      'Chặn youtube.com nhưng cho phép nội dung học tập. Chặn reddit nhưng cho phép lập trình.',
      'Chặn theo từ khóa tự động - game, shopping, social, meme - tất cả bị chặn ngay lập tức.',
    ],
    // Scene 3 (16-24s) - Time Control
    [
      'Đặt lịch chặn từ 9 giờ sáng đến 5 giờ chiều, từ thứ Hai đến thứ Sáu.',
      'Chỉ đếm thời gian tab đang xem - không lãng phí thời gian ở tab ẩn.',
      'Cần nghỉ nghe nhạc? Tạm dừng nhanh 5 phút, rồi tự động bật lại.',
    ],
    // Scene 4 (24-32s) - Advanced Actions
    [
      'Không chỉ chặn website - tự động đóng tab gây phân tâm.',
      'Chuyển hướng thông minh: mở Facebook thì tự động chuyển sang Notion.',
      'Giới hạn thời gian: chỉ cho phép 5 phút mỗi giờ cho các trang giải trí.',
    ],
    // Scene 5 (32-40s) - Privacy
    [
      'Dữ liệu của bạn luôn an toàn - 100% lưu trữ cục bộ trên máy bạn.',
      'Không thu thập dữ liệu, không gửi lên server, hoàn toàn riêng tư.',
      'Giao diện đẹp mắt, hiện đại - hỗ trợ Chrome, Firefox, Edge và Brave.',
    ],
    // Scene 6 (40-48s) - Comparison
    [
      'So với LeechBlock và Screen Time, ZFocus vượt trội toàn diện.',
      'Ngoại lệ thông minh, tự động đóng tab, bảo mật tuyệt đối, giao diện hiện đại.',
      'Những tính năng mà đối thủ không có, ZFocus đều có đầy đủ.',
    ],
    // Scene 7 (48-56s) - Pricing
    [
      'Dùng thử miễn phí 30 ngày với đầy đủ tính năng, không cần thẻ tín dụng.',
      'Premium chỉ 14 đô la mỗi năm. Hoặc trọn đời chỉ 29 đô la - một lần mua, dùng mãi mãi.',
      'Cài đặt miễn phí ngay trên Chrome Web Store!',
    ],
  ],
  en: [
    // Scene 1 (0-8s) - Hero
    [
      'Working remotely, do you get distracted by social media?',
      'YouTube, Facebook, Instagram, Reddit... stealing all your work time.',
      'ZFocus helps you focus again - Pomodoro and Focus Zones right in your browser!',
    ],
    // Scene 2 (8-16s) - Smart Blocking
    [
      'ZFocus blocks smart, not blanket blocking.',
      'Block youtube.com but allow educational content. Block reddit but allow programming.',
      'Auto keyword blocking - game, shopping, social, meme - all blocked instantly.',
    ],
    // Scene 3 (16-24s) - Time Control
    [
      'Schedule blocking from 9 AM to 5 PM, Monday to Friday.',
      'Only count time on active tab - no wasted time on hidden tabs.',
      'Need a music break? Quick pause for 5 minutes, then auto-resume.',
    ],
    // Scene 4 (24-32s) - Advanced Actions
    [
      'Not just blocking websites - auto-close distracting tabs.',
      'Smart redirect: open Facebook and automatically switch to Notion.',
      'Time limits: only allow 5 minutes per hour for entertainment sites.',
    ],
    // Scene 5 (32-40s) - Privacy
    [
      'Your data is always safe - 100% local storage on your device.',
      'No data collection, no server uploads, completely private.',
      'Beautiful, modern interface - supports Chrome, Firefox, Edge and Brave.',
    ],
    // Scene 6 (40-48s) - Comparison
    [
      'Compared to LeechBlock and Screen Time, ZFocus excels comprehensively.',
      'Smart exceptions, auto-close tabs, absolute security, modern UI.',
      'Features that competitors lack, ZFocus has them all.',
    ],
    // Scene 7 (48-56s) - Pricing
    [
      'Free 30-day trial with full features, no credit card required.',
      'Premium only $14/year. Or lifetime for just $29 - buy once, use forever.',
      'Install free now on Chrome Web Store!',
    ],
  ],
  ko: [
    // Scene 1 - Hero
    [
      '재택근무 중 소셜 미디어에 방해받고 계신가요?',
      'YouTube, Facebook, Instagram, Reddit... 업무 시간을 모두 빼앗아갑니다.',
      'ZFocus로 다시 집중하세요 - 브라우저에서 바로 포모도로와 포커스 존!',
    ],
    // Scene 2 - Smart Blocking
    [
      'ZFocus는 똑똑하게 차단합니다, 무차별 차단이 아닙니다.',
      'youtube.com을 차단하되 교육 콘텐츠는 허용. reddit을 차단하되 프로그래밍은 허용.',
      '키워드 자동 차단 - game, shopping, social, meme - 모두 즉시 차단.',
    ],
    // Scene 3 - Time Control
    [
      '오전 9시부터 오후 5시까지, 월요일부터 금요일까지 차단 예약.',
      '활성 탭에서만 시간 측정 - 숨겨진 탭에서 시간 낭비 없음.',
      '음악 휴식이 필요하세요? 5분 빠른 일시정지 후 자동 재개.',
    ],
    // Scene 4 - Advanced Actions
    [
      '웹사이트 차단뿐만 아니라 - 방해되는 탭 자동 닫기.',
      '스마트 리다이렉트: Facebook을 열면 자동으로 Notion으로 전환.',
      '시간 제한: 엔터테인먼트 사이트는 시간당 5분만 허용.',
    ],
    // Scene 5 - Privacy
    [
      '데이터는 항상 안전합니다 - 기기에 100% 로컬 저장.',
      '데이터 수집 없음, 서버 업로드 없음, 완전한 프라이버시.',
      '아름답고 현대적인 인터페이스 - Chrome, Firefox, Edge, Brave 지원.',
    ],
    // Scene 6 - Comparison
    [
      'LeechBlock 및 Screen Time과 비교해 ZFocus가 종합적으로 우수합니다.',
      '스마트 예외, 탭 자동 닫기, 절대적 보안, 현대적 UI.',
      '경쟁사에 없는 기능들, ZFocus는 모두 갖추고 있습니다.',
    ],
    // Scene 7 - Pricing
    [
      '전체 기능으로 30일 무료 체험, 신용카드 필요 없음.',
      '프리미엄 연간 $14. 또는 평생 $29 - 한 번 구매, 영원히 사용.',
      '지금 Chrome 웹 스토어에서 무료 설치!',
    ],
  ],
  ja: [
    // Scene 1 - Hero
    [
      'リモートワーク中、SNSに気が散っていませんか?',
      'YouTube、Facebook、Instagram、Reddit... 仕事時間をすべて奪っていきます。',
      'ZFocusで再び集中しましょう - ブラウザでポモドーロとフォーカスゾーン!',
    ],
    // Scene 2 - Smart Blocking
    [
      'ZFocusはスマートにブロック、無差別ブロックではありません。',
      'youtube.comをブロックしても教育コンテンツは許可。redditをブロックしてもプログラミングは許可。',
      'キーワード自動ブロック - game、shopping、social、meme - すべて即座にブロック。',
    ],
    // Scene 3 - Time Control
    [
      '午前9時から午後5時まで、月曜から金曜までブロックをスケジュール。',
      'アクティブタブのみ時間をカウント - 隠れたタブで時間を無駄にしない。',
      '音楽休憩が必要? 5分のクイック一時停止、その後自動再開。',
    ],
    // Scene 4 - Advanced Actions
    [
      'ウェブサイトブロックだけでなく - 気が散るタブを自動で閉じる。',
      'スマートリダイレクト: Facebookを開くと自動的にNotionに切り替え。',
      '時間制限: エンターテインメントサイトは1時間あたり5分のみ許可。',
    ],
    // Scene 5 - Privacy
    [
      'データは常に安全 - デバイスに100%ローカル保存。',
      'データ収集なし、サーバーアップロードなし、完全プライベート。',
      '美しくモダンなインターフェース - Chrome、Firefox、Edge、Braveをサポート。',
    ],
    // Scene 6 - Comparison
    [
      'LeechBlockやScreen Timeと比較して、ZFocusは総合的に優れています。',
      'スマート例外、タブ自動クローズ、絶対的セキュリティ、モダンUI。',
      '競合他社にない機能、ZFocusにはすべて揃っています。',
    ],
    // Scene 7 - Pricing
    [
      '全機能で30日間無料トライアル、クレジットカード不要。',
      'プレミアム年間$14。または生涯$29 - 一度購入、永遠に使用。',
      '今すぐChrome ウェブストアで無料インストール!',
    ],
  ],
  zh: [
    // Scene 1 - Hero
    [
      '远程工作时，你是否被社交媒体分心?',
      'YouTube、Facebook、Instagram、Reddit... 占用了你所有的工作时间。',
      'ZFocus帮你重新集中注意力 - 浏览器中的番茄钟和专注区!',
    ],
    // Scene 2 - Smart Blocking
    [
      'ZFocus智能拦截，不是无差别拦截。',
      '拦截youtube.com但允许教育内容。拦截reddit但允许编程。',
      '自动关键词拦截 - game、shopping、social、meme - 全部即时拦截。',
    ],
    // Scene 3 - Time Control
    [
      '设置从上午9点到下午5点，周一到周五的拦截计划。',
      '只计算活跃标签页的时间 - 隐藏标签页不浪费时间。',
      '需要音乐休息? 快速暂停5分钟，然后自动恢复。',
    ],
    // Scene 4 - Advanced Actions
    [
      '不仅仅是拦截网站 - 自动关闭分心标签页。',
      '智能重定向: 打开Facebook自动跳转到Notion。',
      '时间限制: 娱乐网站每小时只允许5分钟。',
    ],
    // Scene 5 - Privacy
    [
      '你的数据始终安全 - 100%本地存储在你的设备上。',
      '不收集数据，不上传服务器，完全私密。',
      '美观现代的界面 - 支持Chrome、Firefox、Edge和Brave。',
    ],
    // Scene 6 - Comparison
    [
      '与LeechBlock和Screen Time相比，ZFocus全面领先。',
      '智能例外、自动关闭标签、绝对安全、现代界面。',
      '竞争对手没有的功能，ZFocus都有。',
    ],
    // Scene 7 - Pricing
    [
      '30天免费试用全部功能，无需信用卡。',
      '高级版每年仅$14。或终身版仅$29 - 一次购买，永久使用。',
      '立即在Chrome网上应用店免费安装!',
    ],
  ],
};
