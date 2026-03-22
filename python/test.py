import math
from collections import Counter

# ==================== 配置参数 ====================
WINDOW_SIZE = 200            # 粗粒度窗口大小（字符数）
SLIDING_WIN_SIZE = 20        # 细粒度滑动窗口大小
SLIDING_STEP = 1             # 细粒度滑动步长

# 方案A 阈值
THRESHOLD = 0.2

# 方案B 熵阈值
ENTROPY_THRESHOLD = 1.0

# 方案C 卡方显著性水平
CHI_SQ_ALPHA = 0.05

# ==================== 字符分类 ====================
# 用户提供的分类（按原样复制）
zhChar = [
    "的一了是不我在人有这他来个你说上到就着大们道那么也地子下出时看要她中没然里为过自好得去可会天还心后以小都和对想能起之手而只生什身头样事多己家面知开如无现很点前发经情把老些话已又声意于回笑所但眼成方年见当女真两力气从用长动间国走让被给正问打明儿法才几行三定此进再种将实同最本向分十学高第感怎神听边作其吧却口觉啊因白次军做外门光风主住果与全二候公相吗等别色死张部太日少战理直重王像脸比快何水名体呢东叫西应便放马难轻更美位关机接先文处并望常完四飞师者安清刚跟月信山爱内龙空带找原入李连吃场平思林变使由受亲命目强男任该路车今海加远活特解电世性表许它立黑金红花转总算城队孩反工始满新兵物离非虽云似万至干通认失火哥士五惊魔竟姐乎剑往量早结怕流突坐斯音紧指拉杀半记且利合倒书度微步教喜越影谁冷深告",
    "落象容怪传钱提言随每双服击武哪数站奇房管灵刻题衣周静伤百拿妈办星化功绝系般必业尔件血代精弟终近条青界司整欢字晚民帮切即忙交或暗夫员根石哈夜父制友阿息冲酒保片形阵南决请各报兴阳急语令错及刘极识备慢雪苦若领收底尽准华答众千消视罗敢留克乐够跑显嘴官断未势句求计论达则害八单久脚德元脑楚雨睛响刀确玉沉北格停陈市朝喝族江团母章装亮客照乱易足依黄修破台球呀院送包义诉攻丝围玩待复况楼丽痛梦呼摇期英低帝兄背持爷皇七六穿杨政运居叶热校谢曾古细产睡希速室旁另怀露异写鬼娘取式除级考建愿招饭布续程首观朋务掉赶忽注术甚差呵展争品兰宝香斗故雷念段顿角疑护闪木需调类妹爸线左游派谈激冰敌跳支约巴您顾肯醒铁抱淡造伙资群集联商号节讲掌赵密九病卫米威继渐统追亚简练基选推改退味份举示忍历器恐引试皮习靠导存莫志区汉右严态买幸社佛议树止块守毛挥胡散板仅隐怒床苏料股局班图岁礼独初福顺狂默巨既松证烈否恶治缓排费拍耳医寒哭温府担称余钟泪烟仍具忘恩毕警蓝宫吸陆究抓压沙救呆河迷枪组权叹孙卷查毫春察圣草较胜遇充史堂防据猛骑土卡助京银贵永质屋须副换刺属闻境禁阴共负弄翻虎层喊逃晓座雅参射婚险君划坚价柔超扬科按狠野秦秘熟置仙模伸波肉假齐舞脱广姑麻投顶致责景营维设坏啦秀败眉州药承案狼专偷画吴店哦弹食欲抬标秋厉良际状烦午摆戏桌船短村某摸付演规萧封握田唐藏震混虚透纪凌休嘛梅紫歌临毒宗著索印寻湖劲职技恨婆杰羽咱素凡值飘养嘿普宁吓兽夏读街牛仿胸浪富尚宇骨智纷升叔善弱架卖袋网朱骂雄赛略杯施墙环罪牙窗柳厅搞端洞适拥释洋肩魂闹蒙洗灯借伯免菜验凤鱼徐型娜暴亡讨辈懂腿灭妙效危优盘套丁趣妖束杂诗迎舍旧彩委挂笔狗鲜纸抗探韩尼控惜珠抽创归挺奋陪硬避园托训勇聊奶庄奔镇拳采研配介尊冒虑敬丹舒蛋哼宋济妇箭择犯欣甲欧课扑菲燕曲躲玄幻茶折伊傻姓源洛遍",
    "臣弃犹占漂挑获绿峰俊疯列森妻恋误拜伟移纳党罢腰巧孤闭圆碰镜软厚累昨幽悲丈牌降颜劳偏省糊馆烧谓财舰汗奈操迹尸悄残尖鲁锋圈油俩项撞瞬忆盖尤徒乡概户荡艺增祖困殿迅横范律番企惨限聚含凭剧碎躺缘凉腾织抢预沈替孔批康惑唯率惯登互盯稍宣唱诚剩咬育诸触晨策疼漫材补私吐纯艾贝谷庭挡晃吉吹仔仇凝鼓农席征帅附缺塞豪亦杜努判谋胆尘扎滚闷迟稳翼诺闲灰朵盛梁晶餐爆伦娇侧愣鼻轮昏抖陷敏词慌愤怜颤阶苍距郑川扫逼县忧童执丢荣臂逐傲戴芒庆伴袭供积测遥阻例睁岛遗瞪慕皱博幕猜益净泽炼监鸡珍伏绍曹爬丫炸壁涌凶郎宿怨醉拼迫革瞧奥输莉忠颗嗯佳旅仁鸟骗浩塔胖绪枫拔赞炮傅凯邪芳浑夺宽堆裂遭赤旋扭洁浮悉擦慧典赏匆评纵莲雾乌跃壮贴丰隔健辛抵竹彻摩轰编肚插磨哎御耐惧氏辉扶恢貌额述票录拖膀鹰孟递瑞唇暂货琴踪码慰蛇玲晕损轩粗掩屁悠仰零盟途贼洪悟固讶冬滑甜郁琳辆乃猪暖妮挣旦估坦甘佩莱享吼构粉萨吻潜瓶偶戒浓毁销迪拒绕勒朗嘻尾帐废延敲烂曼厌宜羞喂吟滴洲爹艳晴抚缩协央悔肖缠脆痕伍寂启翔薄侯劝郭奴鸣倾彼扔撒豫检针耀痴姆篇椅厂董熊埋乖狐蒋踏隆括潮唉穷聪唤泰版末旗仪焦猫盗侍挤款拾荒姿域搭脉授俗融狱欺访桥锁霸牵池钻港喃廷乘玛奉扯岳减弯夹辞岸岂屈恼哲季召丧尝恭载瘦皆颇茫染肃爽亏吞惹哀乔趁铺脏吕奖倍汤振婷牢扰溜庞臭悦赫赢跪麦枝侠泉劫炎泥赌弓魏罩疾饰符垂映漠脖饮沿懒肤桑堪燃卓祝赖宾贾喘焰吵冥鞋逸均库裤碗航踢姨酸啸龄阁舌箱冯邦钢霞促泡盾羊碧援忌抹倩锐喷拦嘉袖殊辰繁络抛嫁咒撤键湿恰虫审献媚贤葛刹袁摔序筑斜瓦涂湾莎崇猎刑墨娃梯桃豆驾浅径饿疲搬瓜莹滋润铃蛮蒂拨涛予勾惠析砍撑截措币薇愈督酷祥怖侵岩扮糟盈腹斩尺签稀掏夸汽液姬愧汇柱粮堡仗笨奏歉甩怔允竞祸耶爵绩诱呜穴黎租培砸麽井窝弥返匹啥凑奸陌叛核卧幅眨耗洒怡详卢扣哇丑勉孝矛氛衡陶购汪僵疗妃罚棋缝咐躯泛愁搜慈肥笼篮俱惟柜捉悬霍泄咽齿秒勤扩屏霜袍蝶祭厨胁璃劈赚锦尬尴熙寺昌贺巾描捕陵咳扇虹绵撕蔡催彭宠贪辱誓盒寸披搂饶跌欠肌售巡抑纹宏幼萍驻丛亿播俄刃蕾挨仲迈违辩埃艘琪灾僧渡卑雕鼠讯辣刷艰斥裙翠饱掠询勃夕矮瑶赐捏闯姚瑟渴谅昂串沟涉咕驶摄贫辕婉鹏姜碍荷冠魅玫裁坡鸿邓歪乏申割巫衫棒阔泣韦恍贯魄柄患覆蜜婴励锅陛遮帕咖嫌胳挖啪矿凄爪眠穆啡吾坛脾恒屠玻蓉础曰耸膊後逆寿驱猴佣毅舅铜娟眯淫吩匪牧役寄诡纤腐姻晰渊亭邀哄骚墓柯筋崔灿捷淋弗辑棍绳频廊畏歇裹苗盼咯耍煞寝瞒添嫂纠慨嚷驰拐宴津岚浴耻挽页誉牲乳仓逝喉逛樱兼戈哗涯捧铭障摊跨妥揉晋寞寨漆污嘲枚吊乾馨伪嗓呈卿楠籍裸链灌昆畅逍帽阅逗蹲踩窜哑趴逢植媒韵昭尹谦档趟沾兔订朴瞎鞭俺斤翅肠雀慎盆迁镖芬崖丘蠢庙潘颖拓娶纱漏谨珊仆宙尉屑叮捂涩诧柴杆涵坠赔涨嘟崩薛藤税枯译帘糖愉骄羡糕彬愚疏翰堵腕眸芸溪殷谎鼎稿哟冤症棵狄咧湘宛嫩肆宰憾偿腔哩豹瑰鉴绑潇戚郡澡桂兮雯颠狮邻契骇卜揭妄坑伐矩烁葬诀鄙鹿柏溃朕舟妆躁霉侦冻娅庸筹削砰耿牺筒遂旭胎惶淑叉痒竖龟斑儒嫣宅押胃旨册膝浸弦栏衷刮艇岗赴囊斧颊疆炉塌乞旺烤黛逊贱辨狸叙愕叠遣晌麟腥粒拟俏杖芝夷衬佐巷捡遵塑桶泼滩琼昊帆搏颈噢蹦寡贞凰哨拆茹劣嘱沃厢摘咋坤俯媳赋嘶贡碌匙拢谭翁辜竭廉械贸辅讽呐斌辽填窃抄溢妒吁嗦掀芙祈栋吱撇胞轿禅妨拂倦衰靖循挪蓬惩垃账驳署甫顽姥圾熬枕丐茜咦厕攀彤妍拽荆妓壶於寇鹤钥骤渺刊肢烛孕绽彦棉俘盔剪诞兜凛岭嚣溅笛舱罕鸭债噬钉躬倚缕咚撼蕊侄佑雁隶践拱沐菊蜂裕兆搅尿黯歹蓄朦嘀怯叨纽聘腻剥彪沸氓榜逻壳储憋啤匠悍昧泊篷烫狡轨汹携磊隙仑摧瞄胧趋挠煌擅卒饼狭丸惫瞅犬砖矣楞昔裳骆雇阎骷鸦妞墅焚谱绘梳肿魁耽擒陡璋茂蹄瞥瞳髅绣硕肺兹炒邮弘嫉届嗡娱喧脂膛沧疚盐扁搁茅滔坟掐瑜邱桐茵苹旷翘郝蓦诈沫菁粹琢腊钦喻宪锻睹郊饥侃粘媛谊恳厮锤凳淮蔽聂贩潭翩呻枉拘煮焉址匕渗览敦厦蕴冉薪呃峻荐栽嚎汁傍秃磕禀珑坎邵萌窄阮蹈碑婶煤寓栈滞倘杭暇狈峡侣芦蔓蒸禄胀醋淌伞姊钩衍妾嘎蜀蝴萝莽弩祷稚圳徽衙咸陋奢罐霄毙汝敞暮嘘灼澜姗倪挫咪钧捣燥泳眶乙澈焕酬筷宵缚揪蚁喇丞拎棠咙梭哧棺璇瀚肝敛剂疤渔嗔沮廖虏皓勋恕虐虞综瘾驴晒卦迦陀窥堕哆葡帖垫屡鹅蛛盲碟狞囚诊揽裴捞吏铮萄盏霆喔贷勿吭淘辟蔑淹麒喽栗绷惚桓坊桩嗽履璐菩巢畜兀樊锡棚仕倏芹僻絮杏浆瘫啧磁冈逮搓赠胶脊噩绰呕嚼谐歼揣殖拧伺霖驼襄衔惕掷卸炽敖惭框捆眩蝉谜炫塘阱膜亨奕蚂猩滨沁跋藩舔捐歧隋蹭甄蜡嗤缸嬉哮熄窍俞豁垒掘琦屎乍孽毯弧槐铠挟襟梨嗅祁纲渠矢捅扛朽忖匈扒雍莺侮闺霓稽斋",
    "夭沦揍瞟苟琉漪暑窟钓鳞瓷萱株倭鞘沛噜绞颓睿噗唔幢喀诅涕拣谣叽葱拭婢铸绮剿胤秩畔粥奎绸茨熏蹬诏岔叭咆滥梧垮澳浙甸绯诛鲍刁厥蚊鞠歆拙茗眷戮唬骏扳踹漓蝇擂涡沌凸蚩酿唾琐犀澄哉猾煎窒虾蝠钞瓣唧觑哽娥婿讪耕葫暧浇嗨诵疫兢箫颅啼绅杉嗜券遁炯霎讥迭彷觅娴抿剔稻敷泻怠龚绒讳勺函喳颂搀撩擎巍脯镶寥漾缴藉弊逞膏戳呛凹叩禽懊懈蛟亢呸芊慑跺跄蚀栖蔚铲坪筝顷腮踉狰踱嗖苑秉猿堤佟悯唠憨肘拇僚霹婕禹啃匀晖怅聋拯忿韧邹梢肋窘嵌婪辖浦炭曦簇螺酱屯悴匡冀橙倔陕筱叱髓淳矜詹菱芷惺浊囔朔憔睫睬鸽臀吨笙戟沼谍昕蛊煜祀罡伶荫酥懦厄峨轴伽雳卵捶檐棘嗣钗袜妩炕偎窦蝎溶幺膨峙缉徊呗衅砂舵昼迸斟舆椒靓旬厘窑萎涟疙芠瘩梵靴侥匿挚镯兑尧徘芽狙闵辫瀑嗷庐芯禾澎邢绊蜘憎靡褚湛蒲嚓珂崽贬惮婵嗒悸晦涅恬慷穹渣屉缭绢嬴袱黝袅淇茄寅赦悻祟榻蛙苇嵩茉唰咏凿粪噪菌蝙庶邸晟禧攒旱虔琛榴漱忑匣忐谬蟒棱钝悚廓惘漉蟹佬曳赎壤忡倡冶姝筠竿蜷癌嘈蚕剖颁缀汀谕牡斐懵皙缪蔷诫恤咄馒矫痞橘氧贿肮瑾璧烙攘攥汰溺铅咔芭戎褐巩吆彰漩聆蒜棕鹃帜鄂搐蔼怦穗亩撰绎牟咨奄梓绚阀烘炙翎惋驯栩逾墟鬟茬褪鑫骸峭缅灶洽祯暄裔韶缎砚锥辙惦铛枣桦邃橱搔腑萤枢遏募憬庵叼嫖苛锣蹑拌奠秽殴喋糙貂揖葵榆颐皂眈扼眺孜簌玺偌蹿蓓弛庇檀枭螂趾崭妲掂醇掺驿槽惬镰抡",
    "憧删鸳酣宦筐琅瞻焱飙湃俨跷栅撅煽呱缰猝衮肴殆谴蔬飒婧阐荧侈霏瘟芜俭崎亥俐屿譬饺垄畴杠鬓讼晏弈鞍瘸钮珏钰傀噔驭靶萦韬恙懿竺吝羁荀癫嘭菇恃瘪儡踌呦榕昵躇烬啰酌丙涎哒冽鸾砌烨翟辗噎驹噼咎亵陨蠕冕雌茸瑛剃掰蹙橡佯笃崛勘稼桀渝拚汐锈磅壕娄撮玑祠鹫娲黏珀睽栓绫阑邑瑕磋粟薯沪讷岑炜玮娼迂伎鲸翡坝铐洼蹊寐肾鸯這敝涧崆甭笠扈哝芮卉靳诬札婊裘扉疮巅坞膳剌鳄捺悼茧毋曙馅簸忒妳叟拴嬷稣痹垣蛤谏羹沥蛾瑚個熔惆雏饷拗燎熠薰蕃捋籁髦飓簿迢汩闸狩鲨蜥惴胯侨劭烹咣攸锄硝颔鸥滕寰紊蕉稠蟆垢楷炊忻炳腆褒酋赃拈抒孰袄褂孺胭赘嫡礁珉啜钳晾茎隧窿骋嫦槛掳莞瓢曜锯猖遐蹋飕麾渍猥篝殉枷蜒皎霁诩窖咫檬乒奚淤溯凋纺篱泌刨樵忏盎戾咀屹挎羔殃庚淼淀隘绛缨焘璨跤锵摁痊嫔來臻泯糜睦喵缥褥魇汶馋渎蜿抠诶墩棣沓喏诲琶缈缔酝耷弼柬浏拷剁柿琵沂蕙捻帛柠饵撂娓乓轲髯娉圭璀苔肪吮瞩啄帷箍蟑炖梗捎瞿嗬蘑唏鹊矶羌骼筛鲤羲祺馈伫羿苞犁铎啬舷矗癖掣匾谧瀛珞衲毓恺纬惰嘤诣谛藻啷佘黠饲虬涤骡钵邯笋瑀芥醺佼舜龌簪痰蹂恻簧甥腼驮缤潺獠筏锭阙粤瞌髻琏龊椎唆煦嵋幡翌毡碳鸨闽躏蜓咻捍睨鼾桔娆抉玟蜻徨嗲碾哐粼啐谑嚏甬鳖榨倜稷妤篡晤肇咂帚瘤瞠嚅怆镔撵裆腺骁坷箐螃冢锢晁濒蝗烽辘莘撬澹瓮亘钊篓缇宸泓鞑胄羚绥笺荤迄踞桨慵噤幌荻跚袒浣榄痪荼晗阉腋骰曝涮踵炬涣俟皑瞑渲擞赂湮麓铿埔峦噘涓掬莓怏萃呲蹒鳌睐昱旌摞們吠濮卞琬谙啕轶搪陇纨膺皋霭呓橄纶垛嗫盅拄踝臧淅岌岱璞缄秧翱卤逅靥磐壑斓翊挛琰叁佗阖戬怂汲垠迥咛邂杞痘臊藕湄媲癞辄獒恪砾痉吒蜕椰仨纣馁镐蜈窈說秤桢粱辐悖涔偕渭汴蜴桅隅卯骜孚禺琥阚杵掖畸晔婀菡噶昙坍俑滤侏潦挲覃硫俸蟠弋梆驸馀笈忱恿胥垦滢窕滇珅邬圃咿徙瘴舫嗝泞藐赣鹦逵戍榭牠揩熹蟾霾蔫跛岐脐糗螳哺鹭蚣炀嵬褶恸隽飚玥籽釜剐鸠磷沒娑谄巳恣猬酪溟丕隼峒芋觊旖筵娣婠盹涸劾颌趔殇噌轧沽愫鸢龇玷掸趄溥疵皖邺杳聿镀祎鹉匍崴岖幔蝈雒镑臆偃蜗瞰侬郸搡缆袂楮麼诠洵犊摹蟀邋瓒苻荦竣骥泗痣贲胴潼弑匐姣谤蘸蟋渥浒蛐阂糯愠嵇谒绾舀呤噙槟嘣诃宓脓樟忪蛰咤捱阜峥濡遢瑙碉荃孵讹嗵彝颀苓咝臾篆椭沏颦蛆淆揄嗑辎踮犷荔鳅會闫徵隗渤馍锏楣蜃遛倌氤戌嶙馗匮揶胚啻敕夙珈锹跂摒迩啾峪靼菠蓟沅馥槌燮褛為贻礴豚氲湍腌蚱殡毗耙诽褴恁呷蚌瘁铝蔻憩锚濑耘俾鬃裟祢苒蘅鱿唷傥袈豺町掇坯阏戛贮塾剽孬衩镣戊犟酉夥斡過珩匝诘攫潢黔臃罂轼酗嘹時阪璎冗桧闳皿囡辍觎浚闰臼蹩煲怵囤罔蚓碴姒灸蚯嗥堑箴谗嵘箩艮碱葆還旎谆粽牒泸蔺刽锷诋惇缜爻贰坳睑葭昀經噫妪镂癸沣笆壬绉抨箕叵坨颉姹赳琮焊淬纭埠泱恹淙榛酵銮孛嗳佶犒茱饪孪泠砺遽嗟钙鲲谚闾谟馊翦雉虱糠锴赈骠旮峋跆飛瘠潸饕佚淄谀镳廿喟偻绺沱囱铳袤兖對栾畿诌赓苯佻繇魈屌谲泾獗鞅蹶绔雹旯洱樣馄粲哂蔗饨奘芍淞腴現剜汾顼濂蜚殒麝鹞蚤浃坂颚忤洙祗無迤眦彗暹赧佝蒯郦僮钺嘞硅玳蛹睾螭赁盂瑁俅侗骛宕纂堰厩萋鄢帔蓁杈熨挞觐開阗钏煊泫迳夔缮燧嘁孱懑邕彧柩耆漕鹄龛饯餮幄鹘爰噻倨汜诙锃"
]
zhPunc = [
    "，",
    "。",
    "、",
    "；",
    "：",
    "？",
    "！",
    "“",
    "”",
    "‘",
    "’",
    "（",
    "）",
    "《",
    "》",
    "—",
    "…",
    "·"
]
enChar = [
    "e",
    "taonishr",
    "dlcumwfgypb",
    "vkjxqz"
]
enPunc = [
    ".",
    ",",
    "?",
    "!",
    ";",
    ":",
    "\"",
    "'",
    "(",
    ")",
    "[",
    "]",
    "-",
    "–",
    "/"
]

