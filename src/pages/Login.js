import React, { useState } from 'react';
import { authLogin, forgotPassword, verifyOtp, resetPassword, saveUserToStorage } from '../services/api';
import logo from '../images/logo.webp';
import { motion } from 'framer-motion';
import {GraduationCap, ShieldCheck, ChartNoAxesCombined} from "lucide-react";
import buildingBg from '../images/Backgroundimg.png'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await authLogin({ email, password, role });
      if (!res.success) { setError(res.message || 'Login failed'); return; }
      localStorage.setItem('token', res.data.token);
      saveUserToStorage(res.data.user);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
    try {
      const res = await forgotPassword(email);
      if (res.success) { setForgotPasswordStep(2); setForgotPasswordMessage('OTP sent to your email'); }
      else setError(res.message || 'Failed to send OTP');
    } catch { setError('Failed to send OTP. Please try again.'); }
    finally { setForgotPasswordLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) { setForgotPasswordStep(3); setForgotPasswordMessage('OTP verified successfully'); }
      else setError(res.message || 'Invalid OTP');
    } catch { setError('Failed to verify OTP. Please try again.'); }
    finally { setForgotPasswordLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setForgotPasswordMessage('Password reset successfully! You can now login.');
        setTimeout(() => { setShowForgotPassword(false); setForgotPasswordStep(1); setOtp(''); setNewPassword(''); }, 3000);
      } else setError(res.message || 'Failed to reset password');
    } catch { setError('Failed to reset password. Please try again.'); }
    finally { setForgotPasswordLoading(false); }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false); setForgotPasswordStep(1);
    setOtp(''); setNewPassword(''); setForgotPasswordMessage(''); setError('');
  };

  // ── Shared input style ──
  // const glassInput: React.CSSProperties = {
  const glassInput = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    backdropFilter: 'blur(4px)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const glassLabel = {
    display: 'block',
    marginBottom: 7,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    letterSpacing: '0.01em',
  };

  // const fieldWrap: React.CSSProperties = { marginBottom: 18 };
  const fieldWrap = { marginBottom: 12 };

  // Logo animation
