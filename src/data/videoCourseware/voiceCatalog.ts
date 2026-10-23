/** Video resource editing shortlist supplied by Jolin on 2026-10-23.
 * IDs are provider values, not UI aliases. English accent grouping is user-curated.
 * Display names are UI labels; no audition approval is implied.
 */
export type VoiceLanguage = 'zh-CN' | 'en-GB';
export type VoiceCategory = 'child' | 'female' | 'male';
export interface VideoVoice {
 id: string;
 name: string;
 /** Editorial role/use suggestion based on provider naming, not an audition result. */
 description: string;
 language: VoiceLanguage;
 category: VoiceCategory;
}
export const videoVoiceLanguages = [{id:'zh-CN',name:'中文（普通话）'},{id:'en-GB',name:'英语－英音'}] as const;
export const videoVoiceCategories = [{id:'child',name:'儿童'},{id:'female',name:'女声'},{id:'male',name:'男声'}] as const;
export const videoVoices: readonly VideoVoice[] = [
 {id:'Chinese (Mandarin)_Cute_Spirit',name:'萌趣角色',description:'萌趣伙伴角色，游戏互动反馈',language:'zh-CN',category:'child'},
 {id:'Chinese (Mandarin)_ExplorativeGirl',name:'探索女孩',description:'探索型角色，发现线索与提问',language:'zh-CN',category:'child'},
 {id:'Chinese (Mandarin)_BashfulGirl',name:'腼腆女孩',description:'腼腆型角色，含蓄的人物对话',language:'zh-CN',category:'child'},
 {id:'Chinese (Mandarin)_Kind-hearted_Antie',name:'亲切阿姨',description:'亲切长辈角色，生活故事讲述',language:'zh-CN',category:'female'},
 {id:'Chinese (Mandarin)_Wise_Women',name:'知性女声',description:'知性讲述角色，知识讲解',language:'zh-CN',category:'female'},
 {id:'Chinese (Mandarin)_Warm_HeartedGirl',name:'暖心女声',description:'暖心陪伴角色，鼓励与引导',language:'zh-CN',category:'female'},
 {id:'Chinese (Mandarin)_Reliable_Executive',name:'沉稳男声',description:'可靠成熟角色，规则说明',language:'zh-CN',category:'male'},
 {id:'Chinese (Mandarin)_Male_Announcer',name:'播报男声',description:'播报型角色，任务与信息介绍',language:'zh-CN',category:'male'},
 {id:'Chinese_casual_instructor_vv2',name:'自然男讲师',description:'日常讲师角色，课堂讲解',language:'zh-CN',category:'male'},
 {id:'Chinese_knowledgable_instructor_vv1',name:'博学男讲师',description:'知识型讲师，概念与背景介绍',language:'zh-CN',category:'male'},
 {id:'Chinese_radient_storyteller_vv1',name:'故事男声',description:'故事讲述角色，情节串联',language:'zh-CN',category:'male'},
 {id:'English_LovelyGirl',name:'可爱女孩',description:'可爱系女孩，绘本角色对话',language:'en-GB',category:'child'},
 {id:'English_SadTeen',name:'少年男声',description:'少年角色，故事人物对话',language:'en-GB',category:'child'},
 {id:'BritishChild_male_1_v1',name:'小男孩',description:'男童角色，低龄情境对话',language:'en-GB',category:'child'},
 {id:'BritishChild_female_1_v1',name:'小女孩',description:'女童角色，低龄情境对话',language:'en-GB',category:'child'},
 {id:'English_Kind-heartedGirl',name:'暖心女孩',description:'友善伙伴角色，鼓励与陪伴',language:'en-GB',category:'child'},
 {id:'English_CalmWoman',name:'平静女声',description:'平静讲述角色，阅读与旁白',language:'en-GB',category:'female'},
 {id:'English_radiant_girl',name:'明亮女声',description:'明朗角色，课堂互动与回应',language:'en-GB',category:'female'},
 {id:'English_Sharp_Commentator',name:'评论女声',description:'评论型角色，观点表达与讲评',language:'en-GB',category:'female'},
 {id:'English_Comedian',name:'幽默男声',description:'喜剧角色，趣味对白与反馈',language:'en-GB',category:'male'},
 {id:'English_magnetic_voiced_man',name:'磁性男声',description:'磁性男声角色，故事旁白',language:'en-GB',category:'male'},
 {id:'English_GentleTeacher',name:'温和男老师',description:'温和教师角色，讲解与引导',language:'en-GB',category:'male'},
];