# 构建字符到类别的映射
char_to_category = {}
# zhChar: 6个子类
for i, s in enumerate(zhChar, 1):
    for ch in s:
        if ch in char_to_category:
            print(f"警告：字符 '{ch}' 重复出现在 zhChar_{i} 和之前的分类中，将覆盖。")
        char_to_category[ch] = f"zhChar_{i}"
# zhPunc: 17个子类
for i, s in enumerate(zhPunc, 1):
    for ch in s:
        if ch in char_to_category:
            print(f"警告：字符 '{ch}' 重复出现在 zhPunc_{i} 和之前的分类中，将覆盖。")
        char_to_category[ch] = f"zhPunc_{i}"
# enChar: 4个子类
for i, s in enumerate(enChar, 1):
    for ch in s:
        if ch in char_to_category:
            print(f"警告：字符 '{ch}' 重复出现在 enChar_{i} 和之前的分类中，将覆盖。")
        char_to_category[ch] = f"enChar_{i}"
# enPunc: 14个子类
for i, s in enumerate(enPunc, 1):
    for ch in s:
        if ch in char_to_category:
            print(f"警告：字符 '{ch}' 重复出现在 enPunc_{i} 和之前的分类中，将覆盖。")
        char_to_category[ch] = f"enPunc_{i}"

