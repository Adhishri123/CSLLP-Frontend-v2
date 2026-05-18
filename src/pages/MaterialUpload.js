import React, { useState } from 'react';
import { uploadMaterial } from '../services/api';

export default function MaterialUpload({ user }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('DOCUMENT');
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();

    if (!file) {
      setMsg('❌ Please select a file');
      return;
    }

    try {
      // ✅ Use FormData instead of JSON
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", desc);
      formData.append("tags", tags);
      formData.append("uploadedBy", user.id);
      formData.append("type", type);
      // Optional: Add courseId if needed
      // formData.append("courseId", courseId);

      const res = await uploadMaterial(formData); // ✅ Send FormData

      if (!res.ok) {
        setMsg("❌ Upload failed: " + (res.body?.message || res.status));
      } else {
        setMsg("✅ Uploaded: " + res.body.data.title);
      }
    } catch (err) {
      console.error("Upload error", err);
      setMsg("❌ Upload failed: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h3>Upload Material</h3>
      <form onSubmit={submit}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />

        {/* 🔥 Select material type */}
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="DOCUMENT">Document</option>
          <option value="VIDEO">Video</option>
          <option value="PDF">PDF</option>
        </select>

        <button type="submit">Upload</button>
      </form>

      {msg && <div>{msg}</div>}
    </div>
  );
}
