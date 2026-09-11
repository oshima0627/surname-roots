# 書き換え結果の機械検証。新しい固有名詞・数字が増えていないか、禁止語が残っていないかを見る
import json,re,sys,glob,os
S=sys.argv[1]
orig={}
for f in glob.glob('src/data/surnames/*.json'):
    d=json.load(open(f,encoding='utf-8')); orig[d['slug']]=d['origin']
BAN=['名字由来','語源辞典','ウィキペディア','myoji-yurai','name-power','Wikipedia']
GENERIC=set('独立 範囲 参照 解説 諸説 一説 発祥 由来 地名 地形 記録 時代 一族 系統 表記 起源 語源 意味 地域 各地 全国 一方 同地 資料 伝承 有力 分布 現在 発祥地 出身 説明 名乗 起こ 別系 同系 両説 二説 複数 場合 場所 名称 意味 両者 前者 後者 前後 以降 以前 当時 名字 苗字 姓氏 氏族 家系 子孫 末裔 後裔 一門 豪族 武士 藩士 幕臣 御家人 大名 旗本 藩主 郷士 神職 社家 庶流 嫡流 分家 本家 分流 支流 傍流 末流 流れ 系譜 系図 移住 定住 土着 帰化 改姓 改名 転訛 転じ 略し 省略 縁起 瑞祥 職業 職能 官職 役職 屋号 商家 商人 農民 農家 神社 寺院 寺社 城主 領主 地頭 荘園 郡司 国司 守護 守護代 地侍 国人 国衆 土豪 一帯 周辺 付近 近辺 現地 旧郡 旧村 旧町 現地名 同名 同郡 同国 同村 同町 同市 同県 同郷 各説 別説 異説 通説 定説 俗説 伝説 伝え 由緒 出自 来歴 沿革 歴史 古代 中世 近世 近代 平安 鎌倉 室町 南北朝 戦国 安土桃山 江戸 明治 大正 昭和 奈良 飛鳥 古墳'.split())
def kanji_runs(s): return set(re.findall(r'[一-龥々]{2,}',s))
def nums(s): return set(re.findall(r'\d+',s))
tot=0; bad=0; report=[]
for f in sorted(glob.glob(f'{S}/out-*.json')):
    for it in json.load(open(f,encoding='utf-8')):
        tot+=1; slug=it['slug']; new=it['origin'].strip(); old=orig[slug]
        probs=[]
        for b in BAN:
            if b in new: probs.append(f'禁止語 {b}')
        newk=kanji_runs(new)-kanji_runs(old)
        # 旧文の部分文字列として現れる語は許す（例: 旧「陸奥国安達郡」→ 新「安達郡」）
        newk={k for k in newk if k not in old and not any(k in o for o in kanji_runs(old)) and k not in GENERIC}
        if newk: probs.append('新出漢字語 '+'/'.join(sorted(newk)))
        nn=nums(new)-nums(old)
        if nn: probs.append('新出数字 '+'/'.join(sorted(nn)))
        r=len(new)/max(1,len(old))
        if r<0.6 or r>1.35: probs.append(f'長さ比 {r:.2f}')
        if len(new)<60: probs.append('60字未満')
        if probs: bad+=1; report.append((slug,probs,old,new))
print(f'checked {tot}  flagged {bad}')
for slug,probs,old,new in report:
    print('\n###',slug,'|',' ; '.join(probs)); print('OLD:',old); print('NEW:',new)
