/**
 * samri-ai.js: a Samri written by AI on a topic you pick, sung by the two rows.
 *
 * Two ways a poem comes:
 *   - The topics below ship with the app: the poems were written by AI (Claude) ahead of time, checked
 *     for the meter and the rhyme, and sung ahead of time by the same machine voices as the rest of the
 *     Samri (one small audio file per topic, in samri-ai/). They work with no server.
 *   - Any other topic needs the AI Samri server (the samri-ai-server folder): Claude writes two abyat on
 *     the topic, the server checks the meter and the rhyme (and sends bad tries back to be fixed), then
 *     sings each half for each row. Set its address in AI_URL below (or open the page once with
 *     ?ai=https://your-server, which is remembered on that device).
 *
 * The meter is the one of the verse the app teaches (يا جر قلبي جر لدن الغصوني): every half is twelve
 * sung syllables, L L S L  L L S L  L S L L, so every poem fits the same rhythm and the same tune.
 * The singing is a machine voice (Arabic text-to-speech set to the tune), not a recording of a group.
 */
export var AI_URL = '';

// where a topic's audio begins: a click this far in, then the phrases at [start, length, lead-in before the first pulse]
var CLICK = 0.25;
export var BANK = {
  palm: {
    topic: {en: "The palm tree", ar: "النخلة"},
    mean: {en: "My palm, how lovely your shade and your height; all the good, my people, comes from her fruit. How sweet in the summer heat your heavy bunches bend; the rains of al-Wasm came and watered her.", ar: "يمدح النخلة: ظلها وطولها وخيرها، وثمرها اللي يميل من ثقله في القيظ، والوسم اللي سقاها."},
    abyat: [
      { sadr: { text: "يا نخلتي يا زين ظلّك وطولك", syl: [["yaa", 0], ["nakh", 1], ["la", -1], ["tii", -1], ["yaa", 2], ["zii", 3], ["ni", -1], ["Zil", 4], ["lak", -1], ["wa", 5], ["Tuu", -1], ["lik", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 0.45], [4, 1.5, 2, 1.0], [5.5, 1, 3, 0.45], [6.5, 0.5, -1, 0.45], [7, 1, 4, 0.45], [8, 1, -1, 1.0], [9, 0.5, 5, 1.0], [9.5, 1.25, -1, 0.5], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والخير كلّه يا هلي من جناها", syl: [["wal", 0], ["khay", -1], ["ri", -1], ["kil", 1], ["lih", -1], ["yaa", 2], ["ha", 3], ["lii", -1], ["min", 4], ["ja", 5], ["naa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 1.0], [6.5, 0.5, 3, 1.0], [7, 1, -1, 0.45], [8, 1, 4, 0.45], [9, 0.5, 5, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "يا ما حلا في القيظ ميلة حمولك", syl: [["yaa", 0], ["maa", 1], ["Ha", 2], ["laa", -1], ["fil", 3], ["gay", 4], ["Zi", -1], ["mee", 5], ["lat", -1], ["Ha", 6], ["muu", -1], ["lik", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, 2, 1.0], [3, 1, -1, 1.0], [4, 1.5, 3, 0.45], [5.5, 1, 4, 1.0], [6.5, 0.5, -1, 0.45], [7, 1, 5, 0.72], [8, 1, -1, 1.0], [9, 0.5, 6, 1.0], [9.5, 1.25, -1, 0.5], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والوسم جاها والمطر قد سقاها", syl: [["wal", 0], ["was", -1], ["mi", -1], ["jaa", 1], ["haa", -1], ["wal", 2], ["ma", -1], ["Tar", -1], ["gad", 3], ["sa", 4], ["gaa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 1.0], [4, 1.5, -1, 1.0], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 3, 1.0], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.04, 0.1355], b0s1: [5.66, 5.0508, 0.1365], b0a0: [10.8309, 5.059, 0.1614], b0a1: [16.0099, 5.0808, 0.1589], b1s0: [21.2107, 5.0688, 0.164], b1s1: [26.3995, 5.0809, 0.1636], b1a0: [31.6004, 5.085, 0.155], b1a1: [36.8054, 5.0584, 0.1517] }
  },
  coffee: {
    topic: {en: "Coffee", ar: "القهوة"},
    mean: {en: "My dallah, pour for a guest who has come to us; with cardamom her scent filled the majlis. It is the custom of our forefathers from long ago; the guest is honored, and generosity lives in its keeping.", ar: "عن الدلة والقهوة بالهيل للضيف، وأنها من عادات الأجداد في الكرم."},
    abyat: [
      { sadr: { text: "يا دلّتي صبّي لضيفٍ لفانا", syl: [["yaa", 0], ["dal", 1], ["la", -1], ["tii", -1], ["Sub", 2], ["bii", -1], ["li", 3], ["Zay", -1], ["fin", -1], ["la", 4], ["faa", -1], ["naa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 0.45], [4, 1.5, 2, 0.5], [5.5, 1, -1, 0.45], [6.5, 0.5, 3, 0.45], [7, 1, -1, 1.0], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] },
        ajz: { text: "بالهيل فاحت في المجالس شذاها", syl: [["bil", 0], ["hee", -1], ["li", -1], ["faa", 1], ["Hat", -1], ["fil", 2], ["ma", 3], ["jaa", -1], ["lis", -1], ["sha", 4], ["dhaa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, -1, 0.72], [2.5, 0.5, -1, 0.45], [3, 1, 1, 1.0], [4, 1.5, -1, 1.0], [5.5, 1, 2, 0.45], [6.5, 0.5, 3, 1.0], [7, 1, -1, 1.0], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "من عادة الأجداد هي من زمانا", syl: [["min", 0], ["3aa", 1], ["da", -1], ["til", -1], ["'aj", 2], ["daa", -1], ["di", -1], ["hii", 3], ["min", 4], ["za", 5], ["maa", -1], ["naa", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 0.45], [4, 1.5, 2, 1.0], [5.5, 1, -1, 1.0], [6.5, 0.5, -1, 0.45], [7, 1, 3, 0.45], [8, 1, 4, 0.45], [9, 0.5, 5, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] },
        ajz: { text: "والضيف يكرم والكرم في ذراها", syl: [["waZ", 0], ["Zay", -1], ["fi", -1], ["yik", 1], ["ram", -1], ["wal", 2], ["ka", -1], ["ram", -1], ["fii", 3], ["dha", 4], ["raa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 1.0], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 3, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.0789, 0.175], b0s1: [5.6989, 5.0413, 0.144], b0a0: [10.8601, 5.0548, 0.1416], b0a1: [16.035, 5.0028, 0.0944], b1s0: [21.1577, 5.0366, 0.1372], b1s1: [26.3143, 5.041, 0.1346], b1a0: [31.4753, 5.0315, 0.1277], b1a1: [36.6268, 5.0593, 0.1532] }
  },
  rain: {
    topic: {en: "Rain", ar: "المطر"},
    mean: {en: "The rain poured and the plants of the open land laughed; the earth blooms with the spring of the deserts. The birds sang and its shepherds are full of joy; the flood runs through the valleys of the land.", ar: "عن المطر لما يهل: البر يخضر، والطير يغني، والسيل يجري في الشعبان."},
    abyat: [
      { sadr: { text: "هلّ المطر والبرّ ضحّك نباته", syl: [["hal", 0], ["lal", 1], ["ma", -1], ["Tar", -1], ["wal", 2], ["bar", -1], ["ri", -1], ["Zah", 3], ["hak", -1], ["na", 4], ["baa", -1], ["tih", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 1.0], [4, 1.5, 2, 1.0], [5.5, 1, -1, 1.0], [6.5, 0.5, -1, 0.45], [7, 1, 3, 1.0], [8, 1, -1, 1.0], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والأرض تزهى من ربيع الصحارى", syl: [["wal", 0], ["'ar", -1], ["Zi", -1], ["taz", 1], ["haa", -1], ["mir", 2], ["ra", 3], ["bii", -1], ["3iS", -1], ["Sa", 4], ["Haa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 1.0], [4, 1.5, -1, 1.0], [5.5, 1, 2, 0.45], [6.5, 0.5, 3, 1.0], [7, 1, -1, 0.45], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "والطير غنّى والفرح في رعاته", syl: [["waT", 0], ["Tee", -1], ["ri", -1], ["ghan", 1], ["naa", -1], ["wal", 2], ["fa", -1], ["raH", -1], ["fii", 3], ["ru", 4], ["3aa", -1], ["tih", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 0.72], [2.5, 0.5, -1, 0.45], [3, 1, 1, 1.0], [4, 1.5, -1, 1.0], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 3, 0.45], [9, 0.5, 4, 0.5], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والسيل يجري في شعيب الديارا", syl: [["was", 0], ["say", -1], ["li", -1], ["yij", 1], ["rii", -1], ["fii", 2], ["shi", 3], ["3ee", -1], ["bid", -1], ["di", 4], ["yaa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 0.45], [6.5, 0.5, 3, 0.45], [7, 1, -1, 0.72], [8, 1, -1, 0.45], [9, 0.5, 4, 0.45], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.0279, 0.1089], b0s1: [5.6479, 5.0615, 0.1385], b0a0: [10.8294, 5.0693, 0.1584], b0a1: [16.0186, 5.0515, 0.1561], b1s0: [21.1901, 5.0239, 0.1391], b1s1: [26.334, 5.0596, 0.1604], b1a0: [31.5136, 5.0883, 0.1643], b1a1: [36.7219, 5.0593, 0.1532] }
  },
  falcon: {
    topic: {en: "The falcon", ar: "الصقر"},
    mean: {en: "A noble peregrine that fears no hardship; every morning he hunts the houbara. He watches with his eye, then takes his prey; everyone takes pride in him across the deserts.", ar: "عن الشاهين الحر وصيده للحبارى، وفخر الناس فيه."},
    abyat: [
      { sadr: { text: "شاهين حرٍّ ما يهاب الشدايد", syl: [["shaa", 0], ["hii", -1], ["ni", -1], ["Hur", 1], ["rin", -1], ["maa", 2], ["yi", 3], ["haa", -1], ["bish", -1], ["sha", 4], ["daa", -1], ["yid", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 0.45], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.5], [4, 1.5, -1, 0.45], [5.5, 1, 2, 1.0], [6.5, 0.5, 3, 0.45], [7, 1, -1, 1.0], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "في كل صبحٍ دوم يصيد الحبارى", syl: [["fii", 0], ["kil", 1], ["li", -1], ["Sub", 2], ["Hin", -1], ["dom", 3], ["yi", 4], ["Sii", -1], ["dil", -1], ["Hu", 5], ["baa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, 1, 0.45], [2.5, 0.5, -1, 0.45], [3, 1, 2, 0.5], [4, 1.5, -1, 0.45], [5.5, 1, 3, 0.62], [6.5, 0.5, 4, 0.45], [7, 1, -1, 0.45], [8, 1, -1, 0.45], [9, 0.5, 5, 0.5], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "يرقب بعينه ثمّ يحوش الطرايد", syl: [["yir", 0], ["gib", -1], ["bi", 1], ["3ee", -1], ["nih", -1], ["thum", 2], ["yi", 3], ["Huu", -1], ["shiT", -1], ["Ta", 4], ["raa", -1], ["yid", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, -1, 0.45], [2.5, 0.5, 1, 0.45], [3, 1, -1, 0.72], [4, 1.5, -1, 0.45], [5.5, 1, 2, 0.5], [6.5, 0.5, 3, 0.45], [7, 1, -1, 0.5], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والكلّ يفخر فيه وسط الصحارى", syl: [["wal", 0], ["kil", -1], ["li", -1], ["yif", 1], ["khar", -1], ["fii", 2], ["hi", -1], ["waS", 3], ["TiS", -1], ["Sa", 4], ["Haa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 0.45], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 1.0], [5.5, 1, 2, 0.45], [6.5, 0.5, -1, 0.45], [7, 1, 3, 1.0], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.0504, 0.1348], b0s1: [5.6704, 5.0517, 0.1287], b0a0: [10.8421, 5.0267, 0.1019], b0a1: [15.9888, 5.0132, 0.1114], b1s0: [21.1219, 5.0547, 0.1543], b1s1: [26.2966, 5.0699, 0.1602], b1a0: [31.4865, 5.0738, 0.162], b1a1: [36.6804, 5.0593, 0.1532] }
  },
  night: {
    topic: {en: "A night of samar", ar: "ليلة سمر"},
    mean: {en: "O night of samar and poems; the tar beats its tune for those who stay up. Poetry brings back the old customs; their voices fill the whole land.", ar: "عن ليلة السمر والقصايد وضرب الطار، وأن الشعر يحيي العوايد القديمة."},
    abyat: [
      { sadr: { text: "يا ليلةٍ فيها السمر والقصايد", syl: [["yaa", 0], ["lee", 1], ["la", -1], ["tin", -1], ["fii", 2], ["has", -1], ["sa", 3], ["mar", -1], ["wal", 4], ["ga", -1], ["Saa", -1], ["yid", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 0.72], [2.5, 0.5, -1, 1.0], [3, 1, -1, 0.45], [4, 1.5, 2, 0.45], [5.5, 1, -1, 1.0], [6.5, 0.5, 3, 1.0], [7, 1, -1, 1.0], [8, 1, 4, 1.0], [9, 0.5, -1, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "والطار يضرب نغمته للسهارى", syl: [["waT", 0], ["Taa", -1], ["ri", -1], ["yiZ", 1], ["rib", -1], ["nagh", 2], ["ma", -1], ["tih", -1], ["lis", 3], ["su", -1], ["haa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 0.45], [8, 1, 3, 0.45], [9, 0.5, -1, 0.5], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "والشعر يحيي من قديم العوايد", syl: [["wash", 0], ["shi3", -1], ["ri", -1], ["yiH", 1], ["yii", -1], ["min", 2], ["ga", 3], ["dii", -1], ["mil", -1], ["3a", 4], ["waa", -1], ["yid", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 0.45], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 0.45], [6.5, 0.5, 3, 1.0], [7, 1, -1, 0.45], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "أصواتهم تملا جميع الديارا", syl: [["'aS", 0], ["waa", -1], ["ta", -1], ["hum", -1], ["tam", 1], ["laa", -1], ["ja", 2], ["mii", -1], ["3id", -1], ["di", 3], ["yaa", -1], ["raa", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 0.5], [4, 1.5, 1, 1.0], [5.5, 1, -1, 1.0], [6.5, 0.5, 2, 1.0], [7, 1, -1, 0.45], [8, 1, -1, 0.45], [9, 0.5, 3, 0.45], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.0789, 0.175], b0s1: [5.6989, 5.0499, 0.1355], b0a0: [10.8688, 5.0498, 0.1468], b0a1: [16.0385, 5.0467, 0.1167], b1s0: [21.2053, 5.078, 0.164], b1s1: [26.4033, 5.0882, 0.1579], b1a0: [31.6115, 5.0742, 0.1695], b1a1: [36.8058, 5.048, 0.1561] }
  },
  homeland: {
    topic: {en: "The homeland", ar: "الوطن"},
    mean: {en: "Our land, our pride, there is none like you; from her east to her west, all of it is beauty. Your sea, your desert, the mountain and your palms; may she stay dear forever, and God protect her.", ar: "عن الوطن وعزه وجماله من شرقه لغربه، بحره وبره وجباله ونخيله."},
    abyat: [
      { sadr: { text: "يا دارنا يا عزّنا ما مثيلك", syl: [["yaa", 0], ["daa", 1], ["ra", -1], ["naa", -1], ["yaa", 2], ["3iz", 3], ["za", -1], ["naa", -1], ["maa", 4], ["ma", 5], ["thii", -1], ["lik", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 1.0], [4, 1.5, 2, 1.0], [5.5, 1, 3, 0.45], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 4, 1.0], [9, 0.5, 5, 1.0], [9.5, 1.25, -1, 0.45], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "من شرقها والغرب كلّه بهاها", syl: [["min", 0], ["shar", 1], ["ga", -1], ["haa", -1], ["wal", 2], ["ghar", -1], ["bi", -1], ["kil", 3], ["lih", -1], ["ba", 4], ["haa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 1.0], [3, 1, -1, 1.0], [4, 1.5, 2, 1.0], [5.5, 1, -1, 1.0], [6.5, 0.5, -1, 0.45], [7, 1, 3, 0.45], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } },
      { sadr: { text: "بحرك وبرّك والجبل مع نخيلك", syl: [["baH", 0], ["rik", -1], ["wi", 1], ["bar", -1], ["rik", -1], ["wal", 2], ["ja", -1], ["bal", -1], ["ma3", 3], ["na", 4], ["khii", -1], ["lik", -1]], timing: [[0, 1.5, 0, 1.0], [1.5, 1, -1, 0.45], [2.5, 0.5, 1, 0.45], [3, 1, -1, 1.0], [4, 1.5, -1, 0.45], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 3, 1.0], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 0.45], [10.75, 1.25, -1, 0.45]] },
        ajz: { text: "تبقى عزيزه دوم وربّي حماها", syl: [["tib", 0], ["gaa", -1], ["3a", 1], ["zii", -1], ["zih", -1], ["dom", 2], ["wi", 3], ["rab", -1], ["bii", -1], ["Ha", 4], ["maa", -1], ["haa", -1]], timing: [[0, 1.5, 0, 0.45], [1.5, 1, -1, 1.0], [2.5, 0.5, 1, 1.0], [3, 1, -1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 0.62], [6.5, 0.5, 3, 0.45], [7, 1, -1, 1.0], [8, 1, -1, 0.45], [9, 0.5, 4, 1.0], [9.5, 1.25, -1, 1.0], [10.75, 1.25, -1, 1.0]] } }
    ],
    clips: { b0s0: [0.5, 5.0618, 0.1579], b0s1: [5.6818, 5.0163, 0.1087], b0a0: [10.818, 5.0693, 0.1584], b0a1: [16.0073, 5.0636, 0.1417], b1s0: [21.1909, 5.0502, 0.1452], b1s1: [26.3611, 5.0568, 0.1391], b1a0: [31.5379, 5.0752, 0.1629], b1a1: [36.7331, 5.0173, 0.1164] }
  }
};
export var TOPICS = ["palm", "coffee", "rain", "falcon", "night", "homeland"];

export function aiUrl() {
  var u = AI_URL;
  try {
    var q = (location.search.match(/[?&]ai=([^&]+)/) || [])[1];
    if (q) { q = decodeURIComponent(q); localStorage.setItem('cl_samri_ai', q === 'off' ? '' : q); }
    u = localStorage.getItem('cl_samri_ai') || u;
  } catch (e) {}
  if (window.CL_SAMRI_AI) u = window.CL_SAMRI_AI;
  return (u || '').replace(/\/+$/, '');
}

// where in a decoded file the click landed, compared to where it was put
export function clickOffset(buf, at) {
  var d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate * (at + 0.35))), k = -1;
  for (var i = 0; i < n; i++) if (Math.abs(d[i]) > 0.25) { k = i; break; }
  return k < 0 ? 0 : k / buf.sampleRate - at;
}
function decode(ctx, bytes) {
  return new Promise(function (res, rej) { var p = ctx.decodeAudioData(bytes, res, rej); if (p && p.then) p.then(res, rej); });
}
function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }

// a topic that ships with the app: its poem, and each phrase as { buf, at, len, lead }
var loaded = {};
export function loadTopic(key, ctx) {
  if (loaded[key]) return loaded[key];
  var t = BANK[key];
  loaded[key] = fetch('samri-ai/' + key + '.mp3').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(function (bytes) { return decode(ctx, bytes); })
    .then(function (buf) {
      var off = clickOffset(buf, CLICK), seg = {};
      Object.keys(t.clips).forEach(function (k) { var c = t.clips[k]; seg[k] = { buf: buf, at: c[0] + off, len: c[1], lead: c[2] }; });
      return { poem: t, seg: seg };
    });
  loaded[key].catch(function () { delete loaded[key]; });
  return loaded[key];
}

function post(path, body, ms) {
  var ctl = window.AbortController ? new AbortController() : null;
  var timer = ctl && setTimeout(function () { ctl.abort(); }, ms || 60000);
  return fetch(aiUrl() + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json().catch(function () { return { ok: false, error: r.status === 429 ? 'busy' : 'net' }; }); })
    .catch(function () { return { ok: false, error: 'net' }; })
    .finally(function () { if (timer) clearTimeout(timer); });
}
// the poem from a server, rebuilt from plain strings and numbers in the shape the app reads (null if it isn't one),
// so a broken or strange answer can't break the page; samri.js also escapes every word it shows
function cleanPoem(p) {
  function txt(o) { var en = String((o && o.en) || '').slice(0, 300), ar = String((o && o.ar) || '').slice(0, 300); return { en: en || ar, ar: ar || en }; }
  function half(h) {
    if (!h || typeof h.text !== 'string' || !Array.isArray(h.syl) || h.syl.length !== 12 || !Array.isArray(h.timing) || h.timing.length !== 12) throw new Error('half');
    return {
      text: h.text.slice(0, 200),
      words: (Array.isArray(h.words) ? h.words : h.text.split(' ')).slice(0, 12).map(function (w) { return String(w).slice(0, 40); }),
      syl: h.syl.map(function (s) { return { t: String((s && s.t) || '').slice(0, 10), w: s && typeof s.w === 'number' ? s.w | 0 : -1 }; }),
      timing: h.timing.map(function (s) { s = Array.isArray(s) ? s : []; return [+s[0] || 0, +s[1] || 0, typeof s[2] === 'number' ? s[2] | 0 : -1, +s[3] || 0]; })
    };
  }
  try {
    if (!p || !Array.isArray(p.abyat) || !p.abyat.length || p.abyat.length > 4) return null;
    return { topic: txt(p.topic), mean: txt(p.mean), by: 'ai', abyat: p.abyat.map(function (b) { return { sadr: half(b && b.sadr), ajz: half(b && b.ajz) }; }) };
  } catch (e) { return null; }
}
// any topic, through the server: Claude writes it
export function composeLive(topic) {
  return post('/compose', { topic: topic }, 90000).then(function (r) {
    if (!r || !r.ok) return r;
    var poem = cleanPoem(r.poem);
    return poem ? { ok: true, poem: poem } : { ok: false, error: 'net' };
  });
}
// one row singing one half, through the server
export function singLive(half, part, row, ctx) {
  return post('/sing', { half: { text: half.text, syl: half.syl }, part: part, row: row }, 90000).then(function (r) {
    if (!r || !r.ok || typeof r.mp3 !== 'string') throw new Error((r && r.error) || 'net');
    return decode(ctx, b64(r.mp3)).then(function (buf) {
      var off = Math.max(0, clickOffset(buf, +r.click || 0.03));
      return { buf: buf, at: off, len: buf.duration - off, lead: +r.lead || 0 };
    });
  });
}
