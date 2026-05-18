import React, { useEffect, useState } from 'react';
import { register, fetchManagers } from '../api';

export default function Register({ creator }){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roles, setRoles] = useState(['EMPLOYEE']);
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(()=>{ fetchManagers().then(r=> r.body && r.body.success && setManagers(r.body.data || [])); }, []);

  function submit(e){
    e.preventDefault();
    const body = { username, password, firstName, lastName, roles, managerId: managerId || null };
    register(body, creator ? creator.id : null, creator ? creator.role : 'ADMIN')
      .then(res => res.body && setMsg(res.body.success ? 'Created: ' + res.body.data.username : 'Error: ' + res.body.message))
      .catch(err => setMsg(String(err)));
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div className="col">
          <label>Email</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="col">
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
      </div>
      <label>First Name</label>
      <input value={firstName} onChange={e=>setFirstName(e.target.value)} />
      <label>Last Name</label>
      <input value={lastName} onChange={e=>setLastName(e.target.value)} />
      <label>Role</label>
      <select value={roles[0]} onChange={e=>setRoles([e.target.value])}>
        <option>EMPLOYEE</option>
        <option>MANAGER</option>
        <option>HR</option>
        <option>ADMIN</option>
      </select>
      <label>Manager (optional)</label>
      <select value={managerId} onChange={e=>setManagerId(e.target.value)}>
        <option value="">-- select manager --</option>
        {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} ({m.username})</option>)}
      </select>
      <button type="submit">Register</button>
      {msg && <div><small>{msg}</small></div>}
    </form>
  );
}
