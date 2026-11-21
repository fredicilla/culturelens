"""Claude writes a Samri on a topic, in the shape samri_verse checks; bad tries are sent back with the problems.

compose(topic) -> {'ok': True, 'poem': {...}, 'tries': n} or {'ok': False, 'error': 'topic' | 'meter' | 'model', 'reason': ...}
"""
import os, json, time
from samri_verse import check_poem, timing

MODEL = os.environ.get('SAMRI_MODEL', 'claude-sonnet-5-5')
TRIES = int(os.environ.get('SAMRI_TRIES', '4'))
HERE = os.path.dirname(os.path.abspath(__file__))
BANK = json.load(open(os.path.join(HERE, 'poems.json'), encoding='utf-8'))

HALF = {'type': 'object', 'properties': {
    'text': {'type': 'string', 'description': 'the half in Arabic script, words separated by single spaces'},
    'syl': {'type': 'array', 'minItems': 12, 'maxItems': 12, 'items': {'type': 'object', 'properties': {
        't': {'type': 'string', 'description': 'one sung syllable in the Latin spelling'},
        'w': {'type': 'integer', 'description': 'the number of the word this syllable starts (0, 1, 2...), or -1'}},
        'required': ['t', 'w']}}},
    'required': ['text', 'syl']}
TOOL = {
    'name': 'samri_poem',
    'description': 'Give the Samri poem (or refuse an unsuitable topic).',
    'input_schema': {'type': 'object', 'properties': {
        'refuse': {'type': 'boolean', 'description': 'true only if the topic is not suitable (see the rules)'},
        'reason': {'type': 'string', 'description': 'when refusing: a short reason in English'},
        'topic_ar': {'type': 'string', 'description': 'the topic in Arabic, two or three words'},
        'topic_en': {'type': 'string', 'description': 'the topic in English, two or three words'},
        'meaning_en': {'type': 'string', 'description': 'what the two abyat say, in plain English (one or two sentences)'},
        'meaning_ar': {'type': 'string', 'description': 'the same in simple Arabic (one sentence)'},
        'abyat': {'type': 'array', 'minItems': 2, 'maxItems': 2, 'items': {'type': 'object', 'properties': {'sadr': HALF, 'ajz': HALF}, 'required': ['sadr', 'ajz']}}},
        'required': ['refuse']},
}

def example():
    p = BANK['palm']
    ab = [{part: {'text': b[part]['text'], 'syl': b[part]['syl']} for part in ('sadr', 'ajz')} for b in p['abyat']]
    return json.dumps({'refuse': False, 'topic_ar': 'النخلة', 'topic_en': 'The palm tree', 'meaning_en': p['mean']['en'], 'meaning_ar': p['mean']['ar'], 'abyat': ab}, ensure_ascii=False)

SYSTEM = """You are a poet of Najdi Nabati poetry who writes Samri verses for CultureLens, an app that teaches young people in Saudi Arabia and around the world about Saudi culture. The two rows of a Samri troupe will sing what you write, so it must fit their rhythm exactly.

Write TWO abyat (verses) in the Najdi dialect on the topic the user gives. Each bayt has two halves: the sadr and the ajz.

THE METER. Every half is exactly 12 sung syllables in this pattern of long (L) and short (S) syllables:
    L L S L   L L S L   L S L L
This is the pattern of the classic verse the app teaches:
    يا جر قلبي جر لدن الغصوني  =  yaa jar ri gal | bii jar ri lad | nil ghu suu nii
    وغصون سدر جرها السيل جرا   =  wigh suu ni sid | rin jar ra has | sey li jar raa
A syllable is SHORT when it ends in a short vowel (ri, la, ghu). It is LONG when its vowel is long (yaa, bii, suu) or a consonant closes it (jar, gal, nil). Write the syllables as they are SUNG, across word boundaries, the way a Najdi singer joins words: the l of al- joins the syllable before it (fil, wal, nil); a doubled consonant is split between two syllables (jar ri); a word ending in a long vowel plus a consonant before another consonant is sung with a short linking vowel (ziin before a consonant is sung zii ni); a linking vowel may be added between words to fit the meter (jar ri gal). The last syllable of each half is long.

THE RHYME. Both sadr halves end on the same rhyme, and both ajz halves end on another rhyme: the last syllable must be the same, and so must the vowel of the syllable before it (for example -Tuu lik and -muu lik; -naa haa and -gaa haa).

THE SPELLING of the syllables (one string per syllable, nothing else in it):
    consonants: b t th j H kh d dh r z s sh S D T Z 3 gh f q g k ch l m n h w y '
      S is ص, T is ط, Z is ظ and also ض (Najdi says ض like ظ), H is ح, 3 is ع, ' is the hamza, gh is غ, kh is خ, dh is ذ, th is ث.
      ق is said g in Najdi: write g. ج is j.
    vowels: a i u e o (short) and aa ii uu ee oo (long). Exactly one vowel in each syllable.

THE WORD MARKS. The words are the space-separated words of "text". Give every syllable w = the number of the word it starts (0 for the first word, 1 for the second, and so on, each number once, in order), or w = -1 if it does not start a word. The first syllable starts word 0. When the sung syllable joins two words (fil = في + ال), mark it as the start of the first of them, and give the next word's mark to its first syllable that is mostly its own.

THE STYLE. Use real Najdi Nabati words and images (the desert, rain and al-Wasm, palms, coffee, horses and falcons, generosity, the homeland, the night of samar). Keep it warm, proud and fit for children: praise and description, no love poetry, nothing about real people, brands, politics or anything sectarian, no insults. Never copy a famous poem: write your own lines.

REFUSE (refuse = true, with a short reason) if the topic is offensive, sexual, violent, political, sectarian, insulting to anyone, about a real person, or about a brand or a product. Otherwise write the poem.

Check every half before answering: count 12 syllables, mark each L or S, and compare with L L S L  L L S L  L S L L. Check the rhymes. Then call samri_poem.

Here is a correct answer for the topic "النخلة":
""" + example()


