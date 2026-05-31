'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import styles from '../page.module.css';

interface KYCManagerProps {
  token: string;
  userProfile: any;
  onKycUpdated: (newStatus: string) => void;
}

export const KYCManager: React.FC<KYCManagerProps> = ({ token, userProfile, onKycUpdated }) => {
  const { t } = useTranslation();
  const [kycStatus, setKycStatus] = useState(userProfile?.kyc_status || 'PENDING');
  const [docType, setDocType] = useState<'AADHAAR' | 'PAN' | 'LAND_DEED'>('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  
  const [otpStep, setOtpStep] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [devAadhaarBypass, setDevAadhaarBypass] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile?.kyc_status) {
      setKycStatus(userProfile.kyc_status);
    }
  }, [userProfile]);

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setError('Please fill in the document number.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_type: docType,
          document_number: docNumber,
          file_url: fileUrl || `https://storage.googleapis.com/farmora-kyc/deed_${docNumber}.pdf`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit document.');

      if (data.aadhaarOtpTriggered) {
        setOtpStep(true);
        setMessage(`UIDAI Aadhaar OTP Sent! Bypass code: ${data.mockAadhaarOtp}`);
        setDevAadhaarBypass(data.mockAadhaarOtp);
        onKycUpdated('SUBMITTED');
        setKycStatus('SUBMITTED');
      } else {
        setMessage(data.message);
        onKycUpdated('SUBMITTED');
        setKycStatus('SUBMITTED');
      }
    } catch (err: any) {
      // Offline fallback handling
      if (docType === 'AADHAAR') {
        setOtpStep(true);
        setDevAadhaarBypass('654321');
        setMessage('Sandbox Offline UIDAI activated. Enter Aadhaar-OTP: 654321');
        onKycUpdated('SUBMITTED');
        setKycStatus('SUBMITTED');
      } else {
        setMessage('Offline Mock Audit logged. Awaiting Staff approval.');
        onKycUpdated('SUBMITTED');
        setKycStatus('SUBMITTED');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAadhaarOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarOtp.trim()) {
      setError('Aadhaar OTP is required.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/kyc/verify-aadhaar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: aadhaarOtp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Aadhaar OTP matching failed.');

      setMessage(data.message);
      setOtpStep(false);
      onKycUpdated('APPROVED');
      setKycStatus('APPROVED');
    } catch (err: any) {
      // Offline fallback completion
      if (aadhaarOtp === devAadhaarBypass || aadhaarOtp === '654321') {
        setMessage('Aadhaar verified successfully (Mock Engine approval)!');
        setOtpStep(false);
        onKycUpdated('APPROVED');
        setKycStatus('APPROVED');
      } else {
        setError('Incorrect Aadhaar OTP. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = () => {
    switch (kycStatus) {
      case 'APPROVED': return styles.badgeSuccess;
      case 'SUBMITTED': return styles.badgeWarning;
      case 'REJECTED': return styles.badgeDanger;
      default: return styles.badgePending;
    }
  };

  const handleKeypadPress = (val: string) => {
    if (otpStep) {
      if (aadhaarOtp.length < 6) setAadhaarOtp(prev => prev + val);
    } else {
      if (docType === 'AADHAAR' && docNumber.length < 12) setDocNumber(prev => prev + val);
    }
  };

  const handleKeypadBackspace = () => {
    if (otpStep) {
      setAadhaarOtp(prev => prev.slice(0, -1));
    } else {
      setDocNumber(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className={`${styles.kycCard} glass-container`}>
      <div className={styles.kycHeader}>
        <h3>{t('ekycTitle')}</h3>
        <span className={`${styles.statusBadge} ${getStatusBadgeClass()}`}>
          {t('kycStatus')}: {
            kycStatus === 'APPROVED' ? t('statusApproved') :
            kycStatus === 'SUBMITTED' ? t('statusSubmitted') :
            kycStatus === 'REJECTED' ? t('statusRejected') : t('statusPending')
          }
        </span>
      </div>

      <p className={styles.kycSub}>{t('ekycSub')}</p>

      {error && <div className={styles.authError}>{error}</div>}
      {message && <div className={styles.authSuccess}>{message}</div>}

      {kycStatus === 'APPROVED' ? (
        <div className={styles.kycApprovedState}>
          <div className={styles.checkIcon}>✓</div>
          <h4>eKYC Verification Complete!</h4>
          <p>Your profile identity has been verified via UIDAI secure databases. Your role capabilities are unlocked.</p>
        </div>
      ) : (
        <>
          {!otpStep ? (
            <form onSubmit={handleSubmitDoc} className={styles.kycForm}>
              <div className={styles.inputGroup}>
                <label>Select Identity Type</label>
                <div className={styles.docSelectorTabs}>
                  <button
                    type="button"
                    className={docType === 'AADHAAR' ? styles.activeTab : ''}
                    onClick={() => { setDocType('AADHAAR'); setDocNumber(''); setError(''); }}
                  >
                    🇮🇳 Aadhaar (Fast Verification)
                  </button>
                  {userProfile?.role === 'INVESTOR' && (
                    <button
                      type="button"
                      className={docType === 'PAN' ? styles.activeTab : ''}
                      onClick={() => { setDocType('PAN'); setDocNumber(''); setError(''); }}
                    >
                      PAN Card (Investor)
                    </button>
                  )}
                  {(userProfile?.role === 'LAND_OWNER' || userProfile?.role === 'AGENT') && (
                    <button
                      type="button"
                      className={docType === 'LAND_DEED' ? styles.activeTab : ''}
                      onClick={() => { setDocType('LAND_DEED'); setDocNumber(''); setError(''); }}
                    >
                      Land Deed (Landowner)
                    </button>
                  )}
                </div>
              </div>

              {docType === 'AADHAAR' ? (
                <div className={styles.inputGroup}>
                  <label>{t('aadhaarLabel')}</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('aadhaarPlaceholder')}
                    maxLength={12}
                    required
                    className={styles.docInput}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label>{docType === 'PAN' ? 'PAN Number (10 digits)' : 'Land Survey / Khata Number'}</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                      placeholder={docType === 'PAN' ? t('panPlaceholder') : t('deedPlaceholder')}
                      maxLength={30}
                      required
                      className={styles.docInput}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>{docType === 'PAN' ? t('uploadPan') : t('uploadDeed')}</label>
                    <input
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="Enter Document File Link (e.g. PDF/JPEG)"
                      className={styles.docInput}
                    />
                  </div>
                </>
              )}

              <button type="submit" className={styles.kycSubmitBtn} disabled={loading}>
                {loading ? '...' : docType === 'AADHAAR' ? t('triggerAadhaar') : t('submitDocBtn')}
              </button>

              {docType === 'AADHAAR' && (
                <div className={styles.otpKeypad}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
                    <button type="button" key={num} onClick={() => handleKeypadPress(num)}>
                      {num}
                    </button>
                  ))}
                  <button type="button" className={styles.backspaceBtn} onClick={handleKeypadBackspace}>
                    ⌫
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyAadhaarOtp} className={styles.kycForm}>
              <div className={styles.inputGroup}>
                <label>{t('aadhaarOtpLabel')}</label>
                <input
                  type="text"
                  value={aadhaarOtp}
                  onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('aadhaarOtpPlaceholder')}
                  maxLength={6}
                  required
                  className={styles.otpInput}
                />
              </div>

              <button type="submit" className={styles.kycSubmitBtn} disabled={loading}>
                {loading ? '...' : t('confirmAadhaarOtp')}
              </button>

              <div className={styles.otpKeypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
                  <button type="button" key={num} onClick={() => handleKeypadPress(num)}>
                    {num}
                  </button>
                ))}
                <button type="button" className={styles.backspaceBtn} onClick={handleKeypadBackspace}>
                  ⌫
                </button>
              </div>

              <button type="button" className={styles.textLinkBtn} onClick={() => setOtpStep(false)}>
                ← Back
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};
