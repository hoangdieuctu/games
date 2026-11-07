// Danh sách vai (dữ liệu thuần, không phụ thuộc giao diện).
// team: phe thắng thua — village (dân), wolf (sói), solo (thắng một mình)
// wolf: Tiên Tri / Cáo / Gấu thấy là Sói
// max: số lá tối đa trong một bộ bài; w: điểm cân bằng (dương nghiêng về dân, âm nghiêng về sói)
// step: lượt gọi dậy ban đêm (xem NIGHT_ORDER trong engine.js)
const ROLES = {
  villager: {
    team: 'village', wolf: false, max: 20, w: 1,
    vi: 'Dân Làng', en: 'Villager',
    short: { vi: 'Không có chức năng đặc biệt. Dùng lý lẽ và lá phiếu để tìm ra Ma Sói.', en: 'No special power. Use reasoning and your vote to find the Werewolves.' },
    rule: { vi: 'Dân Làng ngủ suốt đêm. Ban ngày thảo luận, nghi ngờ và bỏ phiếu treo cổ người bị nghi là Ma Sói. Phe Dân thắng khi mọi Ma Sói đều chết.', en: 'Villagers sleep through the night. By day they discuss, accuse and vote to hang a suspected Werewolf. The Village wins when every Werewolf is dead.' },
  },
  werewolf: {
    team: 'wolf', wolf: true, max: 6, w: -6, step: 'wolves',
    vi: 'Ma Sói', en: 'Werewolf',
    short: { vi: 'Mỗi đêm cùng bầy Sói chọn một người để cắn.', en: 'Each night, choose a victim together with the pack.' },
    rule: { vi: 'Các Ma Sói biết nhau. Mỗi đêm cả bầy thức dậy và thống nhất cắn một người (đa số quyết định). Ban ngày giả làm dân lành. Phe Sói thắng khi số Sói bằng hoặc nhiều hơn số người còn lại.', en: 'Werewolves know each other. Each night the pack wakes and agrees on one victim (majority decides). By day they pretend to be innocent. The Wolves win once they equal or outnumber everyone else.' },
  },
  seer: {
    team: 'village', wolf: false, max: 1, w: 7, step: 'seer',
    vi: 'Tiên Tri', en: 'Seer',
    short: { vi: 'Mỗi đêm soi một người để biết họ có phải Sói không.', en: 'Each night, look at one player to learn if they are a Wolf.' },
    rule: { vi: 'Mỗi đêm Tiên Tri chọn một người để soi và biết người đó có thuộc phe Sói hay không (hoặc biết luôn vai, tuỳ luật phòng). Thông tin chỉ mình Tiên Tri thấy.', en: 'Each night the Seer chooses one player and learns whether they belong to the Wolves (or their exact role, depending on room rules). Only the Seer sees the result.' },
  },
  witch: {
    team: 'village', wolf: false, max: 1, w: 4, step: 'witch',
    vi: 'Phù Thủy', en: 'Witch',
    short: { vi: 'Có một bình cứu và một bình độc, mỗi bình dùng một lần.', en: 'Has one healing and one poison potion, each usable once.' },
    rule: { vi: 'Phù Thủy biết ai bị Sói tấn công đêm đó. Bình cứu cứu sống người bị tấn công; bình độc giết một người bất kỳ. Mỗi bình chỉ dùng một lần trong cả ván. Dùng cả hai bình trong cùng một đêm và tự cứu mình hay không là tuỳ luật phòng.', en: 'The Witch learns who the Wolves attacked that night. The healing potion saves the victim; the poison kills anyone. Each potion is used once per game. Using both on the same night and self-healing depend on room rules.' },
  },
  hunter: {
    team: 'village', wolf: false, max: 1, w: 3,
    vi: 'Thợ Săn', en: 'Hunter',
    short: { vi: 'Khi chết, được bắn chết thêm một người.', en: 'When killed, shoots one more player.' },
    rule: { vi: 'Khi Thợ Săn chết (bị cắn, bị treo cổ, bị đầu độc...), anh ta được bắn ngay một phát kéo theo một người còn sống.', en: 'When the Hunter dies (bitten, hanged, poisoned...), he immediately shoots one living player who dies with him.' },
  },
  guard: {
    team: 'village', wolf: false, max: 1, w: 3, step: 'guard',
    vi: 'Bảo Vệ', en: 'Bodyguard',
    short: { vi: 'Mỗi đêm bảo vệ một người khỏi bị Sói cắn.', en: 'Each night, protect one player from the Wolves.' },
    rule: { vi: 'Mỗi đêm Bảo Vệ chọn một người để canh. Người đó không chết nếu bị Sói tấn công. Được tự bảo vệ mình hay bảo vệ một người hai đêm liền hay không là tuỳ luật phòng. Bảo Vệ không chặn được bình độc.', en: 'Each night the Bodyguard protects one player, who cannot be killed by a Wolf attack. Self-protection and protecting the same player twice in a row depend on room rules. Poison is not blocked.' },
  },
  cupid: {
    team: 'village', wolf: false, max: 1, w: -3, step: 'cupid',
    vi: 'Thần Tình Yêu', en: 'Cupid',
    short: { vi: 'Đêm đầu tiên, ghép đôi hai người thành Cặp Đôi.', en: 'On the first night, makes two players fall in love.' },
    rule: { vi: 'Đêm đầu tiên Thần Tình Yêu chọn hai người (có thể là chính mình) thành Cặp Đôi. Hai người biết nhau. Một người chết thì người kia chết theo vì đau khổ. Nếu Cặp Đôi khác phe (một Sói, một không), họ thành phe riêng và thắng khi chỉ còn hai người họ sống sót.', en: 'On the first night Cupid picks two players (possibly himself) as Lovers. They learn of each other. If one dies, the other dies of heartbreak. If the Lovers are on opposite sides (one Wolf, one not), they form their own team and win when they are the last two alive.' },
  },
  girl: {
    team: 'village', wolf: false, max: 1, w: 1, step: 'wolves',
    vi: 'Cô Bé', en: 'Little Girl',
    short: { vi: 'Có thể hé mắt nhìn trộm lúc Sói đi săn, nhưng có thể bị bắt.', en: 'May peek while the Wolves hunt, but risks being caught.' },
    rule: { vi: 'Khi bầy Sói thức dậy, Cô Bé được chọn hé mắt nhìn trộm. Nếu không bị phát hiện, Cô Bé biết bầy Sói nhắm vào ai (không thấy mặt Sói). Nếu bị phát hiện (theo tỉ lệ của phòng), bầy Sói bỏ con mồi cũ và cắn Cô Bé.', en: 'While the Wolves are awake, the Little Girl may peek. If unnoticed she learns who the Wolves are targeting (not who the Wolves are). If caught (room risk setting), the Wolves drop their prey and attack her instead.' },
  },
  elder: {
    team: 'village', wolf: false, max: 1, w: 2,
    vi: 'Già Làng', en: 'Elder',
    short: { vi: 'Sống sót qua lần bị Sói cắn đầu tiên.', en: 'Survives the first Wolf attack.' },
    rule: { vi: 'Già Làng chịu được một lần bị Sói tấn công (lần thứ hai mới chết). Nếu Già Làng chết vì chính dân làng (bị treo cổ, bị Phù Thủy đầu độc, bị Thợ Săn bắn) thì tất cả dân làng có chức năng mất hết năng lực (tuỳ luật phòng).', en: 'The Elder survives one Wolf attack (the second one kills him). If the Elder is killed by the village itself (hanged, poisoned by the Witch, shot by the Hunter), every villager with a power loses it (room rule).' },
  },
  mayor: {
    team: 'village', wolf: false, max: 1, w: 2,
    vi: 'Trưởng Làng', en: 'Mayor',
    short: { vi: 'Ai cũng biết. Lá phiếu có trọng lượng đặc biệt.', en: 'Publicly known. Has a special vote.' },
    rule: { vi: 'Trưởng Làng được công khai từ đầu ván. Tuỳ luật phòng, phiếu của Trưởng Làng tính là 2 phiếu, hoặc dùng để phân xử khi hoà phiếu.', en: 'The Mayor is revealed to everyone at the start. Depending on room rules the Mayor’s vote counts double, or breaks ties.' },
  },
  idiot: {
    team: 'village', wolf: false, max: 1, w: 2,
    vi: 'Thằng Ngốc', en: 'Village Idiot',
    short: { vi: 'Bị treo cổ thì lộ mặt và được tha, nhưng mất quyền bỏ phiếu.', en: 'If voted out, is revealed and spared, but loses the right to vote.' },
    rule: { vi: 'Khi bị dân làng bỏ phiếu treo cổ, Thằng Ngốc lật bài và được tha chết. Từ đó anh ta không được bỏ phiếu nữa. Nếu bị Sói cắn hay đầu độc thì vẫn chết bình thường.', en: 'When voted out by the village, the Idiot reveals his card and is spared, but can no longer vote. Wolf attacks or poison still kill him normally.' },
  },
  scapegoat: {
    team: 'village', wolf: false, max: 1, w: 1,
    vi: 'Vật Hy Sinh', en: 'Scapegoat',
    short: { vi: 'Khi hoà phiếu, Vật Hy Sinh chết thay.', en: 'If the vote is tied, the Scapegoat dies instead.' },
    rule: { vi: 'Nếu cuộc bỏ phiếu ban ngày bị hoà, Vật Hy Sinh (nếu còn sống) bị treo cổ thay cho những người hoà phiếu.', en: 'If the daytime vote ends in a tie, the Scapegoat (if alive) is hanged instead of the tied players.' },
  },
  wildchild: {
    team: 'village', wolf: false, max: 1, w: -1, step: 'wildchild',
    vi: 'Đứa Trẻ Hoang Dã', en: 'Wild Child',
    short: { vi: 'Chọn một hình mẫu. Hình mẫu chết thì hoá thành Sói.', en: 'Picks a role model. If the model dies, becomes a Wolf.' },
    rule: { vi: 'Đêm đầu Đứa Trẻ Hoang Dã chọn một người làm hình mẫu. Khi hình mẫu còn sống, nó là dân làng. Nếu hình mẫu chết, Đứa Trẻ hoá thành Ma Sói, từ đêm sau thức dậy cùng bầy Sói và thắng cùng phe Sói.', en: 'On the first night the Wild Child chooses a role model. While the model lives, the child is a villager. If the model dies, the child becomes a Werewolf, wakes with the pack from the next night and wins with the Wolves.' },
  },
  cub: {
    team: 'wolf', wolf: true, max: 1, w: -8, step: 'wolves',
    vi: 'Sói Con', en: 'Wolf Cub',
    short: { vi: 'Là Sói. Nếu Sói Con chết, đêm sau bầy Sói được cắn hai người.', en: 'A Wolf. If the Cub dies, the pack kills two players the next night.' },
    rule: { vi: 'Sói Con thức dậy cùng bầy Sói. Khi Sói Con chết, bầy Sói nổi giận: đêm tiếp theo cả bầy được chọn hai nạn nhân.', en: 'The Wolf Cub wakes with the pack. When the Cub dies the pack is enraged: the following night they choose two victims.' },
  },
  whitewolf: {
    team: 'solo', wolf: true, max: 1, w: -9, step: 'whitewolf',
    vi: 'Sói Trắng', en: 'White Werewolf',
    short: { vi: 'Đi săn cùng bầy nhưng muốn thắng một mình; đêm chẵn được giết một Sói.', en: 'Hunts with the pack but wants to win alone; every other night may kill a Wolf.' },
    rule: { vi: 'Sói Trắng thức dậy cùng bầy Sói (bầy tưởng là đồng loại). Cứ đêm chẵn (đêm 2, 4, 6...) Sói Trắng thức dậy một mình và có thể giết một Sói khác. Sói Trắng chỉ thắng khi là người duy nhất còn sống.', en: 'The White Werewolf wakes with the pack (they think he is one of them). Every even night (2, 4, 6...) he wakes alone and may kill another Wolf. He only wins as the last player alive.' },
  },
  bigwolf: {
    team: 'wolf', wolf: true, max: 1, w: -9, step: 'bigwolf',
    vi: 'Sói Lớn', en: 'Big Bad Wolf',
    short: { vi: 'Khi chưa có Sói nào chết, mỗi đêm được cắn thêm một người.', en: 'While no Wolf has died, kills one extra player each night.' },
    rule: { vi: 'Sói Lớn đi săn cùng bầy. Chừng nào chưa có ai thuộc phe Sói chết, sau khi cả bầy chọn xong con mồi, Sói Lớn thức dậy một mình và cắn thêm một người (không phải Sói).', en: 'The Big Bad Wolf hunts with the pack. As long as no member of the Wolf side has died, after the pack’s meal he wakes alone and attacks one extra non-Wolf player.' },
  },
  angel: {
    team: 'solo', wolf: false, max: 1, w: 0,
    vi: 'Thiên Sứ', en: 'Angel',
    short: { vi: 'Thắng ngay nếu bị loại ở lần bỏ phiếu đầu tiên hoặc đêm đầu tiên.', en: 'Wins at once if eliminated by the first vote or on the first night.' },
    rule: { vi: 'Khi có Thiên Sứ, ván bắt đầu bằng một buổi bỏ phiếu ban ngày. Nếu Thiên Sứ chết ở lần bỏ phiếu đầu tiên hoặc đêm đầu tiên, Thiên Sứ thắng một mình và ván kết thúc. Sau đó Thiên Sứ chơi như dân làng.', en: 'When the Angel is in play, the game starts with a daytime vote. If the Angel dies at the first vote or on the first night, the Angel alone wins and the game ends. After that the Angel plays as a villager.' },
  },
  piper: {
    team: 'solo', wolf: false, max: 1, w: -3, step: 'piper',
    vi: 'Người Thổi Sáo', en: 'Pied Piper',
    short: { vi: 'Mỗi đêm mê hoặc hai người. Thắng khi mọi người còn sống đều bị mê hoặc.', en: 'Charms two players each night. Wins when every living player is charmed.' },
    rule: { vi: 'Mỗi đêm Người Thổi Sáo chọn hai người chưa bị mê hoặc. Người bị mê hoặc biết nhau nhưng vẫn chơi bình thường. Người Thổi Sáo thắng một mình khi tất cả người còn sống khác đều đã bị mê hoặc.', en: 'Each night the Piper charms two uncharmed players. Charmed players learn who else is charmed but play normally. The Piper wins alone when every other living player is charmed.' },
  },
  fox: {
    team: 'village', wolf: false, max: 1, w: 3, step: 'fox',
    vi: 'Cáo', en: 'Fox',
    short: { vi: 'Đánh hơi một nhóm ba người; nếu không có Sói thì mất năng lực.', en: 'Sniffs a group of three; loses the power if no Wolf is found.' },
    rule: { vi: 'Mỗi đêm Cáo chọn một người và đánh hơi nhóm ba người: người đó cùng hai người còn sống ngồi hai bên. Cáo biết trong nhóm có Sói hay không. Nếu không có Sói nào, Cáo mất năng lực vĩnh viễn.', en: 'Each night the Fox chooses a player and learns whether that player or either living neighbour is a Wolf. If none is, the Fox loses the power for good.' },
  },
  knight: {
    team: 'village', wolf: false, max: 1, w: 2,
    vi: 'Hiệp Sĩ', en: 'Knight',
    short: { vi: 'Bị Sói cắn chết thì con Sói gần nhất bên trái chết theo đêm sau.', en: 'If killed by Wolves, the nearest Wolf on his left dies the next night.' },
    rule: { vi: 'Hiệp Sĩ cầm thanh kiếm gỉ. Nếu Hiệp Sĩ bị Sói cắn chết, con Sói gần nhất ngồi bên trái anh ta bị nhiễm trùng và chết vào đêm hôm sau.', en: 'The Knight carries a rusty sword. If the Knight is killed by the Wolves, the nearest Wolf sitting to his left catches tetanus and dies the following night.' },
  },
  bear: {
    team: 'village', wolf: false, max: 1, w: 2,
    vi: 'Người Thuần Gấu', en: 'Bear Tamer',
    short: { vi: 'Mỗi sáng con gấu gầm gừ nếu cạnh chủ có Sói.', en: 'Each morning the bear growls if a Wolf sits next to its master.' },
    rule: { vi: 'Mỗi buổi sáng, nếu một trong hai người còn sống ngồi cạnh Người Thuần Gấu là Sói, con gấu gầm gừ cho cả làng nghe thấy.', en: 'Each morning, if either living neighbour of the Bear Tamer is a Wolf, the bear growls for the whole village to hear.' },
  },
};
// thứ tự hiện trong bộ bài / sách luật
const ROLE_LIST = ['villager', 'werewolf', 'seer', 'witch', 'hunter', 'guard', 'cupid', 'girl', 'elder', 'mayor', 'idiot', 'scapegoat', 'wildchild', 'cub', 'whitewolf', 'bigwolf', 'angel', 'piper', 'fox', 'knight', 'bear'];
// vai có năng lực của dân làng (mất hết khi Già Làng bị dân làng giết)
const POWER_ROLES = ['seer', 'witch', 'hunter', 'guard', 'girl', 'fox', 'knight', 'bear'];