def mock(topic):
    """No API key: give a poem from the bank (to try the server end to end)."""
    t = (topic or '').strip()
    key = next((k for k, p in BANK.items() if p['topic']['ar'] in t or t in p['topic']['ar'] or p['topic']['en'].lower() in t.lower()), None)
    if key is None: key = sorted(BANK)[sum(map(ord, t)) % len(BANK)]
    p = BANK[key]
    return {'refuse': False, 'topic_ar': p['topic']['ar'], 'topic_en': p['topic']['en'], 'meaning_en': p['mean']['en'], 'meaning_ar': p['mean']['ar'],
            'abyat': [{part: {'text': b[part]['text'], 'syl': b[part]['syl']} for part in ('sadr', 'ajz')} for b in p['abyat']]}


def tidy(out):
    """the model's answer in plain types (a word mark sent as "2" becomes 2), or a list of shape problems"""
    ab = out.get('abyat')
    if not isinstance(ab, list) or not ab:
        return None, ['there are no abyat']
    clean = []
    for i, b in enumerate(ab):
        if not isinstance(b, dict):
            return None, ['bayt %d is not an object with a sadr and an ajz' % (i + 1)]
        bb = {}
        for part in ('sadr', 'ajz'):
            h = b.get(part)
            if not isinstance(h, dict) or not isinstance(h.get('text'), str) or not isinstance(h.get('syl'), list):
                return None, ['bayt %d %s needs "text" and a "syl" list' % (i + 1, part)]
            syl = []
            for s in h['syl']:
                s = s if isinstance(s, dict) else {'t': s}
                try: w = int(s.get('w', -1))
                except (TypeError, ValueError): w = -1
                syl.append({'t': str(s.get('t', '')).strip(), 'w': w})
            bb[part] = {'text': h['text'], 'syl': syl}
        clean.append(bb)
    return dict(out, abyat=clean), []


def finish(out, tries, topic):
    ab = []
    for b in out['abyat']:
        bb = {}
        for part in ('sadr', 'ajz'):
            h = b[part]
            bb[part] = {'text': ' '.join(h['text'].split()), 'words': h['text'].split(), 'syl': [{'t': s['t'].strip(), 'w': int(s['w'])} for s in h['syl']], 'timing': timing(h)}
        ab.append(bb)
    poem = {'topic': {'ar': out.get('topic_ar') or topic, 'en': out.get('topic_en') or ''}, 'mean': {'en': out.get('meaning_en', ''), 'ar': out.get('meaning_ar', '')},
            'abyat': ab, 'by': 'ai'}
    return {'ok': True, 'poem': poem, 'tries': tries}


def compose(topic, client=None):
    topic = ' '.join((topic or '').split())[:60]
    if not topic:
        return {'ok': False, 'error': 'topic', 'reason': 'no topic'}
    if client is None and (os.environ.get('SAMRI_MOCK') or not os.environ.get('ANTHROPIC_API_KEY')):
        out = mock(topic)
        errs = check_poem(out)
        return finish(out, 1, topic) if not errs else {'ok': False, 'error': 'meter', 'reason': errs}
    if client is None:
        import anthropic
        client = anthropic.Anthropic()
    msgs = [{'role': 'user', 'content': 'The topic: ' + topic}]
    last = None
    for n in range(1, TRIES + 1):
        try:
            r = client.messages.create(model=MODEL, max_tokens=4000, system=SYSTEM, tools=[TOOL],
                                       tool_choice={'type': 'tool', 'name': 'samri_poem'}, messages=msgs)
        except Exception as e:
            return {'ok': False, 'error': 'model', 'reason': str(e)[:300]}
        use = next((c for c in r.content if getattr(c, 'type', '') == 'tool_use'), None)
        if use is None:
            return {'ok': False, 'error': 'model', 'reason': 'no answer'}
        out = use.input if isinstance(use.input, dict) else json.loads(use.input)
        if out.get('refuse'):
            return {'ok': False, 'error': 'topic', 'reason': out.get('reason', 'this topic is not suitable')}
        out, errs = tidy(out)
        if not errs:
            try: errs = check_poem(out)
            except Exception as e: errs = ['the poem could not be checked: %s' % e]
        if not errs:
            return finish(out, n, topic)
        last = errs
        # send the problems back and ask again
        msgs.append({'role': 'assistant', 'content': r.content})
        msgs.append({'role': 'user', 'content': [{'type': 'tool_result', 'tool_use_id': use.id, 'is_error': True,
                                                  'content': 'The poem does not fit yet. Fix these problems and call samri_poem again with the whole poem:\n- ' + '\n- '.join(errs[:12])}]})
    return {'ok': False, 'error': 'meter', 'reason': last}
