import type { Post } from '@/types'
import { PRODUCTS } from './products'

const H = 3600 * 1000
const art = (id: string) => PRODUCTS.find((p) => p.id === id)!.art

const STORE_AVATAR: [string, string] = ['#567A55', '#2C4431']
const MIA: [string, string] = ['#C5D2B0', '#6E8B3D']
const SEN: [string, string] = ['#D9CBB4', '#8A6A48']
const YUKI: [string, string] = ['#F0D3CF', '#C98A86']

/** 基础动态，`at` 为距现在多少小时 */
const BASE: (Omit<Post, 'at'> & { ago: number })[] = [
  {
    id: 'p1',
    author: '苔生 新天地店',
    role: '官方',
    avatar: STORE_AVATAR,
    title: '栗子抹茶拿铁回来了，今年的栗子更甜',
    tag: '新品',
    likes: 386,
    comments: 42,
    ago: 2,
    productId: 's1',
    cover: { bg: ['#E3CFB2', '#B08A62'], ratio: 0.78, style: 'drink', art: art('s1') },
    content: [
      '去年秋天卖得最快的一杯，今年换成了迁西板栗，蒸熟之后手工压泥，甜度比去年高一点，所以抹茶也跟着加浓了半克。',
      '建议做成冰的，栗子泥会沉到杯底，喝到最后一口是最香的。',
      '只供应到 11 月底，每天限量 80 杯。'
    ]
  },
  {
    id: 'p2',
    author: '咖啡师 阿森',
    role: '咖啡师',
    avatar: SEN,
    title: '今天的抹茶，刷了两千四百下',
    tag: '日常',
    likes: 214,
    comments: 18,
    ago: 5,
    cover: { bg: ['#6B8E58', '#2F4A33'], ratio: 1, style: 'type', text: '2400', sub: '次茶筅刷击', light: true },
    content: [
      '早上开店前会先刷一碗给自己，确认今天这罐抹茶的状态。',
      '刷到表面起细密的泡，颜色从深绿变成偏亮的翠绿，就可以了。手腕要松，用的是 W 字形。',
      '如果你喝到哪一杯觉得涩，下次来的时候告诉我，我多刷一会儿。'
    ]
  },
  {
    id: 'p3',
    author: '店长 Mia',
    role: '店长',
    avatar: MIA,
    title: '下雨天来店，送你一张暖心券',
    tag: '活动',
    likes: 529,
    comments: 66,
    ago: 9,
    cover: { bg: ['#A8B9C2', '#5D7584'], ratio: 1.22, style: 'circles', text: '雨天暖心券', sub: '满 30 减 8', light: true },
    content: [
      '上海这周都在下雨。会员在雨天下单，我会在后台给你发一张满 30 减 8 的券，在「我的 - 礼品券」里查收。',
      '店门口的伞架也换成了大一点的，进门记得把伞放好。'
    ]
  },
  {
    id: 'p4',
    author: '苔生 新天地店',
    role: '官方',
    avatar: STORE_AVATAR,
    title: '窗边那盆苔藓，三岁了',
    tag: '门店',
    likes: 177,
    comments: 9,
    ago: 20,
    cover: { bg: ['#86A271', '#3E5A3E'], ratio: 0.9, style: 'circles', text: '3', sub: '岁的苔藓盆景', light: true },
    content: [
      '开店那天朋友送的，一直放在靠窗第二张桌子上。',
      '每天早上喷一次水，夏天要挪到没有直射光的地方。店名也是从它来的。'
    ]
  },
  {
    id: 'p5',
    author: '甜品师 Yuki',
    role: '甜品师',
    avatar: YUKI,
    title: '冰抹茶的正确打开方式：先闻，再喝',
    tag: '日常',
    likes: 301,
    comments: 27,
    ago: 26,
    productId: 'm2',
    cover: { bg: ['#CFDDB8', '#9DB57E'], ratio: 0.8, style: 'drink', art: art('m2') },
    content: [
      '拿到手先别插吸管，凑近闻一下，抹茶的海苔香在冰的时候最明显。',
      '然后用吸管从底部往上搅三圈，让蜂蜜和牛奶混匀。'
    ]
  },
  {
    id: 'p6',
    author: '咖啡师 阿森',
    role: '咖啡师',
    avatar: SEN,
    title: '焦糖漩涡，是一圈一圈慢慢淋上去的',
    tag: '日常',
    likes: 268,
    comments: 21,
    ago: 31,
    productId: 'f1',
    cover: { bg: ['#EEDCC4', '#C49A70'], ratio: 0.76, style: 'drink', art: art('f1') },
    content: ['焦糖酱要提前隔水温到 40 度，太冷挂不住杯壁，太热会直接沉底。', '每杯大概淋 12 秒。']
  },
  {
    id: 'p7',
    author: '咖啡师 阿森',
    role: '咖啡师',
    avatar: SEN,
    title: '本周豆单：埃塞俄比亚 古吉 花魁',
    tag: '门店',
    likes: 143,
    comments: 12,
    ago: 46,
    cover: { bg: ['#45433A', '#1F2420'], ratio: 1.08, style: 'type', text: '花魁', sub: 'Ethiopia Guji', light: true },
    content: [
      '这周手冲的豆子是花魁 6.0，日晒处理。热的时候是草莓和红茶，放凉一点会出来柑橘。',
      '想喝的话点单时备注「手冲花魁」，咖啡师会单独为你冲一杯。'
    ]
  },
  {
    id: 'p8',
    author: '苔生会员中心',
    role: '官方',
    avatar: STORE_AVATAR,
    title: '会员日：充 1000 送 300，充 500 送 100',
    tag: '活动',
    likes: 612,
    comments: 88,
    ago: 52,
    cover: { bg: ['#3B5A40', '#1F3424'], ratio: 0.94, style: 'type', text: '+300', sub: '充 1000 元赠送', light: true },
    content: [
      '储值长期有效，赠送金额和本金一起到账，点单时直接用余额支付。',
      '在「我的 - 会员储值」里就能充。'
    ]
  },
  {
    id: 'p9',
    author: '咖啡师 阿森',
    role: '咖啡师',
    avatar: SEN,
    title: '燕麦拿铁的拉花练习，第 112 天',
    tag: '日常',
    likes: 198,
    comments: 15,
    ago: 70,
    productId: 'h1',
    cover: { bg: ['#E8E1D3', '#BFAF95'], ratio: 1, style: 'drink', art: art('h1') },
    content: ['燕麦奶比牛奶难打，奶泡更粗。今天终于拉出了一个对称的郁金香。']
  },
  {
    id: 'p10',
    author: '店长 Mia',
    role: '店长',
    avatar: MIA,
    title: '周末早上八点的店，留给早起的人',
    tag: '门店',
    likes: 256,
    comments: 19,
    ago: 96,
    cover: { bg: ['#F2DDB0', '#D9A55B'], ratio: 0.86, style: 'circles', text: '8:00', sub: '周末开门' },
    content: ['周末八点开门，前一个小时人很少，阳光会照到吧台。', '早八点到十点下单，有机会收到阿森发的早安券。']
  },
  {
    id: 'p11',
    author: '甜品师 Yuki',
    role: '甜品师',
    avatar: YUKI,
    title: '焙茶麻薯拿铁试饮报告',
    tag: '新品',
    likes: 341,
    comments: 37,
    ago: 120,
    productId: 's2',
    cover: { bg: ['#DFC9AE', '#9C7556'], ratio: 0.8, style: 'drink', art: art('s2') },
    content: ['麻薯是每天下午现做的，放在杯底，用粗吸管吸上来。', '焙茶选的是京都的一保堂，烘焙香偏重。']
  },
  {
    id: 'p12',
    author: '苔生 新天地店',
    role: '官方',
    avatar: STORE_AVATAR,
    title: '草莓季倒计时，莓莓海盐芝士先上',
    tag: '活动',
    likes: 289,
    comments: 24,
    ago: 150,
    productId: 'f3',
    cover: { bg: ['#F4CDD0', '#C9727F'], ratio: 1.15, style: 'circles', text: '莓', sub: '12 月草莓季', light: true },
    content: ['丹东草莓 12 月到货，在那之前先用莓果泥做了这一杯。']
  }
]

export const POST_TAGS = ['全部', '新品', '日常', '门店', '活动']

/** 分页生成动态。第 2、3 页为同一批内容的往期版本，用于演示瀑布流加载更多 */
export function fetchPosts(page: number, tag = '全部'): { list: Post[]; hasMore: boolean } {
  const now = Date.now()
  const pool = BASE.filter((p) => tag === '全部' || p.tag === tag)
  const offset = page * 7 * 24 // 往期按周后移
  const list: Post[] = pool.map(({ ago, ...p }) => ({
    ...p,
    id: page === 0 ? p.id : `${p.id}~${page}`,
    likes: Math.max(12, p.likes - page * 37),
    at: now - (ago + offset) * H
  }))
  return { list, hasMore: page < 2 }
}

export function getPost(id: string): Post | undefined {
  const [baseId, pageStr] = id.split('~')
  const page = Number(pageStr || 0)
  const base = BASE.find((p) => p.id === baseId)
  if (!base) return undefined
  const { ago, ...rest } = base
  return { ...rest, id, likes: Math.max(12, base.likes - page * 37), at: Date.now() - (ago + page * 7 * 24) * H }
}
