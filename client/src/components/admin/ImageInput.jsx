import { useRef, useState } from 'react';
import { adminApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { Spinner } from '../ui.jsx';
import { IconUpload } from '../Icons.jsx';

/** Upload an image file or paste an image URL. */
export default function ImageInput({ value, onChange, label = 'Image' }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.uploadImage(file);
      onChange(r.url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="field image-input">
      <span className="label">{label}</span>
      <div className="image-input-row">
        <div className="image-preview">{value ? <img src={value} alt="Current" /> : <span className="small muted">No image</span>}</div>
        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          <input
            className="input"
            aria-label={`${label} URL`}
            placeholder="https://… or upload a file"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="row">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Spinner label="Uploading" /> : <IconUpload size={16} />} Upload image
            </button>
            <span className="small muted">JPG, PNG or WebP · max 5 MB</span>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => upload(e.target.files?.[0])} />
          {error && <span className="field-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