# 获取所有子类列表（用于统计）
categories = sorted(set(char_to_category.values()))
print(f"共 {len(categories)} 个子类：{categories}")

# ==================== 工具函数 ====================
def get_category_counts(text):
    """统计文本中各子类的频数，返回 Counter 对象（只包含 categories 中的键）"""
    counts = Counter()
    for ch in text:
        cat = char_to_category.get(ch)
        if cat is not None:
            counts[cat] += 1
    return counts

def compute_entropy(counts, total):
    """计算熵（基于 counts 和 total，忽略未出现的类别）"""
    if total == 0:
        return 0.0
    entropy = 0.0
    for cat in categories:
        p = counts.get(cat, 0) / total
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy

def chi_square_test(obs_counts, exp_probs, total):
    """计算卡方统计量和 p 值（自由度为 len(categories)-1）"""
    # 只考虑在观察中出现或期望非零的类别
    chi2 = 0.0
    df = 0
    for cat in categories:
        obs = obs_counts.get(cat, 0)
        exp = exp_probs.get(cat, 0) * total
        if exp > 0:
            chi2 += (obs - exp) ** 2 / exp
            df += 1
        elif obs > 0:
            # 期望为0但观察不为0，理论上不应该发生，但为避免除零，将卡方设为极大
            chi2 = float('inf')
            df = 1
            break
    df -= 1
    if chi2 == float('inf') or df <= 0:
        return float('inf'), 0.0
    from scipy.stats import chi2
    p = 1 - chi2.cdf(chi2, df)
    return chi2, p