const logoAnimation = {
  hidden: {
    opacity: 0,
    y: -120,
    scale: 0.5,
    rotate: -15,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
      type: "spring",
      stiffness: 90,
      damping: 12,
    },
  },
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatA {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(16px) scale(0.97); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          50%      { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        body { font-family: 'Inter', system-ui, sans-serif; }

        .lp-brand  { animation: slideLeft 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-form   { animation: fadeUp   0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .step-form { animation: slideIn  0.3s ease both; }

        .orb-a {
          position:absolute; pointer-events:none; border-radius:50%;
          width:340px; height:340px;
          background: radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 70%);
          top:-80px; left:-90px;
          animation: floatA 8s ease-in-out infinite;
        }
        .orb-b {
          position:absolute; pointer-events:none; border-radius:50%;
          width:220px; height:220px;
          background: radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%);
          bottom:30px; right:-50px;
          animation: floatB 10s ease-in-out infinite;
        }

        .feat-card {
          display:flex; align-items:center;
          margin-bottom:16px;
          // background: rgba(255,255,255,0.1);
          // border: 1px solid rgba(255,255,255,0.18);
          border-radius:14px;
          padding:14px 16px;
          backdrop-filter: blur(6px);
          cursor:default;
          transition: transform 0.22s, background 0.22s;
        }
        .feat-card:hover {
          transform: translateX(6px);
          background: rgba(255,255,255,0.18) !important;
        }

        .gl-input {
          width:100%; padding:11px 14px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.35);
          border-radius:10px;
          color:#fff; font-size:14px;
          font-family:inherit; outline:none;
          box-sizing:border-box;
          backdrop-filter:blur(4px);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gl-input::placeholder { color: rgba(255, 255, 255, 0.34); }
        .gl-input:focus {
          border-color: rgba(255,255,255,0.75);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.12);
        }
        .gl-input option { background:#1a3a6b; color:#fff; }

        .underline-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid rgba(255,255,255,0.45);
          color: #fff;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 8px 0;
          outline: none;
          transition: border-color 0.2s;
          caret-color: #fff;
        }
        .underline-input::placeholder {
          color: rgba(255,255,255,0.5);
          font-size: 14px;
        }
        .underline-input:focus {
          border-bottom-color: rgba(255,255,255,0.9);
        }
        .underline-input option { background:#1a3a6b; color:#fff; }

        .gl-btn {
          width:100%; padding:12px;
          // background: rgba(89, 124, 199, 0.85);
          background: rgba(255,255,255,0.18);
          color:#fff; border:none; border-radius:10px;
          font-size:15px; font-weight:600;
          font-family:inherit; cursor:pointer;
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
          position:relative; overflow:hidden;
          backdrop-filter:blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .gl-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: rgba(26, 87, 219, 0.14);
          // box-shadow: 0 8px 28px rgba(26,86,219,0.45);
        }
        .gl-btn:hover::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%);
          // animation: shimmer 0.65s linear;
        }
        .gl-btn:disabled { opacity:0.65; cursor:not-allowed; }

        .back-btn {
          width:100%; padding:12px;
          background: rgba(255,255,255,0.18);
          color:rgba(255,255,255,0.85);
          border:1px solid rgba(255,255,255,0.25); border-radius:10px;
          font-size:14px; font-weight:500;
          font-family:inherit; cursor:pointer; margin-top:10px;
          transition: background 0.2s;
        }
        .back-btn:hover { background: rgba(26, 87, 219, 0.14); }

        .forgot-link {
          background:none; border:none;
          color:rgba(255, 255, 255, 0.93); font-size:16px;
          font-family:inherit; cursor:pointer; font-weight:500;
          position:relative; padding-bottom:2px;
          transition: color 0.2s;
        }
        .forgot-link::after {
          content:''; position:absolute; bottom:0; left:0;
          width:0; height:1.5px;
          // background:rgba(255,255,255,0.8);
          transition: width 0.25s;
        }
        .forgot-link:hover { color:#fff; }
        .forgot-link:hover::after { width:100%; rgba(255,255,255,0.18);}

        .spinner {
          display:inline-block; width:15px; height:15px;
          border:2px solid rgba(255,255,255,0.35);
          border-top-color:#fff; border-radius:50%;
          animation: spin 0.7s linear infinite;
          margin-right:8px; vertical-align:middle;
        }

        .step-dot { transition: background 0.35s, color 0.35s, transform 0.35s; }
        .step-dot.active {
          background: rgba(26,86,219,0.9) !important;
          color:#fff !important;
          transform: scale(1.15);
          box-shadow: 0 0 0 4px rgba(255,255,255,0.2);
        }
        .step-line { transition: background 0.5s; }
        .step-line.active { background: rgba(26,86,219,0.7) !important; }

        @media (max-width: 860px) {
          .lp-split { flex-direction: column !important; }
          .lp-brand { min-height: 280px !important; flex: none !important; }
        }
      `}</style>

      {/* ── Full-page study background ── */}
      <div style={{
        minHeight: '100vh',
        // backgroundImage: `url(D:\Config Server LLP\Backend-csllp\CSLLP-FRONTEND\src\images\Backgroundimg.webp)`,
        // backgroundColor: 'rgba(43, 41, 41, 0.88)',
        backgroundImage: `url(${buildingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
      }}>
        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(5,20,60,0.82) 0%, rgba(10,30,80,0.68) 50%, rgba(5,15,45,0.78) 100%)',
        }} />

        {/* ── SPLIT LAYOUT ── */}
        <div className="lp-split" style={{
          position: 'relative', 
          zIndex: 1,
          display: 'flex', width: '100%', minHeight: '100vh',
        }}>

          {/* ══ LEFT — Brand Panel ══ */}
          <div className="lp-brand" style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '62px 78px',
            position: 'relative', overflow: 'hidden',
            // borderRight: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div className="orb-a" />
            <div className="orb-b" />

            <div style={{ position: 'relative', maxWidth: 500 }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                {/* <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  // background: 'rgba(26,86,219,0.6)',
                  backdropFilter: 'blur(8px)',
                  // border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 24, color: '#fff',
                  marginRight: 17,
                  animation: 'pulse 2.8s ease-in-out infinite',
                }}> */}
                <motion.div
                  variants={logoAnimation}
                  initial="hidden"
                  animate="visible"
                  whileHover={{
                    scale: 1.1,
                    // rotate: 5,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  style={{
                    // width: "220",
                    // height: "170",
                    // borderRadius: 14,
                    // backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 20,
                    // animation: "pulse 2.8s ease-in-out infinite",
                    // overflow: "hidden",
                  }}
                >
                  {/* CS */}
                  <img
                    src={logo}
                    alt="Logo"
                    style={{
                      width: "90%",
                      height: "4  0%",
                      objectFit: "contain",
                    }}
                  />
                </motion.div>
                {/* <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  CSLLP Platform
                </span> */}
              </div>

              <p style={{
                fontSize: 18, lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.88)',
                marginBottom: 40, maxWidth: 500,
              }}>
                Empowering organizations with comprehensive employee evaluation, learning, and performance tracking.
              </p>

              {/* Feature cards */}
              {[
                // { icon: '📚', title: 'Learning Materials',    desc: 'Access comprehensive study materials and resources' },
                // { icon: '🔒', title: 'Secure Evaluations',    desc: 'Take secure exams with advanced proficiency' },
                // { icon: '📊', title: 'Performance Analytics', desc: 'Track progress with detailed reports and insights' },
                { icon: <GraduationCap size={24} />, title: 'Learning Materials',    desc: 'Access comprehensive study materials and resources' },
                { icon: <ShieldCheck size={24} />, title: 'Secure Evaluations',    desc: 'Take secure exams with advanced proficiency' },
                { icon: <ChartNoAxesCombined size={24} />, title: 'Performance Analytics', desc: 'Track progress with detailed reports and insights' },
              ].map(f => (
                <div key={f.title} className="feat-card">
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(255,255,255,0.12)', color: "#d4e2f3",
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 21, marginRight: 18, backdropFilter: "blur(8px)",
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: 19, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.89)', fontSize: 17, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT — Form Panel ══ */}
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '48px 52px',
          }}>
            <div className="lp-form" style={{
              width: '100%', maxWidth: 480,
              // background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.45)',
              padding: '40px 36px',
              boxShadow: '0 16px 56px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>

              {!showForgotPassword ? (
                /* ── LOGIN FORM ── */
                <>
                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                      Welcome Back
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, lineHeight: 1.55, margin: 0 }}>
                      Sign in to access your account. Only registered users can login.
                    </p>
                  </div>

                  <form onSubmit={submit}>
                    {/* Email */}
                    <div style={fieldWrap}>
                      <label style={glassLabel}>Email</label>
                      <input
                        className="underline-input"
                        type="email" value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.com" required
                      />
                    </div>

                    {/* Password */}
                    <div style={fieldWrap}>
                      <label style={glassLabel}>Password</label>
                      <input
                        className="underline-input"
                        type="password" value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required
                      />
                    </div>

                    {/* Role dropdown */}
                    <div style={fieldWrap}>
                      <label style={glassLabel}>Role</label>
                      <select
                        className="underline-input"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        required
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>

                    {/* Forgot password row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22, marginTop: -4 }}>
                      <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                        Forgot your password?
                      </button>
                    </div>

                    <button className="gl-btn" type="submit" disabled={isLoading}>
                      {isLoading ? <><span className="spinner" />Signing In...</> : 'Sign In'}
                    </button>

                    {error && (
                      <div style={{
                        marginTop: 14, padding: '11px 14px',
                        background: 'rgba(225,29,72,0.18)',
                        border: '1px solid rgba(225,29,72,0.4)',
                        borderRadius: 8, color: '#fca5a5', fontSize: 13,
                      }}>{error}</div>
                    )}
                  </form>

                  <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
                    {"Don't have an account? "}
                    <a href="#contact" style={{ color: '#6aa9f0', fontWeight: 600, textDecoration: 'none' }}>
                      Contact your administrator
                    </a>
                  </p>
                </>
              ) : (
                /* ── FORGOT PASSWORD FLOW ── */
                <div className="step-form">
                  <div style={{ marginBottom: 22 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                      {forgotPasswordStep === 1 && 'Reset Your Password'}
                      {forgotPasswordStep === 2 && 'Enter OTP'}
                      {forgotPasswordStep === 3 && 'Set New Password'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
                      {forgotPasswordStep === 1 && 'Enter your email to receive a verification code'}
                      {forgotPasswordStep === 2 && `Enter the 6-digit code sent to ${email}`}
                      {forgotPasswordStep === 3 && 'Create your new secure password'}
                    </p>
                  </div>

                  {/* Progress steps */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
                    {['Email', 'OTP', 'Password'].map((lbl, i) => (
                      <React.Fragment key={lbl}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            className={`step-dot${forgotPasswordStep >= i + 1 ? ' active' : ''}`}
                            style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.5)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, marginBottom: 5,
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          >{i + 1}</div>
                          <span style={{
                            fontSize: 11, fontWeight: 500,
                            color: forgotPasswordStep >= i + 1 ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                          }}>{lbl}</span>
                        </div>
                        {i < 2 && (
                          <div
                            className={`step-line${forgotPasswordStep >= i + 2 ? ' active' : ''}`}
                            style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.15)', margin: '0 8px 18px' }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {forgotPasswordMessage && (
                    <div style={{
                      marginBottom: 14, padding: '11px 14px',
                      background: 'rgba(5,150,105,0.18)',
                      border: '1px solid rgba(5,150,105,0.4)',
                      borderRadius: 8, color: '#6ee7b7', fontSize: 13,
                    }}>{forgotPasswordMessage}</div>
                  )}
                  {error && (
                    <div style={{
                      marginBottom: 14, padding: '11px 14px',
                      background: 'rgba(225,29,72,0.18)',
                      border: '1px solid rgba(225,29,72,0.4)',
                      borderRadius: 8, color: '#fca5a5', fontSize: 13,
                    }}>{error}</div>
                  )}

                  <form onSubmit={
                    forgotPasswordStep === 1 ? handleForgotPassword :
                    forgotPasswordStep === 2 ? handleVerifyOtp :
                    handleResetPassword
                  }>
                    {forgotPasswordStep === 1 && (
                      <div style={fieldWrap}>
                        <label style={glassLabel}>Email Address</label>
                        <input className="gl-input" type="email" value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your registered email" required />
                      </div>
                    )}
                    {forgotPasswordStep === 2 && (
                      <div style={fieldWrap}>
                        <label style={glassLabel}>Verification Code</label>
                        <input className="gl-input" type="text" value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP" maxLength={6} required
                          style={{ ...glassInput, letterSpacing: '0.25em', textAlign: 'center' }} />
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                          Check your email for the 6-digit code
                        </p>
                      </div>
                    )}
                    {forgotPasswordStep === 3 && (
                      <div style={fieldWrap}>
                        <label style={glassLabel}>New Password</label>
                        <input className="gl-input" type="password" value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters" minLength={6} required />
                      </div>
                    )}

                    <button className="gl-btn" type="submit" disabled={forgotPasswordLoading}>
                      {forgotPasswordLoading ? <><span className="spinner" />Processing...</> :
                        forgotPasswordStep === 1 ? 'Send OTP' :
                        forgotPasswordStep === 2 ? 'Verify OTP' : 'Reset Password'}
                    </button>

                    <button type="button" className="back-btn" onClick={handleBackToLogin}>
                      ← Back to Login
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}


// import React, { useState } from 'react';
// import { authLogin, forgotPassword, verifyOtp, resetPassword, saveUserToStorage } from '../services/api';

// export default function Login({ onLogin }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('ADMIN');
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const [showForgotPassword, setShowForgotPassword] = useState(false);
//   const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
//   const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

//   async function submit(e) {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);
//     try {
//       const res = await authLogin({ email, password, role });
//       if (!res.success) { setError(res.message || 'Login failed'); return; }
//       localStorage.setItem('token', res.data.token);
//       saveUserToStorage(res.data.user);
//       onLogin(res.data.user);
//     } catch (err) {
//       setError(err.message || 'Login failed');
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   const handleForgotPassword = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
//     try {
//       const res = await forgotPassword(email);
//       if (res.success) { setForgotPasswordStep(2); setForgotPasswordMessage('OTP sent to your email'); }
//       else setError(res.message || 'Failed to send OTP');
//     } catch { setError('Failed to send OTP. Please try again.'); }
//     finally { setForgotPasswordLoading(false); }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
//     try {
//       const res = await verifyOtp(email, otp);
//       if (res.success) { setForgotPasswordStep(3); setForgotPasswordMessage('OTP verified successfully'); }
//       else setError(res.message || 'Invalid OTP');
//     } catch { setError('Failed to verify OTP. Please try again.'); }
//     finally { setForgotPasswordLoading(false); }
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true); setForgotPasswordMessage(''); setError('');
//     try {
//       const res = await resetPassword(email, otp, newPassword);
//       if (res.success) {
//         setForgotPasswordMessage('Password reset successfully! You can now login.');
//         setTimeout(() => { setShowForgotPassword(false); setForgotPasswordStep(1); setOtp(''); setNewPassword(''); }, 3000);
//       } else setError(res.message || 'Failed to reset password');
//     } catch { setError('Failed to reset password. Please try again.'); }
//     finally { setForgotPasswordLoading(false); }
//   };

//   const handleBackToLogin = () => {
//     setShowForgotPassword(false); setForgotPasswordStep(1);
//     setOtp(''); setNewPassword(''); setForgotPasswordMessage(''); setError('');
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

//         * { box-sizing: border-box; }

//         /* ── Page entry ── */
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(24px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }

//         /* ── Left panel floating orbs ── */
//         @keyframes floatA {
//           0%,100% { transform: translateY(0) scale(1); }
//           50%      { transform: translateY(-22px) scale(1.04); }
//         }
//         @keyframes floatB {
//           0%,100% { transform: translateY(0) scale(1); }
//           50%      { transform: translateY(18px) scale(0.97); }
//         }

//         /* ── Shimmer on the brand panel ── */
//         @keyframes shimmer {
//           0%   { background-position: -400px 0; }
//           100% { background-position: 400px 0; }
//         }

//         /* ── Pulse ring on logo ── */
//         @keyframes pulse {
//           0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
//           50%      { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
//         }

//         /* ── Spinning loader ── */
//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }

//         /* ── Step slide-in ── */
//         @keyframes slideIn {
//           from { opacity: 0; transform: translateX(20px); }
//           to   { opacity: 1; transform: translateX(0); }
//         }

//         .login-page { font-family: 'Inter', system-ui, sans-serif; }

//         .form-panel {
//           animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
//         }

//         .brand-panel {
//           position: relative;
//           overflow: hidden;
//         }

//         .orb-a {
//           position: absolute; border-radius: 50%; pointer-events: none;
//           width: 320px; height: 320px;
//           background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
//           top: -60px; left: -80px;
//           animation: floatA 7s ease-in-out infinite;
//         }
//         .orb-b {
//           position: absolute; border-radius: 50%; pointer-events: none;
//           width: 240px; height: 240px;
//           background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
//           bottom: 40px; right: -60px;
//           animation: floatB 9s ease-in-out infinite;
//         }

//         .feature-card {
//           transition: transform 0.25s, background 0.25s;
//         }
//         .feature-card:hover {
//           transform: translateX(6px);
//           background: rgba(255,255,255,0.15) !important;
//         }

//         .login-input {
//           transition: border-color 0.2s, box-shadow 0.2s;
//           outline: none;
//         }
//         .login-input:focus {
//           border-color: #1a56db !important;
//           box-shadow: 0 0 0 3px rgba(26,86,219,0.12);
//         }

//         .login-btn {
//           position: relative;
//           overflow: hidden;
//           transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
//         }
//         .login-btn:hover:not(:disabled) {
//           transform: translateY(-2px);
//           box-shadow: 0 8px 24px rgba(26,86,219,0.35);
//           background: #1446c2 !important;
//         }
//         .login-btn:active:not(:disabled) {
//           transform: translateY(0);
//         }
//         .login-btn::after {
//           content: '';
//           position: absolute; inset: 0;
//           background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
//           background-size: 200% 100%;
//           opacity: 0;
//           transition: opacity 0.3s;
//         }
//         .login-btn:hover::after {
//           opacity: 1;
//           animation: shimmer 0.7s linear;
//         }

//         .back-btn {
//           transition: background 0.2s, color 0.2s;
//         }
//         .back-btn:hover {
//           background: #f3f4f6 !important;
//           color: #374151 !important;
//         }

//         .step-form { animation: slideIn 0.3s ease both; }

//         .spinner {
//           display: inline-block;
//           width: 16px; height: 16px;
//           border: 2px solid rgba(255,255,255,0.4);
//           border-top-color: #fff;
//           border-radius: 50%;
//           animation: spin 0.7s linear infinite;
//           margin-right: 8px;
//           vertical-align: middle;
//         }

//         .step-dot {
//           transition: background 0.35s, color 0.35s, transform 0.35s;
//         }
//         .step-dot.active {
//           background: #1a56db !important;
//           color: white !important;
//           transform: scale(1.15);
//           box-shadow: 0 0 0 4px rgba(26,86,219,0.18);
//         }
//         .step-line {
//           transition: background 0.5s;
//         }
//         .step-line.active {
//           background: #1a56db !important;
//         }

//         .forgot-link {
//           background: none; border: none;
//           color: #1a56db; font-size: 14px;
//           cursor: pointer; text-decoration: none;
//           font-family: inherit; font-weight: 500;
//           position: relative; padding-bottom: 2px;
//           transition: color 0.2s;
//         }
//         .forgot-link::after {
//           content: '';
//           position: absolute; bottom: 0; left: 0;
//           width: 0; height: 1.5px;
//           background: #1a56db;
//           transition: width 0.25s;
//         }
//         .forgot-link:hover::after { width: 100%; }

//         @media (max-width: 860px) {
//           .login-split { flex-direction: column !important; }
//           .brand-panel { min-height: 260px !important; }
//         }
//       `}</style>

//       <div className="login-page login-split" style={{
//         display: 'flex', minHeight: '100vh', backgroundColor: '#eef2fb',
//       }}>

//         {/* ── LEFT BRAND PANEL ── */}
//         <div className="brand-panel" style={{
//           flex: 1,
//           background: 'linear-gradient(145deg, #1a56db 0%, #0a36a9 60%, #072d8a 100%)',
//           color: 'white',
//           padding: '48px 44px',
//           display: 'flex', flexDirection: 'column', justifyContent: 'center',
//         }}>
//           <div className="orb-a" />
//           <div className="orb-b" />

//           <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
//             {/* Logo */}
//             <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
//               <div style={{
//                 width: 52, height: 52, borderRadius: 14,
//                 background: 'rgba(255,255,255,0.2)',
//                 backdropFilter: 'blur(6px)',
//                 border: '1px solid rgba(255,255,255,0.25)',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 fontWeight: 700, fontSize: 18, marginRight: 14,
//                 animation: 'pulse 2.5s ease-in-out infinite',
//               }}>CS</div>
//               <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px' }}>
//                 CSLLP Platform
//               </span>
//             </div>

//             <p style={{
//               fontSize: 17, lineHeight: 1.65, opacity: 0.88,
//               marginBottom: 44, maxWidth: 420,
//             }}>
//               Empowering organizations with comprehensive employee evaluation, learning, and performance tracking.
//             </p>

//             {/* Feature cards */}
//             {[
//               { icon: '📚', title: 'Learning Materials',      desc: 'Access comprehensive study materials and resources' },
//               { icon: '🔒', title: 'Secure Evaluations',      desc: 'Take secure exams with advanced proficiency' },
//               { icon: '📊', title: 'Performance Analytics',   desc: 'Track progress with detailed reports and insights' },
//             ].map(f => (
//               <div key={f.title} className="feature-card" style={{
//                 display: 'flex', alignItems: 'center',
//                 marginBottom: 20,
//                 background: 'rgba(255,255,255,0.1)',
//                 borderRadius: 14,
//                 padding: '14px 18px',
//                 border: '1px solid rgba(255,255,255,0.12)',
//                 backdropFilter: 'blur(4px)',
//                 cursor: 'default',
//               }}>
//                 <div style={{
//                   width: 42, height: 42, borderRadius: 10, flexShrink: 0,
//                   background: 'rgba(255,255,255,0.18)',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   fontSize: 20, marginRight: 16,
//                 }}>{f.icon}</div>
//                 <div>
//                   <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 15 }}>{f.title}</div>
//                   <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.4 }}>{f.desc}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── RIGHT FORM PANEL ── */}
//         <div style={{
//           flex: 1,
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           padding: '48px 32px',
//           background: '#f7f9fc',
//         }}>
//           <div className="form-panel" style={{
//             width: '100%', maxWidth: 440,
//             background: '#ffffff',
//             borderRadius: 20,
//             padding: '40px 36px',
//             boxShadow: '0 4px 32px rgba(26,86,219,0.09), 0 1px 4px rgba(0,0,0,0.06)',
//             border: '1px solid rgba(26,86,219,0.08)',
//           }}>

//             {!showForgotPassword ? (
//               /* ── LOGIN FORM ── */
//               <>
//                 <div style={{ marginBottom: 28 }}>
//                   <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
//                     Welcome Back 👋
//                   </h2>
//                   <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
//                     Sign in to access your account. Only registered users can login.
//                   </p>
//                 </div>

//                 <form onSubmit={submit}>
//                   {[
//                     { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@company.com' },
//                     { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
//                   ].map(f => (
//                     <div key={f.label} style={{ marginBottom: 18 }}>
//                       <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13 }}>
//                         {f.label}
//                       </label>
//                       <input
//                         className="login-input"
//                         type={f.type} value={f.value}
//                         onChange={e => f.set(e.target.value)}
//                         placeholder={f.placeholder} required
//                         style={{
//                           width: '100%', padding: '11px 14px',
//                           border: '1.5px solid #e5e7eb', borderRadius: 10,
//                           fontSize: 15, background: '#f9fafb',
//                           boxSizing: 'border-box', fontFamily: 'inherit',
//                         }}
//                       />
//                     </div>
//                   ))}

//                   <div style={{ marginBottom: 22 }}>
//                     <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13 }}>
//                       Role
//                     </label>
//                     <select
//                       className="login-input"
//                       value={role} onChange={e => setRole(e.target.value)} required
//                       style={{
//                         width: '100%', padding: '11px 14px',
//                         border: '1.5px solid #e5e7eb', borderRadius: 10,
//                         fontSize: 15, background: '#f9fafb',
//                         boxSizing: 'border-box', fontFamily: 'inherit',
//                         appearance: 'auto',
//                       }}
//                     >
//                       <option value="ADMIN">ADMIN</option>
//                       <option value="MANAGER">MANAGER</option>
//                       <option value="EMPLOYEE">EMPLOYEE</option>
//                       <option value="HR">HR</option>
//                     </select>
//                   </div>

//                   <button
//                     className="login-btn"
//                     type="submit" disabled={isLoading}
//                     style={{
//                       width: '100%', padding: '13px',
//                       background: '#1a56db', color: '#fff',
//                       border: 'none', borderRadius: 10,
//                       fontSize: 15, fontWeight: 600, cursor: 'pointer',
//                       opacity: isLoading ? 0.75 : 1,
//                     }}
//                   >
//                     {isLoading ? <><span className="spinner" />Signing In...</> : 'Sign In'}
//                   </button>

//                   {error && (
//                     <div style={{
//                       marginTop: 14, padding: '11px 14px',
//                       background: '#fff1f2', borderLeft: '4px solid #e11d48',
//                       borderRadius: 8, color: '#be123c', fontSize: 13,
//                     }}>{error}</div>
//                   )}
//                 </form>

//                 <div style={{ textAlign: 'center', marginTop: 20 }}>
//                   <button className="forgot-link" onClick={() => setShowForgotPassword(true)}>
//                     Forgot your password?
//                   </button>
//                 </div>
//                 <p style={{ textAlign: 'center', marginTop: 16, color: '#9ca3af', fontSize: 13 }}>
//                   {"Don't have an account? "}
//                   <a href="#contact" style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>
//                     Contact your administrator
//                   </a>
//                 </p>
//               </>
//             ) : (
//               /* ── FORGOT PASSWORD FLOW ── */
//               <div className="step-form">
//                 <div style={{ marginBottom: 24 }}>
//                   <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
//                     {forgotPasswordStep === 1 && 'Reset Your Password'}
//                     {forgotPasswordStep === 2 && 'Enter OTP'}
//                     {forgotPasswordStep === 3 && 'Set New Password'}
//                   </h2>
//                   <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
//                     {forgotPasswordStep === 1 && 'Enter your email to receive a verification code'}
//                     {forgotPasswordStep === 2 && `Enter the 6-digit code sent to ${email}`}
//                     {forgotPasswordStep === 3 && 'Create your new secure password'}
//                   </p>
//                 </div>

//                 {/* Progress steps */}
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
//                   {['Email', 'OTP', 'Password'].map((label, i) => (
//                     <React.Fragment key={label}>
//                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                         <div
//                           className={`step-dot${forgotPasswordStep >= i + 1 ? ' active' : ''}`}
//                           style={{
//                             width: 30, height: 30, borderRadius: '50%',
//                             background: '#e5e7eb', color: '#9ca3af',
//                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                             fontSize: 13, fontWeight: 700, marginBottom: 5,
//                           }}
//                         >{i + 1}</div>
//                         <span style={{ fontSize: 11, color: forgotPasswordStep >= i + 1 ? '#1a56db' : '#9ca3af', fontWeight: 500 }}>
//                           {label}
//                         </span>
//                       </div>
//                       {i < 2 && (
//                         <div
//                           className={`step-line${forgotPasswordStep >= i + 2 ? ' active' : ''}`}
//                           style={{ width: 44, height: 2, background: '#e5e7eb', margin: '0 8px 18px' }}
//                         />
//                       )}
//                     </React.Fragment>
//                   ))}
//                 </div>

//                 {forgotPasswordMessage && (
//                   <div style={{
//                     marginBottom: 16, padding: '11px 14px',
//                     background: '#f0fdf4', borderLeft: '4px solid #059669',
//                     borderRadius: 8, color: '#047857', fontSize: 13,
//                   }}>{forgotPasswordMessage}</div>
//                 )}
//                 {error && (
//                   <div style={{
//                     marginBottom: 16, padding: '11px 14px',
//                     background: '#fff1f2', borderLeft: '4px solid #e11d48',
//                     borderRadius: 8, color: '#be123c', fontSize: 13,
//                   }}>{error}</div>
//                 )}

//                 <form onSubmit={
//                   forgotPasswordStep === 1 ? handleForgotPassword :
//                   forgotPasswordStep === 2 ? handleVerifyOtp :
//                   handleResetPassword
//                 }>
//                   {forgotPasswordStep === 1 && (
//                     <div style={{ marginBottom: 18 }}>
//                       <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13 }}>Email Address</label>
//                       <input className="login-input" type="email" value={email}
//                         onChange={e => setEmail(e.target.value)}
//                         placeholder="Enter your registered email" required
//                         style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                       />
//                     </div>
//                   )}
//                   {forgotPasswordStep === 2 && (
//                     <div style={{ marginBottom: 18 }}>
//                       <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13 }}>Verification Code</label>
//                       <input className="login-input" type="text" value={otp}
//                         onChange={e => setOtp(e.target.value)}
//                         placeholder="Enter 6-digit OTP" maxLength={6} required
//                         style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit', letterSpacing: '0.2em', textAlign: 'center' }}
//                       />
//                       <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Check your email for the 6-digit code</p>
//                     </div>
//                   )}
//                   {forgotPasswordStep === 3 && (
//                     <div style={{ marginBottom: 18 }}>
//                       <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13 }}>New Password</label>
//                       <input className="login-input" type="password" value={newPassword}
//                         onChange={e => setNewPassword(e.target.value)}
//                         placeholder="Min. 6 characters" minLength={6} required
//                         style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                       />
//                     </div>
//                   )}

//                   <button className="login-btn" type="submit" disabled={forgotPasswordLoading}
//                     style={{
//                       width: '100%', padding: '13px',
//                       background: '#1a56db', color: '#fff',
//                       border: 'none', borderRadius: 10,
//                       fontSize: 15, fontWeight: 600, cursor: 'pointer',
//                       opacity: forgotPasswordLoading ? 0.75 : 1,
//                     }}
//                   >
//                     {forgotPasswordLoading ? <><span className="spinner" />Processing...</> :
//                       forgotPasswordStep === 1 ? 'Send OTP' :
//                       forgotPasswordStep === 2 ? 'Verify OTP' : 'Reset Password'}
//                   </button>

//                   <button type="button" className="back-btn" onClick={handleBackToLogin}
//                     style={{
//                       width: '100%', padding: '12px',
//                       background: 'transparent', color: '#6b7280',
//                       border: '1.5px solid #e5e7eb', borderRadius: 10,
//                       fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 10,
//                       fontFamily: 'inherit',
//                     }}
//                   >← Back to Login</button>
//                 </form>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// import React, { useState } from 'react';
// import { authLogin, forgotPassword, verifyOtp, resetPassword, saveUserToStorage } from '../services/api'; 

// export default function Login({ onLogin }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('ADMIN');
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
  
//   // Forgot Password States
//   const [showForgotPassword, setShowForgotPassword] = useState(false);
//   const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
//   const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

//   async function submit(e) {
//     e.preventDefault(); 
//     setError(null);
//     setIsLoading(true);

//     try {
//       const res = await authLogin({ email, password, role });
      
//       console.log("Login Response : ", res);
//       if(!res.success) {
//         setError(res.message || "Login failed");
//         return;
//       }
//       localStorage.setItem("token", res.data.token);
//       saveUserToStorage(res.data.user);
//       onLogin(res.data.user);
//     } catch (err) {
//       console.log(err);
//       setError(err.message || "Login failed");
//     } finally {
//       setIsLoading(false);
//     }
    
//     // try {
//     //   const res = await authLogin({ email, password, role });
//     //   if (!res.ok) {
//     //     setError(res.body && res.body.message ? res.body.message : 'Login failed');
//     //     return;
//     //   }
//     //   onLogin(res.body.data);
//     // } catch (err) {
//     //   setError('An unexpected error occurred. Please try again.');
//     // } finally {
//     //   setIsLoading(false);
//     // }
//   }

//   // Forgot Password Functions
//   const handleForgotPassword = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true);
//     setForgotPasswordMessage('');
//     setError('');

//     try {
//       const res = await forgotPassword(email);
//       if (res.success) {
//         setForgotPasswordStep(2);
//         setForgotPasswordMessage('OTP sent to your email');
//       } else {
//         setError(res.message || 'Failed to send OTP');
//       }
//     } catch (err) {
//       setError('Failed to send OTP. Please try again.');
//     } finally {
//       setForgotPasswordLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true);
//     setForgotPasswordMessage('');
//     setError('');

//     try {
//       const res = await verifyOtp(email, otp);
//       if (res.success) {
//         setForgotPasswordStep(3);
//         setForgotPasswordMessage('OTP verified successfully');
//       } else {
//         setError(res.message || 'Invalid OTP');
//       }
//     } catch (err) {
//       setError('Failed to verify OTP. Please try again.');
//     } finally {
//       setForgotPasswordLoading(false);
//     }
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setForgotPasswordLoading(true);
//     setForgotPasswordMessage('');
//     setError('');

//     try {
//       const res = await resetPassword(email, otp, newPassword);
//       if (res.success) {
//         setForgotPasswordMessage('Password reset successfully! You can now login with your new password.');
//         setTimeout(() => {
//           setShowForgotPassword(false);
//           setForgotPasswordStep(1);
//           setOtp('');
//           setNewPassword('');
//         }, 3000);
//       } else {
//         setError(res.message || 'Failed to reset password');
//       }
//     } catch (err) {
//       setError('Failed to reset password. Please try again.');
//     } finally {
//       setForgotPasswordLoading(false);
//     }
//   };

//   const handleBackToLogin = () => {
//     setShowForgotPassword(false);
//     setForgotPasswordStep(1);
//     setOtp('');
//     setNewPassword('');
//     setForgotPasswordMessage('');
//     setError('');
//   };

//   return (
//     <div style={styles.loginContainer}>
//       {/* Brand Section */}
//       <div style={styles.brandSection}>
//         <div style={styles.brandContent}>
//           <div style={styles.logo}>
//             <div style={styles.logoIcon}>CS</div>
//             <span>CSLLP Platform</span>
//           </div>
//           <p style={styles.tagline}>
//             Empowering organizations with comprehensive employee evaluation, learning, and performance tracking.
//           </p>
          
//           <div style={styles.features}>
//             <div style={styles.featureItem}>
//               <div style={styles.featureIcon}>📚</div>
//               <div style={styles.featureText}>
//                 <div style={styles.featureTitle}>Learning Materials</div>
//                 <div>Access comprehensive study materials and resources</div>
//               </div>
//             </div>
            
//             <div style={styles.featureItem}>
//               <div style={styles.featureIcon}>🔒</div>
//               <div style={styles.featureText}>
//                 <div style={styles.featureTitle}>Secure Evaluations</div>
//                 <div>Take secure exams with advanced proficiency</div>
//               </div>
//             </div>
            
//             <div style={styles.featureItem}>
//               <div style={styles.featureIcon}>📊</div>
//               <div style={styles.featureText}>
//                 <div style={styles.featureTitle}>Performance Analytics</div>
//                 <div>Track progress with default reports and insights</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Form Section */}
//       <div style={styles.formSection}>
//         <div style={styles.formContainer}>
//           {!showForgotPassword ? (
//             // LOGIN FORM
//             <>
//               <h2 style={styles.welcomeTitle}>Welcome Back</h2>
//               <p style={styles.welcomeText}>
//                 Sign in to access your account. Only registered users can login.
//               </p>
              
//               <form onSubmit={submit} style={styles.form}>
//                 <div style={styles.formGroup}>
//                   <label style={styles.label}>Email</label>
//                   <input 
//                     style={styles.input}
//                     type="email" 
//                     value={email} 
//                     onChange={e => setEmail(e.target.value)}
//                     placeholder="Enter your email"
//                     required
//                   />
//                 </div>
                
//                 <div style={styles.formGroup}>
//                   <label style={styles.label}>Password</label>
//                   <input 
//                     style={styles.input}
//                     type="password" 
//                     value={password} 
//                     onChange={e => setPassword(e.target.value)}
//                     placeholder="Enter your password"
//                     required
//                   />
//                 </div>
                
//                 <div style={styles.formGroup}>
//                   <label style={styles.label}>Role</label>
//                   <select 
//                     style={styles.select}
//                     value={role} 
//                     onChange={e => setRole(e.target.value)}
//                     required
//                   >
//                     <option value="ADMIN">ADMIN</option>
//                     <option value="MANAGER">MANAGER</option>
//                     <option value="EMPLOYEE">EMPLOYEE</option>
//                     <option value="HR">HR</option>
//                   </select>
//                 </div>
                
//                 <button 
//                   type="submit" 
//                   style={{
//                     ...styles.button,
//                     ...(isLoading ? styles.buttonLoading : {})
//                   }}
//                   disabled={isLoading}
//                 >
//                   {isLoading ? 'Signing In...' : 'Login'}
//                 </button>
                
//                 {error && <div style={styles.errorMessage}>{error}</div>}
//               </form>
              
//               {/* Forgot Password Link */}
//               <div style={styles.forgotPasswordContainer}>
//                 <button 
//                   onClick={() => setShowForgotPassword(true)}
//                   style={styles.forgotPasswordLink}
//                 >
//                   Forgot your password?
//                 </button>
//               </div>
              
//               <p style={styles.adminContact}>
//                 Don't have an account? <a href="#contact" style={styles.contactLink}>Contact your administrator</a>
//               </p>
//             </>
//           ) : (
//             // FORGOT PASSWORD FORM
//             <>
//               <h2 style={styles.welcomeTitle}>
//                 {forgotPasswordStep === 1 && 'Reset Your Password'}
//                 {forgotPasswordStep === 2 && 'Enter OTP'}
//                 {forgotPasswordStep === 3 && 'Set New Password'}
//               </h2>
              
//               <p style={styles.welcomeText}>
//                 {forgotPasswordStep === 1 && 'Enter your email to receive a verification code'}
//                 {forgotPasswordStep === 2 && `Enter the 6-digit code sent to ${email}`}
//                 {forgotPasswordStep === 3 && 'Create your new password'}
//               </p>

//               {forgotPasswordMessage && (
//                 <div style={styles.successMessage}>{forgotPasswordMessage}</div>
//               )}

//               {error && <div style={styles.errorMessage}>{error}</div>}

//               <form onSubmit={
//                 forgotPasswordStep === 1 ? handleForgotPassword :
//                 forgotPasswordStep === 2 ? handleVerifyOtp :
//                 handleResetPassword
//               } style={styles.form}>
                
//                 {/* Step 1: Email */}
//                 {forgotPasswordStep === 1 && (
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>Email Address</label>
//                     <input 
//                       style={styles.input}
//                       type="email" 
//                       value={email} 
//                       onChange={e => setEmail(e.target.value)}
//                       placeholder="Enter your registered email"
//                       required
//                     />
//                   </div>
//                 )}

//                 {/* Step 2: OTP */}
//                 {forgotPasswordStep === 2 && (
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>Verification Code</label>
//                     <input 
//                       style={styles.input}
//                       type="text" 
//                       value={otp} 
//                       onChange={e => setOtp(e.target.value)}
//                       placeholder="Enter 6-digit OTP"
//                       maxLength="6"
//                       required
//                     />
//                     <div style={styles.otpHint}>
//                       Check your email for the 6-digit code
//                     </div>
//                   </div>
//                 )}

//                 {/* Step 3: New Password */}
//                 {forgotPasswordStep === 3 && (
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>New Password</label>
//                     <input 
//                       style={styles.input}
//                       type="password" 
//                       value={newPassword} 
//                       onChange={e => setNewPassword(e.target.value)}
//                       placeholder="Enter new password (min. 6 characters)"
//                       minLength="6"
//                       required
//                     />
//                   </div>
//                 )}

//                 <div style={styles.forgotPasswordActions}>
//                   <button 
//                     type="submit" 
//                     style={{
//                       ...styles.button,
//                       ...(forgotPasswordLoading ? styles.buttonLoading : {})
//                     }}
//                     disabled={forgotPasswordLoading}
//                   >
//                     {forgotPasswordLoading ? (
//                       'Processing...'
//                     ) : (
//                       forgotPasswordStep === 1 ? 'Send OTP' :
//                       forgotPasswordStep === 2 ? 'Verify OTP' :
//                       'Reset Password'
//                     )}
//                   </button>

//                   <button 
//                     type="button"
//                     onClick={handleBackToLogin}
//                     style={styles.backButton}
//                   >
//                     Back to Login
//                   </button>
//                 </div>
//               </form>

//               {/* Progress Steps */}
//               <div style={styles.progressSteps}>
//                 <div style={{
//                   ...styles.progressStep,
//                   ...(forgotPasswordStep >= 1 ? styles.progressStepActive : {})
//                 }}>
//                   <div style={styles.stepNumber}>1</div>
//                   <div style={styles.stepLabel}>Email</div>
//                 </div>
//                 <div style={styles.progressLine}></div>
//                 <div style={{
//                   ...styles.progressStep,
//                   ...(forgotPasswordStep >= 2 ? styles.progressStepActive : {})
//                 }}>
//                   <div style={styles.stepNumber}>2</div>
//                   <div style={styles.stepLabel}>OTP</div>
//                 </div>
//                 <div style={styles.progressLine}></div>
//                 <div style={{
//                   ...styles.progressStep,
//                   ...(forgotPasswordStep >= 3 ? styles.progressStepActive : {})
//                 }}>
//                   <div style={styles.stepNumber}>3</div>
//                   <div style={styles.stepLabel}>Password</div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Inline styles for professional appearance
// const styles = {
//   loginContainer: {
//     display: 'flex',
//     minHeight: '100vh',
//     backgroundColor: '#f5f7f9',
//   },
  
//   // Brand Section Styles
//   brandSection: {
//     flex: 1,
//     background: 'linear-gradient(135deg, #1a56db 0%, #0a36a9 100%)',
//     color: 'white',
//     padding: '40px',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//   },
  
//   brandContent: {
//     maxWidth: '600px',
//     margin: '0 auto',
//   },
  
//   logo: {
//     fontSize: '28px',
//     fontWeight: '700',
//     marginBottom: '20px',
//     display: 'flex',
//     alignItems: 'center',
//   },
  
//   logoIcon: {
//     background: 'rgba(255, 255, 255, 0.2)',
//     width: '50px',
//     height: '50px',
//     borderRadius: '12px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: '15px',
//     fontWeight: '600',
//   },
  
//   tagline: {
//     fontSize: '18px',
//     marginBottom: '40px',
//     opacity: '0.9',
//     lineHeight: '1.5',
//   },
  
//   features: {
//     marginTop: '40px',
//   },
  
//   featureItem: {
//     display: 'flex',
//     alignItems: 'center',
//     marginBottom: '25px',
//   },
  
//   featureIcon: {
//     background: 'rgba(255, 255, 255, 0.15)',
//     width: '40px',
//     height: '40px',
//     borderRadius: '10px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: '15px',
//     fontSize: '18px',
//   },
  
//   featureText: {
//     flex: 1,
//   },
  
//   featureTitle: {
//     fontWeight: '600',
//     marginBottom: '5px',
//   },
  
//   // Form Section Styles
//   formSection: {
//     flex: 1,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: '40px',
//   },
  
//   formContainer: {
//     width: '100%',
//     maxWidth: '450px',
//     backgroundColor: 'white',
//     padding: '40px',
//     borderRadius: '12px',
//     boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
//   },
  
//   welcomeTitle: {
//     fontSize: '24px',
//     fontWeight: '600',
//     marginBottom: '10px',
//     color: '#1a56db',
//   },
  
//   welcomeText: {
//     color: '#6b7280',
//     marginBottom: '30px',
//     lineHeight: '1.5',
//   },
  
//   form: {
//     width: '100%',
//   },
  
//   formGroup: {
//     marginBottom: '20px',
//   },
  
//   label: {
//     display: 'block',
//     marginBottom: '8px',
//     fontWeight: '500',
//     color: '#374151',
//     fontSize: '14px',
//   },
  
//   input: {
//     width: '100%',
//     padding: '12px 15px',
//     border: '1px solid #d1d5db',
//     borderRadius: '8px',
//     fontSize: '16px',
//     transition: 'all 0.3s',
//     fontFamily: 'inherit',
//   },
  
//   select: {
//     width: '100%',
//     padding: '12px 15px',
//     border: '1px solid #d1d5db',
//     borderRadius: '8px',
//     fontSize: '16px',
//     transition: 'all 0.3s',
//     fontFamily: 'inherit',
//     backgroundColor: 'white',
//   },
  
//   button: {
//     width: '100%',
//     padding: '14px',
//     backgroundColor: '#1a56db',
//     color: 'white',
//     border: 'none',
//     borderRadius: '8px',
//     fontSize: '16px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'all 0.3s',
//     marginTop: '10px',
//   },
  
//   buttonLoading: {
//     opacity: '0.7',
//     cursor: 'not-allowed',
//   },
  
//   errorMessage: {
//     color: '#e11d48',
//     textAlign: 'center',
//     marginTop: '15px',
//     padding: '12px',
//     backgroundColor: 'rgba(225, 29, 72, 0.05)',
//     borderRadius: '6px',
//     borderLeft: '4px solid #e11d48',
//     fontSize: '14px',
//   },
  
//   successMessage: {
//     color: '#059669',
//     textAlign: 'center',
//     marginTop: '15px',
//     padding: '12px',
//     backgroundColor: 'rgba(5, 150, 105, 0.05)',
//     borderRadius: '6px',
//     borderLeft: '4px solid #059669',
//     fontSize: '14px',
//   },
  
//   // Forgot Password Styles
//   forgotPasswordContainer: {
//     textAlign: 'center',
//     marginTop: '20px',
//     marginBottom: '20px',
//   },
  
//   forgotPasswordLink: {
//     background: 'none',
//     border: 'none',
//     color: '#1a56db',
//     fontSize: '14px',
//     cursor: 'pointer',
//     textDecoration: 'underline',
//     fontFamily: 'inherit',
//   },
  
//   forgotPasswordActions: {
//     marginTop: '20px',
//   },
  
//   backButton: {
//     width: '100%',
//     padding: '12px',
//     backgroundColor: 'transparent',
//     color: '#6b7280',
//     border: '1px solid #d1d5db',
//     borderRadius: '8px',
//     fontSize: '16px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.3s',
//     marginTop: '10px',
//   },
  
//   otpHint: {
//     fontSize: '12px',
//     color: '#6b7280',
//     marginTop: '5px',
//   },
  
//   // Progress Steps
//   progressSteps: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: '30px',
//     padding: '20px 0',
//   },
  
//   progressStep: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     transition: 'all 0.3s',
//   },
  
//   progressStepActive: {
//     color: '#1a56db',
//   },
  
//   stepNumber: {
//     width: '30px',
//     height: '30px',
//     borderRadius: '50%',
//     backgroundColor: '#e5e7eb',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '14px',
//     fontWeight: '600',
//     marginBottom: '5px',
//     transition: 'all 0.3s',
//   },
  
//   progressStepActive_stepNumber: {
//     backgroundColor: '#1a56db',
//     color: 'white',
//   },
  
//   stepLabel: {
//     fontSize: '12px',
//     fontWeight: '500',
//   },
  
//   progressLine: {
//     width: '40px',
//     height: '2px',
//     backgroundColor: '#e5e7eb',
//     margin: '0 10px',
//     marginBottom: '15px',
//   },
  
//   adminContact: {
//     textAlign: 'center',
//     marginTop: '25px',
//     color: '#6b7280',
//     fontSize: '14px',
//   },
  
//   contactLink: {
//     color: '#1a56db',
//     textDecoration: 'none',
//     fontWeight: '500',
//   },
  
//   // Responsive styles
//   '@media (max-width: 900px)': {
//     loginContainer: {
//       flexDirection: 'column',
//     },
    
//     brandSection: {
//       padding: '30px 20px',
//     },
    
//     formSection: {
//       padding: '30px 20px',
//     },
    
//     formContainer: {
//       padding: '30px',
//     },
//   },
// };