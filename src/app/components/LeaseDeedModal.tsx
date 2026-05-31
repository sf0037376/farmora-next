'use client';

import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import styles from '../page.module.css';

interface LeaseDeedModalProps {
  isOpen: boolean;
  landListing: any;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaseDeedModal: React.FC<LeaseDeedModalProps> = ({ isOpen, landListing, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !landListing) return null;

  // Resolve dynamic local tenancy law recommendation based on location text
  const location = landListing.location.toLowerCase();
  let localTenancyAdvice = '';
  let localRevenueDocs = '';

  if (location.includes('telangana') || location.includes('hyderabad')) {
    localTenancyAdvice = t('adviceTelangana');
    localRevenueDocs = t('docsTelangana');
  } else if (location.includes('maharashtra') || location.includes('mumbai') || location.includes('pune')) {
    localTenancyAdvice = t('adviceMaharashtra');
    localRevenueDocs = t('docsMaharashtra');
  } else if (location.includes('karnataka') || location.includes('bangalore') || location.includes('mysore')) {
    localTenancyAdvice = t('adviceKarnataka');
    localRevenueDocs = t('docsKarnataka');
  } else if (location.includes('tamil') || location.includes('chennai') || location.includes('coimbatore')) {
    localTenancyAdvice = t('adviceTamilNadu');
    localRevenueDocs = t('docsTamilNadu');
  } else {
    localTenancyAdvice = t('adviceGeneral');
    localRevenueDocs = t('docsGeneral');
  }

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    setTimeout(() => {
      onConfirm();
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className={styles.authModalOverlay}>
      <div className={`${styles.authModalCard} glass-container ${styles.responsiveLegalModal}`} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.authModalHeader}>
          <h3>📜 {t('leaseAdvisoryTitle')}</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.legalListingBrief} style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <strong style={{ color: 'var(--primary-light)', fontSize: '1.05rem', display: 'block' }}>{landListing.title}</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            📍 Location: {landListing.location} | 📐 Size: {landListing.size_acres} Acres | 💰 Rent: ₹{parseFloat(landListing.lease_price_yearly).toLocaleString()}/year
          </span>
        </div>

        {/* Legal Advisory Body */}
        <div className={styles.legalInfoBody} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Section 1: Property Proof */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem', marginBottom: '0.5rem' }}>🏡 {t('ownershipProofTitle')}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {t('ownershipProofIntro')}
            </p>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.6' }}>
              <li><strong>{t('ownershipDeedLabel')}:</strong> {t('ownershipDeedDesc')}</li>
              <li><strong>{t('revenueRecordsLabel')}:</strong> <span style={{ color: 'var(--accent-gold)' }}>{localRevenueDocs}</span></li>
              <li><strong>{t('ecLabel')}:</strong> {t('ecDesc')}</li>
            </ul>
          </div>

          {/* Section 2: Standard Deed Clauses */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem', marginBottom: '0.5rem' }}>📝 {t('deedTitle')}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {t('deedIntro')}
            </p>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.6' }}>
              <li><strong>{t('boundariesLabel')}</strong></li>
              <li><strong>{t('tenureLabel')}</strong></li>
              <li><strong>{t('rentTermsLabel')}</strong></li>
              <li><strong>{t('indemnityLabel')}</strong></li>
            </ul>
          </div>

          {/* Section 3: Identity Verification */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', fontSize: '1rem', marginBottom: '0.5rem' }}>🪪 {t('idProofTitle')}</h4>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <li><strong>{t('govtIdLabel')}</strong></li>
              <li><strong>{t('photosLabel')}</strong></li>
            </ul>
          </div>

          {/* State Specific tenancies */}
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--accent-gold)', padding: '1rem', borderRadius: '4px' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.3rem' }}>
              ⚖️ {t('legalAdvisoryLoc')}
            </strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {localTenancyAdvice}
            </p>
          </div>
        </div>

        {/* Confirmation check form */}
        <form onSubmit={handleConfirmSubmit} style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'start', gap: '0.8rem', cursor: 'pointer', textAlign: 'left', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {t('acknowledgementText')}
            </span>
          </label>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className={styles.secondaryCta} onClick={onClose} style={{ flex: 1 }}>
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className={styles.primaryCta}
              disabled={!agreed || submitting}
              style={{ flex: 2, padding: '0.8rem 1.5rem', background: agreed ? 'var(--primary)' : 'rgba(16, 185, 129, 0.2)' }}
            >
              {submitting ? '...' : t('confirmLeaseInquiry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