def get_sliding_windows(text, win_size, step):
    """生成滑动窗口，返回 (start_index, window_text) 的生成器"""
    n = len(text)
    for start in range(0, n - win_size + 1, step):
        yield start, text[start:start+win_size]
    # 最后一个不足窗口大小的不处理，因为用户可能希望仅完整窗口

def find_most_abnormal_subwindow(text, win_size, step, global_probs, method, **kwargs):
    """
    在 text 内部寻找最异常的子窗口（滑动窗口）。
    返回 (start_index, window_text, score, counts, entropy_or_p)
    """
    best_score = -float('inf')
    best_info = None
    for start, sub in get_sliding_windows(text, win_size, step):
        counts = get_category_counts(sub)
        total = sum(counts.values())
        if total == 0:
            continue
        if method == 'threshold':
            # 得分：最大绝对偏差
            max_dev = 0.0
            for cat in categories:
                p_local = counts.get(cat, 0) / total
                p_global = global_probs.get(cat, 0)
                dev = abs(p_local - p_global)
                if dev > max_dev:
                    max_dev = dev
            score = max_dev
        elif method == 'entropy':
            entropy = compute_entropy(counts, total)
            score = 1.0 / (entropy + 1e-9)  # 熵越小，得分越高
        elif method == 'chisquare':
            # 计算 p 值，得分 = 1 - p
            chi2, p = chi_square_test(counts, global_probs, total)
            score = 1 - p  # p 越小，得分越高
        else:
            raise ValueError(f"未知方法: {method}")

        if score > best_score:
            best_score = score
            best_info = (start, sub, score, counts, total)
    return best_info

