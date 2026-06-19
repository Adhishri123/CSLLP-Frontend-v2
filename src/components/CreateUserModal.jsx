// src/components/CreateUserModal.jsx
import React, { useEffect, useState } from 'react';
import { getUsersByRole, authRegister } from '../services/api';

export default function CreateUserModal({ creator, onClose, onCreated }) {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    role: 'EMPLOYEE', managerId: '', phoneNumber: '',
    address: '', dateOfJoining: '', designation: '', department: '',
    annualSalary: '', panNumber: '', pfNumber: '', uanNumber: '',
    bankName: '', bankBranch: '', bankAccountNumber: '', vendorCode: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await getUsersByRole('MANAGER');
      if (res.data) setManagers(res.data);
    })();
  }, []);

  useEffect(() => {
    if (creator?.role === 'MANAGER') {
      setForm(f => ({ ...f, role: 'EMPLOYEE', managerId: String(creator.id) }));
    }
  }, [creator]);

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.fullName) return setError('Full name is required');
    if (!form.email) return setError('Email is required');
    if (!form.password) form.password = Math.random().toString(36).slice(-8);

    const payload = {
      email: form.email, password: form.password, fullName: form.fullName,
      role: form.role,
      managerId: form.role === 'EMPLOYEE'
        ? (creator?.role === 'MANAGER' ? creator.id : form.managerId ? Number(form.managerId) : null)
        : null,
      phoneNumber: form.phoneNumber, address: form.address,
      dateOfJoining: form.dateOfJoining, designation: form.designation,
      department: form.department, annualSalary: form.annualSalary,
      panNumber: form.panNumber, pfNumber: form.pfNumber,
      uanNumber: form.uanNumber, bankName: form.bankName,
      bankBranch: form.bankBranch, bankAccountNumber: form.bankAccountNumber,
      vendorCode: form.vendorCode,
    };

    setBusy(true);
    try {
      const res = await authRegister(payload, creator?.id, creator?.role);
      if (!res.success) {
        setError(res.body?.message || 'Failed to create user');
      } else {
        onCreated && onCreated();
        onClose && onClose();
      }
    } catch (ex) {
      setError(String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* keyframe injection */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .create-modal-box {
          animation: modalIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div style={styles.backdrop}>
        <div style={styles.modal} className="create-modal-box">

          {/* HEADER */}
          <div style={styles.header}>
            <h2 style={styles.title}>Create New User</h2>
          </div>

          <form onSubmit={submit} style={{ marginTop: 20 }}>

            {/* ── 2-column grid ── */}
            <div style={styles.grid}>

              {/* Full Name */}
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} type="text" value={form.fullName}
                  onChange={e => update('fullName', e.target.value)} placeholder="John Doe" />
              </div>

              {/* Email */}
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="example@domain.com" />
              </div>

              {/* Role */}
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                {creator?.role === 'MANAGER' ? (
                  <input style={styles.input} disabled value="Employee" />
                ) : (
                  <select style={styles.input} value={form.role}
                    onChange={e => update('role', e.target.value)}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
              </div>

              {/* Reporting Manager (conditional) */}
              {form.role === 'EMPLOYEE' && creator?.role !== 'MANAGER' ? (
                <div style={styles.field}>
                  <label style={styles.label}>Reporting Manager</label>
                  <select style={styles.input} value={form.managerId}
                    onChange={e => update('managerId', e.target.value)}>
                    <option value="">Select Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={styles.field} /> /* keeps grid even */
              )}

              {/* Password */}
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" value={form.password}
                  onChange={e => update('password', e.target.value)} placeholder="Enter password" />
              </div>

              {/* Mobile Number */}
              <div style={styles.field}>
                <label style={styles.label}>Mobile Number</label>
                <input style={styles.input} type="number" value={form.phoneNumber}
                  onChange={e => update('phoneNumber', e.target.value)} placeholder="9876543210" />
              </div>

              {/* Address — full width */}
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Address</label>
                <input style={styles.input} type="text" value={form.address}
                  onChange={e => update('address', e.target.value)}
                  placeholder="Street Name, City, State, Country." />
              </div>

              {/* Designation */}
              <div style={styles.field}>
                <label style={styles.label}>Designation</label>
                <input style={styles.input} type="text" value={form.designation}
                  onChange={e => update('designation', e.target.value)} placeholder="Software Developer" />
              </div>

              {/* Department */}
              <div style={styles.field}>
                <label style={styles.label}>Department</label>
                <input style={styles.input} type="text" value={form.department}
                  onChange={e => update('department', e.target.value)} placeholder="IT" />
              </div>

              {/* Joining Date */}
              <div style={styles.field}>
                <label style={styles.label}>Joining Date</label>
                <input style={styles.input} type="date" value={form.dateOfJoining}
                  onChange={e => update('dateOfJoining', e.target.value)} />
              </div>

              {/* Annual Package */}
              <div style={styles.field}>
                <label style={styles.label}>Annual Package</label>
                <input style={styles.input} type="number" value={form.annualSalary}
                  onChange={e => update('annualSalary', e.target.value)} placeholder="200000.0" />
              </div>

              {/* PAN Number */}
              <div style={styles.field}>
                <label style={styles.label}>PAN Number</label>
                <input style={styles.input} type="text" value={form.panNumber}
                  onChange={e => update('panNumber', e.target.value)} placeholder="ABCDE12340" />
              </div>

              {/* PF Number */}
              <div style={styles.field}>
                <label style={styles.label}>PF Number</label>
                <input style={styles.input} type="text" value={form.pfNumber}
                  onChange={e => update('pfNumber', e.target.value)} placeholder="PF123456780" />
              </div>

              {/* UAN Number */}
              <div style={styles.field}>
                <label style={styles.label}>UAN Number</label>
                <input style={styles.input} type="number" value={form.uanNumber}
                  onChange={e => update('uanNumber', e.target.value)} placeholder="100123456780" />
              </div>

              {/* Bank Name */}
              <div style={styles.field}>
                <label style={styles.label}>Bank Name</label>
                <input style={styles.input} type="text" value={form.bankName}
                  onChange={e => update('bankName', e.target.value)} placeholder="SBI" />
              </div>

              {/* Bank Branch Name */}
              <div style={styles.field}>
                <label style={styles.label}>Bank Branch Name</label>
                <input style={styles.input} type="text" value={form.bankBranch}
                  onChange={e => update('bankBranch', e.target.value)} placeholder="Pune Main Branch" />
              </div>

              {/* Bank Account Number */}
              <div style={styles.field}>
                <label style={styles.label}>Bank Account Number</label>
                <input style={styles.input} type="number" value={form.bankAccountNumber}
                  onChange={e => update('bankAccountNumber', e.target.value)} placeholder="123456789010" />
              </div>

              {/* Vendor Code */}
              <div style={styles.field}>
                <label style={styles.label}>Vendor Code</label>
                <input style={styles.input} type="text" value={form.vendorCode}
                  onChange={e => update('vendorCode', e.target.value)} placeholder="VEND000" />
              </div>

            </div>
            {/* ── end grid ── */}

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.footer}>
              <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancel</button>
              <button type="submit" disabled={busy} style={styles.btnPrimary}>
                {busy ? 'Creating...' : 'Create'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0,
    backdropFilter: 'blur(5px)',
    background: 'rgba(0,0,0,0.25)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 150,
  },
  modal: {
    width: 760,                          /* wider to fit 2 columns */
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: 16,
    padding: 25,
    boxShadow: '0 10px 35px rgba(0,0,0,0.12)',
  },
  header: {
    background: 'linear-gradient(90deg, #e6f5ec, #ffffff)',
    border: '1px solid #d4e9dd',
    padding: '15px 20px', borderRadius: 12,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#333', textAlign: 'center' },
  /* ── 2-column grid ── */
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 20px',                       /* row-gap 0 (labels provide spacing), col-gap 20 */
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 14,
  },
  label: { fontSize: 14, fontWeight: 600, color: '#444' },
  input: {
    width: '100%', padding: '11px 14px',
    borderRadius: 10, border: '1px solid #d8dee5',
    background: '#f9fafb', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  },
  error: { marginTop: 12, color: '#b00020', fontWeight: 600 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 25 },
  btnPrimary: {
    background: '#4aa3f0', color: '#fff',
    padding: '12px 24px', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600,
  },
  btnSecondary: {
    background: '#e9eef5', color: '#333',
    padding: '12px 24px', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontSize: 15,
  },
};

// // src/components/CreateUserModal.jsx
// import React, { useEffect, useState } from 'react';
// import { getUsersByRole, authRegister } from '../services/api';

// export default function CreateUserModal({ creator, onClose, onCreated }) {
//   const [managers, setManagers] = useState([]);
//   const [form, setForm] = useState({
//     fullName: '',
//     email: '',
//     password: '',
//     role: creator?.role === 'MANAGER' ? 'EMPLOYEE' : 'EMPLOYEE',
//     managerId: '',
//     phoneNumber: '',
//     address: '',
//     dateOfJoining: '',
//     designation: '',
//     department: '',
//     annualSalary: '',
//     panNumber: '',
//     pfNumber: '',
//     uanNumber: '',
//     bankName: '',
//     bankBranch: '',
//     bankAccountNumber: '',
//     vendorCode: '',
//   });
//   const [busy, setBusy] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     (async () => {
//       const res = await getUsersByRole('MANAGER');
//       if (res.data) setManagers(res.data);
//     })();
//   }, []);

//   useEffect(() => {
//     if (creator?.role === 'MANAGER') {
//       setForm(f => ({
//         ...f,
//         role: 'EMPLOYEE',
//         managerId: String(creator.id)
//       }));
//     }
//   }, [creator]);

//   const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

//   // const splitName = (full) => {
//   //   const parts = (full || '').trim().split(/\s+/);
//   //   const first = parts.shift() || '';
//   //   const last = parts.join(' ') || '';
//   //   return { first, last };
//   // };

//   async function submit(e) {
//     e.preventDefault();
//     setError(null);

//     // const { first, last } = splitName(form.fullName);
//     if (!form.fullName) return setError('Full name is required');
//     if (!form.email) return setError('Email is required');
//     if (!form.password) form.password = Math.random().toString(36).slice(-8);

//     const payload = {
//       email: form.email,
//       password: form.password,
//       // firstName: first,
//       // lastName: last,
//       fullName: form.fullName,
//       role: form.role,
//       managerId:
//         form.role === 'EMPLOYEE'
//           ? (creator?.role === 'MANAGER'
//               ? creator.id
//               : form.managerId
//               ? Number(form.managerId)
//               : null)
//           : null,
//       phoneNumber:form.phoneNumber,
//       address:form.address,
//       dateOfJoining:form.dateOfJoining,
//       designation:form.designation,
//       department:form.department,
//       annualSalary:form.annualSalary,
//       panNumber:form.panNumber,
//       pfNumber:form.pfNumber,
//       uanNumber:form.uanNumber,
//       bankName:form.bankName,
//       bankBranch:form.bankBranch,
//       bankAccountNumber:form.bankAccountNumber,
//       vendorCode:form.vendorCode,
//     };

//     setBusy(true);
//     try {
//       const res = await authRegister(payload, creator?.id, creator?.role);
//       console.log("New user:", res);
//       if (!res.success) {
//         const msg = res.body?.message || 'Failed to create user';
//         setError(msg);
//       } else {
//         onCreated && onCreated();
//         onClose && onClose();
//       }
//     } catch (ex) {
//       setError(String(ex));
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div style={styles.backdrop}>
//       <div style={styles.modal}>

//         {/* HEADER */}
//         <div style={styles.header}>
//           <h2 style={styles.title}>Create New User</h2>
//         </div>

//         <form onSubmit={submit} style={{ marginTop: 20 }}>

//           <label style={styles.label}>Full Name</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.fullName}
//             onChange={e => update('fullName', e.target.value)}
//             placeholder="John Doe"
//           />

//           <label style={styles.label}>Email</label>
//           <input
//             style={styles.input}
//             type="email"
//             value={form.email}
//             onChange={e => update('email', e.target.value)}
//             placeholder="example@domain.com"
//           />

//           <label style={styles.label}>Role</label>
//           {creator?.role === 'MANAGER' ? (
//             <input style={styles.input} disabled value="Employee" />
//           ) : (
//             <select
//               style={styles.input}
//               value={form.role}
//               onChange={e => update('role', e.target.value)}
//             >
//               <option value="EMPLOYEE">Employee</option>
//               <option value="MANAGER">Manager</option>
//               <option value="HR">HR</option>
//               <option value="ADMIN">Admin</option>
//             </select>
//           )}

//           {form.role === 'EMPLOYEE' && creator?.role !== 'MANAGER' && (
//             <>
//               <label style={styles.label}>Reporting Manager</label>
//               <select
//                 style={styles.input}
//                 value={form.managerId}
//                 onChange={e => update('managerId', e.target.value)}
//               >
//                 <option value="">Select Manager</option>
//                 {managers.map(m => (
//                   <option key={m.id} value={m.id}>
//                     {/* {m.firstName} {m.lastName} ({m.email}) */}
//                     {m.fullName} ({m.email})
//                   </option>
//                 ))}
//               </select>
//             </>
//           )}

//           <label style={styles.label}>Password</label>
//           <input
//             style={styles.input}
//             type="password"
//             value={form.password}
//             onChange={e => update('password', e.target.value)}
//             placeholder="Enter password "
//           />

//           <label style={styles.label}>Mobile Number</label>
//           <input
//             type="number"
//             style={styles.input}
//             value={form.phoneNumber}
//             onChange={e => update('phoneNumber', e.target.value)}
//             placeholder="9876543210"
//           />

//           <label style={styles.label}>Address</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.address}
//             onChange={e => update('address', e.target.value)}
//             placeholder="Street Name, City, State, Country."
//           />

//           <label style={styles.label}>Designation</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.designation}
//             onChange={e => update('designation', e.target.value)}
//             placeholder="Software Developer"
//           />

//           <label style={styles.label}>Department</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.department}
//             onChange={e => update('department', e.target.value)}
//             placeholder="IT"
//           />

//           <label style={styles.label}>Joining Date</label>
//           <input
//             type="date"
//             style={styles.input}
//             value={form.dateOfJoining}
//             onChange={e => update('dateOfJoining', e.target.value)}
//           />

//           <label style={styles.label}>Annual Package</label>
//           <input
//             type="number"
//             style={styles.input}
//             value={form.annualSalary}
//             onChange={e => update('annualSalary', e.target.value)}
//             placeholder="200000.0"
//           />

//           <label style={styles.label}>PAN Number</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.panNumber}
//             onChange={e => update('panNumber', e.target.value)}
//             placeholder="ABCDE12340"
//           />

//           <label style={styles.label}>PF Number</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.pfNumber}
//             onChange={e => update('pfNumber', e.target.value)}
//             placeholder="PF123456780"
//           />

//           <label style={styles.label}>UAN Number</label>
//           <input
//             type="number"
//             style={styles.input}
//             value={form.uanNumber}
//             onChange={e => update('uanNumber', e.target.value)}
//             placeholder="100123456780"
//           />

//           <label style={styles.label}>Bank Name</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.bankName}
//             onChange={e => update('bankName', e.target.value)}
//             placeholder="SBI"
//           />

//           <label style={styles.label}>Bank Branch Name</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.bankBranch}
//             onChange={e => update('bankBranch', e.target.value)}
//             placeholder="Pune Main Branch"
//           />

//           <label style={styles.label}>Bank Account Number</label>
//           <input
//             type="number"
//             style={styles.input}
//             value={form.bankAccountNumber}
//             onChange={e => update('bankAccountNumber', e.target.value)}
//             placeholder="123456789010"
//           />

//           <label style={styles.label}>Vendor Code</label>
//           <input
//             type="text"
//             style={styles.input}
//             value={form.vendorCode}
//             onChange={e => update('vendorCode', e.target.value)}
//             placeholder="VEND000"
//           />

//           {error && <div style={styles.error}>{error}</div>}

//           <div style={styles.footer}>
//             <button type="button" onClick={onClose} style={styles.btnSecondary}>
//               Cancel
//             </button>
//             <button type="submit" disabled={busy} style={styles.btnPrimary}>
//               {busy ? 'Creating...' : 'Create'}
//             </button>
//           </div>

//         </form>
//       </div>
//     </div>
//   );
// }

// /* -------- LIGHT THEME STYLES -------- */
// const styles = {
//   backdrop: {
//     position: 'fixed',
//     inset: 0,
//     backdropFilter: 'blur(5px)',
//     background: 'rgba(0,0,0,0.25)',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 150,
//   },

//   modal: {
//     width: 580,
//     background: '#ffffff',
//     borderRadius: 16,
//     padding: 25,
//     boxShadow: '0 10px 35px rgba(0,0,0,0.12)',
//   },

//   /* ✅ New light mint color ONLY for header */
//   header: {
//     background: 'linear-gradient(90deg, #e6f5ec, #ffffff)',
//     border: '1px solid #d4e9dd',
//     padding: '15px 20px',
//     borderRadius: 12,
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   title: {
//     margin: 0,
//     fontSize: 22,
//     fontWeight: 700,
//     color: '#333',
//     textAlign: 'center'
//   },

//   label: {
//     marginTop: 15,
//     fontSize: 15,
//     fontWeight: 600,
//     color: '#444'
//   },

//   input: {
//     width: '100%',
//     padding: '12px 14px',
//     borderRadius: 10,
//     border: '1px solid #d8dee5',
//     background: '#f9fafb',
//     fontSize: 15,
//     outline: 'none',
//     transition: '0.2s'
//   },

//   error: {
//     marginTop: 12,
//     color: '#b00020',
//     fontWeight: 600
//   },

//   footer: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     gap: 12,
//     marginTop: 25
//   },

//   btnPrimary: {
//     background: '#4aa3f0',
//     color: '#fff',
//     padding: '12px 24px',
//     borderRadius: 10,
//     border: 'none',
//     cursor: 'pointer',
//     fontSize: 15,
//     fontWeight: 600
//   },

//   btnSecondary: {
//     background: '#e9eef5',
//     color: '#333',
//     padding: '12px 24px',
//     borderRadius: 10,
//     border: 'none',
//     cursor: 'pointer',
//     fontSize: 15
//   }
// };
