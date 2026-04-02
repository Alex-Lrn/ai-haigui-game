export type TDifficulty = 'easy' | 'medium' | 'hard'

export type TStoryPublic = {
  id: string
  title: string
  difficulty: TDifficulty
  surface: string
}

// MVP：前端仅展示汤面（surface），避免把汤底（bottom）泄露到客户端。
export const stories: TStoryPublic[] = [
  {
    id: 'neon-alibi',
    title: '霓虹不在场证明',
    difficulty: 'easy',
    surface:
      '夜里，街区监控一片雪花。你收到一段“看起来很正常”的报警录音：可当你再听一次，录音里出现的时间点与现场不一致。',
  },
  {
    id: 'blue-archive',
    title: '蓝色档案室的尘埃',
    difficulty: 'medium',
    surface:
      '档案室里只有一扇门从未上锁。管理员说“所有门都已检查”，但地面上却有一条从门口延伸到角落的拖痕。',
  },
  {
    id: 'tremor-train',
    title: '震动列车上的沉默',
    difficulty: 'hard',
    surface:
      '列车在隧道中短暂失联，乘客听到一声闷响。有人说那是轮轨摩擦，但当你询问细节，几个人的描述都避开了同一个关键物品。',
  },
  {
    id: 'mirror-lab',
    title: '镜像实验室',
    difficulty: 'medium',
    surface:
      '实验室的玻璃呈现出双重倒影。研究员坚持“设备没有重启”，可你在日志里看到一次异常跳变发生在镜子附近。',
  },
  {
    id: 'silent-elevator',
    title: '无声电梯',
    difficulty: 'easy',
    surface:
      '凌晨的办公楼里，电梯在13层短暂停留却没有开门。保安说“没人刷卡上来”，但监控里同一时刻走廊灯刚好闪了一下。',
  },
  {
    id: 'cold-kettle',
    title: '冷却的茶壶',
    difficulty: 'medium',
    surface:
      '会议室里茶壶还在桌上，水却已经凉透。所有人都说“会议刚结束不久”，可白板上的笔迹边缘已经出现明显干裂。',
  },
  {
    id: 'paper-bridge',
    title: '纸桥',
    difficulty: 'hard',
    surface:
      '档案袋里的合同页码完整，偏偏中间一页纸张厚度不同。审阅员坚持“没有换页”，但订书钉在光下反射出两种金属色。',
  },
  {
    id: 'echo-room',
    title: '回声房间',
    difficulty: 'medium',
    surface:
      '录音棚里传出两次一模一样的咳嗽声，时间间隔却和房间回声参数对不上。音频工程师说设备正常，但增益旋钮停在异常位置。',
  },
  {
    id: 'red-signal',
    title: '红灯之后',
    difficulty: 'hard',
    surface:
      '十字路口红灯亮起后，第一辆车却继续前行。司机说“没看见灯变色”，可行车记录仪里仪表盘亮度在同一秒骤降。',
  },
  {
    id: 'winter-window',
    title: '冬夜窗痕',
    difficulty: 'easy',
    surface:
      '冬夜里窗内起雾，有人用手写下“别回头”后离开。房主说那晚只有自己在家，但门口地垫上的雪印是双排。',
  },
]