# ==================== 主程序 ====================
def main():
    # 读取文件
    try:
        with open('sample.txt', 'r', encoding='utf-8') as f:
            full_text = f.read()
    except FileNotFoundError:
        print("错误：未找到 sample.txt 文件。")
        return

    # 全局统计
    global_counts = get_category_counts(full_text)
    global_total = sum(global_counts.values())
    global_probs = {cat: global_counts.get(cat, 0) / global_total for cat in categories}
    print("全局统计：")
    for cat in categories:
        print(f"  {cat}: {global_counts.get(cat,0)} ({global_probs[cat]:.2%})")

    # 粗粒度划分（固定窗口，无重叠）
    n = len(full_text)
    windows = []
    for start in range(0, n, WINDOW_SIZE):
        end = min(start + WINDOW_SIZE, n)
        windows.append((start, full_text[start:end]))

    # 定义三种方案
    methods = {
        'threshold': {
            'threshold': THRESHOLD,
            'func': lambda counts, total, global_probs: any(
                abs(counts.get(cat,0)/total - global_probs.get(cat,0)) > THRESHOLD
                for cat in categories
            )
        },
        'entropy': {
            'threshold': ENTROPY_THRESHOLD,
            'func': lambda counts, total, global_probs: compute_entropy(counts, total) < ENTROPY_THRESHOLD
        },
        'chisquare': {
            'threshold': CHI_SQ_ALPHA,
            'func': lambda counts, total, global_probs: chi_square_test(counts, global_probs, total)[1] < CHI_SQ_ALPHA
        }
    }

    # 对每种方法进行处理
    for method_name, params in methods.items():
        print(f"\n处理方案: {method_name}")
        out_file = f"result_{method_name}.txt"
        with open(out_file, 'w', encoding='utf-8') as fout:
            fout.write(f"字符分类异常片段检测报告 - 方案: {method_name}\n")
            fout.write("="*80 + "\n\n")
            fout.write("参数设置：\n")
            if method_name == 'threshold':
                fout.write(f"  阈值 (绝对差) = {params['threshold']}\n")
            elif method_name == 'entropy':
                fout.write(f"  熵阈值 = {params['threshold']}\n")
            elif method_name == 'chisquare':
                fout.write(f"  显著性水平 α = {params['threshold']}\n")
            fout.write(f"  粗粒度窗口大小 = {WINDOW_SIZE} 字符\n")
            fout.write(f"  细粒度滑动窗口大小 = {SLIDING_WIN_SIZE} 字符\n")
            fout.write(f"  细粒度滑动步长 = {SLIDING_STEP} 字符\n\n")

            fout.write("全局各子类占比（基于所有字符）：\n")
            for cat in categories:
                fout.write(f"  {cat}: {global_probs[cat]:.4f}\n")
            fout.write("\n" + "-"*80 + "\n\n")

            # 遍历每个粗粒度窗口，判断是否异常
            abnormal_windows = []
            for start, window_text in windows:
                counts = get_category_counts(window_text)
                total = sum(counts.values())
                if total == 0:
                    continue
                if params['func'](counts, total, global_probs):
                    abnormal_windows.append((start, window_text, counts, total))

            if not abnormal_windows:
                fout.write("未发现异常片段。\n")
                continue

            fout.write(f"共发现 {len(abnormal_windows)} 个异常粗粒度片段：\n\n")
            for i, (start, window_text, counts, total) in enumerate(abnormal_windows, 1):
                fout.write(f"异常片段 {i}:\n")
                fout.write(f"  起始索引: {start}\n")
                fout.write(f"  片段长度: {len(window_text)} 字符\n")
                # 内容预览（最多100字符）
                preview = window_text[:100].replace('\n', '\\n').replace('\r', '\\r')
                if len(window_text) > 100:
                    preview += "..."
                fout.write(f"  内容: {preview}\n")
                # 各类别计数与占比
                fout.write("  各类别统计:\n")
                for cat in categories:
                    cnt = counts.get(cat, 0)
                    p_local = cnt / total if total > 0 else 0
                    p_global = global_probs.get(cat, 0)
                    fout.write(f"    {cat}: {cnt:6d} ({p_local:.2%})  [全局 {p_global:.2%}]\n")
                # 异常原因（根据方案输出）
                if method_name == 'threshold':
                    deviations = []
                    for cat in categories:
                        p_local = counts.get(cat, 0) / total
                        p_global = global_probs.get(cat, 0)
                        if abs(p_local - p_global) > THRESHOLD:
                            deviations.append(f"{cat} 偏差 {p_local-p_global:+.2%}")
                    fout.write(f"  异常原因: 以下子类占比与全局偏差超过 {THRESHOLD:.0%}: {', '.join(deviations)}\n")
                elif method_name == 'entropy':
                    entropy = compute_entropy(counts, total)
                    fout.write(f"  异常原因: 片段熵 = {entropy:.4f} < 阈值 {ENTROPY_THRESHOLD}\n")
                elif method_name == 'chisquare':
                    chi2, p = chi_square_test(counts, global_probs, total)
                    fout.write(f"  异常原因: 卡方检验 p = {p:.6f} < {CHI_SQ_ALPHA}\n")

                # 内部最异常子片段
                fout.write("\n  内部最异常子片段 (滑动窗口):\n")
                result = find_most_abnormal_subwindow(
                    window_text, SLIDING_WIN_SIZE, SLIDING_STEP,
                    global_probs, method_name
                )
                if result is None:
                    fout.write("    无法找到有效的子窗口（可能是窗口内无分类字符）。\n")
                else:
                    sub_start, sub_text, score, sub_counts, sub_total = result
                    # 子片段在原文中的绝对起始索引
                    abs_start = start + sub_start
                    sub_preview = sub_text[:100].replace('\n', '\\n').replace('\r', '\\r')
                    if len(sub_text) > 100:
                        sub_preview += "..."
                    fout.write(f"    起始索引: {abs_start}\n")
                    fout.write(f"    内容: {sub_preview}\n")
                    fout.write(f"    异常得分: {score:.6f}\n")
                    fout.write("    子片段各类别统计:\n")
                    for cat in categories:
                        cnt = sub_counts.get(cat, 0)
                        p_local = cnt / sub_total if sub_total > 0 else 0
                        fout.write(f"      {cat}: {cnt:6d} ({p_local:.2%})\n")
                fout.write("\n" + "-"*40 + "\n\n")

        print(f"结果已写入 {out_file}")

if __name__ == '__main__':
    main()
