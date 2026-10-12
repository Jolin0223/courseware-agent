import { VIDEO_EXAMPLE_PROMPT } from './fixtures';

export interface VideoHomepagePrompt {
  label: string;
  prompt: string;
  subject: '语文' | '数学' | '英语';
}

// Each rotation gives teachers one example per subject. The first four prompts
// are distilled from the linked, existing courseware cases; the rest are new ideas.
export const VIDEO_HOMEPAGE_PROMPT_GROUPS: VideoHomepagePrompt[][] = [
  [
    { label: '悟空借扇识雨字', subject: '语文', prompt: VIDEO_EXAMPLE_PROMPT },
    { label: '悟空赴宴学搭配', subject: '数学', prompt: '给一、二年级做《悟空赴宴》视频互动课件：孙悟空去赴宴，先用视频交代任务，再暂停让学生分别搭配上衣和裤子、主食和水果、礼袋和挂饰。每关先固定一类、依次换另一类，数出所有不重复的搭配并选择算式；漏数或重复时提示重试，完成后继续赴宴故事。' },
    { label: 'Bobo 午餐车学复数', subject: '英语', prompt: '给幼儿园做《Bobo’s Magic Lunch Truck》英语视频互动课件：先看 Bobo 开午餐车的故事，再暂停让学生听订单、把对应数量的食物放进餐盘；比较一个和多个，听读食物单词及单复数，最后为餐盘选正确的单词标签。答错重听提示，答对继续服务下一位朋友。' },
  ],
  [
    { label: '故事找形声字', subject: '语文', prompt: '给二年级做森林寻字视频互动课件：小松鼠找不到路标，先用视频引出“木、氵”等偏旁线索，再暂停让学生点击偏旁猜字义、把字与读音配对，最后在新路标中独立认出两个形声字。答错展示偏旁提示，答对继续寻路。' },
    { label: '小熊分饼学平均分', subject: '数学', prompt: '给二年级做小熊分饼视频互动课件：先用视频讲三只小熊分饼不公平的故事，再暂停让学生拖动饼干，尝试把同样多的饼干分给每只小熊；显示每人得到的数量，分得不一样时允许调整，最后换一组数量独立判断是否平均分。' },
    { label: 'Panda 玩具店学英语', subject: '英语', prompt: '给幼儿园做《New Toys》英语视频互动课件：先跟 Panda 看逛玩具店的故事，再暂停让学生听音找 car、ball、bus、balloon，跟读单词、配对图片与词，选择缺失的首字母；最后选一件玩具说简短完整句子。答错可重听，完成后回顾四个词。' },
  ],
  [
    { label: '拼音声母救援队', subject: '语文', prompt: '给一年级做拼音声母视频互动课件：先用视频讲小伙伴寻找走失声母卡的故事，再暂停让学生听 b、p、m、f 的发音，选出听到的声母并与图片词语配对。容易混淆的音允许重听并给出口形提示，最后独立帮角色找回两张声母卡。' },
    { label: '10 以内加法寻宝', subject: '数学', prompt: '给一年级做 10 以内加法视频互动课件：先用视频讲寻宝地图和缺失宝石的故事，再暂停让学生拖动宝石，把两组数量合起来并说出总数；接着选择对应的加法算式，答错显示可数的宝石并重试，答对打开下一处宝箱。' },
    { label: '动物园英语问答', subject: '英语', prompt: '给幼儿园做动物园英语视频互动课件：先用视频带孩子走进动物园，依次认识 cat、dog、bird 等动物；每段视频后暂停，听声音选图片并跟读单词。最后由角色问 What is it?，学生选图回答，答错重听，答对继续参观。' },
  ],
  [
    { label: '量词游乐园', subject: '语文', prompt: '给一年级做语文量词视频互动课件：先用视频讲角色在游乐园找物品的故事，再暂停让学生把“一只、一辆、一本”拖到动物、车和书的图片旁；搭配错误时展示物品特征并重试，最后听完整句子选合适量词。' },
    { label: '图形小镇找形状', subject: '数学', prompt: '给幼儿园做数学形状视频互动课件：先用视频带孩子进入图形小镇，观察圆形、三角形和正方形；再暂停让学生在场景中点击对应图形，最后拖动三种形状拼出小房子。点错给出边角提示，可重新尝试，完成后回顾每种形状。' },
    { label: '早餐英语小帮手', subject: '英语', prompt: '给一年级做早餐英语视频互动课件：先用视频讲角色准备早餐的故事，再暂停让学生听音选择 milk、bread、egg 等食物，跟读并把食物放到餐盘；最后选一份自己的早餐，用 I like… 组成简短句子。答错可重听，答对展示完成的餐盘。' },
  ],
];
