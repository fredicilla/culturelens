"""The topic poems that ship with the app (written by AI, checked here), saved as poems.json."""
import json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from samri_verse import check_poem
def H(text, syl):
    out = []
    for s in syl.split():
        if '(' in s: t, w = s[:-1].split('('); out.append({'t': t, 'w': int(w)})
        else: out.append({'t': s, 'w': -1})
    return {'text': text, 'syl': out}
P = {}
P['palm'] = dict(topic={'en': 'The palm tree', 'ar': 'النخلة'},
  mean={'en': 'My palm, how lovely your shade and your height; all the good, my people, comes from her fruit. How sweet in the summer heat your heavy bunches bend; the rains of al-Wasm came and watered her.',
        'ar': 'يمدح النخلة: ظلها وطولها وخيرها، وثمرها اللي يميل من ثقله في القيظ، والوسم اللي سقاها.'},
  abyat=[dict(sadr=H('يا نخلتي يا زين ظلّك وطولك', 'yaa(0) nakh(1) la tii yaa(2) zii(3) ni Zil(4) lak wa(5) Tuu lik'),
              ajz=H('والخير كلّه يا هلي من جناها', 'wal(0) khay ri kil(1) lih yaa(2) ha(3) lii min(4) ja(5) naa haa')),
         dict(sadr=H('يا ما حلا في القيظ ميلة حمولك', 'yaa(0) maa(1) Ha(2) laa fil(3) gay(4) Zi mee(5) lat Ha(6) muu lik'),
              ajz=H('والوسم جاها والمطر قد سقاها', 'wal(0) was mi jaa(1) haa wal(2) ma Tar gad(3) sa(4) gaa haa'))])
P['coffee'] = dict(topic={'en': 'Coffee', 'ar': 'القهوة'},
  mean={'en': 'My dallah, pour for a guest who has come to us; with cardamom her scent filled the majlis. It is the custom of our forefathers from long ago; the guest is honored, and generosity lives in its keeping.',
        'ar': 'عن الدلة والقهوة بالهيل للضيف، وأنها من عادات الأجداد في الكرم.'},
  abyat=[dict(sadr=H('يا دلّتي صبّي لضيفٍ لفانا', 'yaa(0) dal(1) la tii Sub(2) bii li(3) Zay fin la(4) faa naa'),
              ajz=H('بالهيل فاحت في المجالس شذاها', 'bil(0) hee li faa(1) Hat fil(2) ma(3) jaa lis sha(4) dhaa haa')),
         dict(sadr=H('من عادة الأجداد هي من زمانا', "min(0) 3aa(1) da til 'aj(2) daa di hii(3) min(4) za(5) maa naa"),
              ajz=H('والضيف يكرم والكرم في ذراها', 'waZ(0) Zay fi yik(1) ram wal(2) ka ram fii(3) dha(4) raa haa'))])
P['rain'] = dict(topic={'en': 'Rain', 'ar': 'المطر'},
  mean={'en': 'The rain poured and the plants of the open land laughed; the earth blooms with the spring of the deserts. The birds sang and its shepherds are full of joy; the flood runs through the valleys of the land.',
        'ar': 'عن المطر لما يهل: البر يخضر، والطير يغني، والسيل يجري في الشعبان.'},
  abyat=[dict(sadr=H('هلّ المطر والبرّ ضحّك نباته', 'hal(0) lal(1) ma Tar wal(2) bar ri Zah(3) hak na(4) baa tih'),
              ajz=H('والأرض تزهى من ربيع الصحارى', "wal(0) 'ar Zi taz(1) haa mir(2) ra(3) bii 3iS Sa(4) Haa raa")),
         dict(sadr=H('والطير غنّى والفرح في رعاته', 'waT(0) Tee ri ghan(1) naa wal(2) fa raH fii(3) ru(4) 3aa tih'),
              ajz=H('والسيل يجري في شعيب الديارا', 'was(0) say li yij(1) rii fii(2) shi(3) 3ee bid di(4) yaa raa'))])
P['falcon'] = dict(topic={'en': 'The falcon', 'ar': 'الصقر'},
  mean={'en': 'A noble peregrine that fears no hardship; every morning he hunts the houbara. He watches with his eye, then takes his prey; everyone takes pride in him across the deserts.',
        'ar': 'عن الشاهين الحر وصيده للحبارى، وفخر الناس فيه.'},
  abyat=[dict(sadr=H('شاهين حرٍّ ما يهاب الشدايد', 'shaa(0) hii ni Hur(1) rin maa(2) yi(3) haa bish sha(4) daa yid'),
              ajz=H('في كل صبحٍ دوم يصيد الحبارى', 'fii(0) kil(1) li Sub(2) Hin dom(3) yi(4) Sii dil Hu(5) baa raa')),
         dict(sadr=H('يرقب بعينه ثمّ يحوش الطرايد', 'yir(0) gib bi(1) 3ee nih thum(2) yi(3) Huu shiT Ta(4) raa yid'),
              ajz=H('والكلّ يفخر فيه وسط الصحارى', 'wal(0) kil li yif(1) khar fii(2) hi waS(3) TiS Sa(4) Haa raa'))])
P['night'] = dict(topic={'en': 'A night of samar', 'ar': 'ليلة سمر'},
  mean={'en': 'O night of samar and poems; the tar beats its tune for those who stay up. Poetry brings back the old customs; their voices fill the whole land.',
        'ar': 'عن ليلة السمر والقصايد وضرب الطار، وأن الشعر يحيي العوايد القديمة.'},
  abyat=[dict(sadr=H('يا ليلةٍ فيها السمر والقصايد', 'yaa(0) lee(1) la tin fii(2) has sa(3) mar wal(4) ga Saa yid'),
              ajz=H('والطار يضرب نغمته للسهارى', 'waT(0) Taa ri yiZ(1) rib nagh(2) ma tih lis(3) su haa raa')),
         dict(sadr=H('والشعر يحيي من قديم العوايد', 'wash(0) shi3 ri yiH(1) yii min(2) ga(3) dii mil 3a(4) waa yid'),
              ajz=H('أصواتهم تملا جميع الديارا', "'aS(0) waa ta hum tam(1) laa ja(2) mii 3id di(3) yaa raa"))])
P['homeland'] = dict(topic={'en': 'The homeland', 'ar': 'الوطن'},
  mean={'en': 'Our land, our pride, there is none like you; from her east to her west, all of it is beauty. Your sea, your desert, the mountain and your palms; may she stay dear forever, and God protect her.',
        'ar': 'عن الوطن وعزه وجماله من شرقه لغربه، بحره وبره وجباله ونخيله.'},
  abyat=[dict(sadr=H('يا دارنا يا عزّنا ما مثيلك', 'yaa(0) daa(1) ra naa yaa(2) 3iz(3) za naa maa(4) ma(5) thii lik'),
              ajz=H('من شرقها والغرب كلّه بهاها', 'min(0) shar(1) ga haa wal(2) ghar bi kil(3) lih ba(4) haa haa')),
         dict(sadr=H('بحرك وبرّك والجبل مع نخيلك', 'baH(0) rik wi(1) bar rik wal(2) ja bal ma3(3) na(4) khii lik'),
              ajz=H('تبقى عزيزه دوم وربّي حماها', 'tib(0) gaa 3a(1) zii zih dom(2) wi(3) rab bii Ha(4) maa haa'))])
bad = 0
for k, p in P.items():
    e = check_poem(p)
    print(k, 'OK' if not e else e); bad += bool(e)
json.dump(P, open(os.path.join(HERE, 'poems.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('saved', len(P), 'poems;', bad, 'with problems')
