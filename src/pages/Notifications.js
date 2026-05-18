import React, { useState } from 'react';
import { sendEmail } from '../services/api';

export default function Notifications(){
  const [to,setTo]=useState('');
  const [sub,setSub]=useState('');
  const [msg,setMsg]=useState('');
  const [resp,setResp]=useState(null);

  async function submit(e){
    e.preventDefault();
    const r = await sendEmail({ to, subject: sub, message: msg });
    if (!r.ok) setResp({type:'error', text: r.body?.message || 'Failed'});
    else setResp({type:'success', text:'Email sent to ' + to});
  }

  return (
    <div style={{maxWidth:700}}>
      <h3>Send Email</h3>
      <form onSubmit={submit}>
        <input placeholder="to" value={to} onChange={e=>setTo(e.target.value)} />
        <input placeholder="subject" value={sub} onChange={e=>setSub(e.target.value)} />
        <textarea placeholder="message" value={msg} onChange={e=>setMsg(e.target.value)} />
        <button type="submit">Send</button>
      </form>
      {resp && <div style={{color: resp.type==='error'?'#c53030':'#22543d'}}>{resp.text}</div>}
    </div>
  );
}
