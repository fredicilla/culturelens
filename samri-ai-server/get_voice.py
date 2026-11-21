"""Downloads the Arabic voice the singer uses into models/ (about 60 MB, once).

    python get_voice.py

The voice is Piper "ar_JO-kareem-medium", from the sherpa-onnx releases on GitHub. This also saves a copy
of it that reports how long each sound lasts (the .dur.onnx file), which the singer needs to put every
syllable on its beat.
"""
import os, sys, shutil, tarfile, tempfile, urllib.request

URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2'
NAME = 'ar_JO-kareem-medium'
HERE = os.path.dirname(os.path.abspath(__file__))


def main(out):
    os.makedirs(out, exist_ok=True)
    model = os.path.join(out, NAME + '.onnx')
    want = {NAME + '.onnx', NAME + '.onnx.json'}
    if not all(os.path.exists(os.path.join(out, w)) for w in want):
        tmp = tempfile.mkdtemp()
        try:
            arc = os.path.join(tmp, 'voice.tar.bz2')
            print('downloading the voice (about 60 MB)...')
            urllib.request.urlretrieve(URL, arc)
            with tarfile.open(arc, 'r:bz2') as t:
                for m in t.getmembers():
                    base = os.path.basename(m.name)
                    if m.isfile() and base in want:           # only the two files we need, by name
                        with t.extractfile(m) as f, open(os.path.join(out, base), 'wb') as o:
                            shutil.copyfileobj(f, o)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        missing = [w for w in want if not os.path.exists(os.path.join(out, w))]
        if missing:
            sys.exit('the download did not have ' + ', '.join(missing))
    dur = os.path.join(out, NAME + '.dur.onnx')
    if not os.path.exists(dur):
        import onnx
        m = onnx.load(model)
        m.graph.output.append(onnx.helper.make_tensor_value_info('/Ceil_output_0', onnx.TensorProto.FLOAT, None))
        onnx.save(m, dur)
    print('the voice is ready in', out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'models'))
