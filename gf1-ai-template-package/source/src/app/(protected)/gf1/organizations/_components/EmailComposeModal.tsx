'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './EmailComposeModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialTo: string;
  initialSubject?: string;
  initialBody?: string;
  returnPath: string;
  isConnected: boolean;
};

export function EmailComposeModal({
  isOpen,
  onClose,
  initialTo,
  initialSubject = '',
  initialBody = '',
  returnPath,
  isConnected,
}: Props) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [connected, setConnected] = useState(isConnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBody(initialBody);
      setResult(null);
      setErrorMsg('');
      setConnectionError('');
      setConnected(isConnected);
      setIsConnecting(false);
      setIsChecking(false);
      setSending(false);
      setTimeout(() => bodyRef.current?.focus(), 50);
    }
  }, [isOpen, initialTo, initialSubject, initialBody, isConnected]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const checkConnection = async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/microsoft/connection-status', { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.connected) {
        setConnected(true);
        setConnectionError('');
        return true;
      } else {
        setConnected(false);
        setConnectionError(
          data?.reason === 'expired'
            ? 'Outlook session expired. Reconnect to continue.'
            : 'Outlook is not connected.'
        );
        return false;
      }
    } catch {
      setConnectionError('Unable to verify Outlook connection.');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('ms_auth');
    const authReason = params.get('ms_reason');
    if (authStatus) {
      if (authStatus === 'error') {
        const reasonText =
          authReason === 'auth_url'
            ? 'Azure auth settings are missing or invalid. Check production env vars.'
            : 'Outlook connection failed. Check Azure config and try again.';
        setConnectionError(reasonText);
        setConnected(false);
      } else if (authStatus === 'success') {
        checkConnection();
      }
      params.delete('ms_auth');
      params.delete('ms_reason');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; status?: string; reason?: string };
      if (data?.type !== 'ms_auth') return;
      setIsConnecting(false);
      if (data.status === 'success') {
        checkConnection();
      } else {
        setConnected(false);
        setConnectionError(
          data.reason === 'auth_url'
            ? 'Azure auth settings are missing or invalid. Check production env vars.'
            : 'Outlook connection failed. Check Azure config and try again.'
        );
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handleConnect = () => {
    setConnectionError('');
    setIsConnecting(true);
    const url = `/api/auth/azure?return=${encodeURIComponent(returnPath)}&popup=1`;
    const popup = window.open(url, 'ms-auth', 'width=520,height=720,noopener,noreferrer');
    if (!popup) {
      setIsConnecting(false);
      setConnectionError('Popup blocked. Allow popups and try again.');
      return;
    }
    if (pollRef.current) window.clearInterval(pollRef.current);
    const startedAt = Date.now();
    pollRef.current = window.setInterval(() => {
      if (Date.now() - startedAt > 30000) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setIsConnecting(false);
        return;
      }
      checkConnection().then((ok) => {
        if (ok) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          setIsConnecting(false);
        }
      });
    }, 1500);
  };

  const handleSend = async () => {
    if (!to || !subject || !body.trim()) return;
    if (!connected) {
      setConnectionError('Connect Outlook before sending.');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/microsoft/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult('success');
        setTimeout(onClose, 1500);
      } else if (data.error === 'not_connected' || data.error === 'token_expired') {
        setConnected(false);
        setConnectionError('Outlook session expired. Reconnect to continue.');
      } else {
        setResult('error');
        setErrorMsg(data.error ?? 'Unknown error');
      }
    } catch {
      setResult('error');
      setErrorMsg('Network error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>New Email</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">x</button>
        </div>

        {result === 'success' ? (
          <div className={styles.successMessage}>Email sent successfully.</div>
        ) : (
          <>
            {!connected && (
              <div className={styles.notConnected}>
                <p>Your Outlook account is not connected or the session has expired.</p>
                {connectionError && <p className={styles.errorMessage}>{connectionError}</p>}
                <div className={styles.actions}>
                  <button
                    className={styles.connectButton}
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Outlook Account'}
                  </button>
                  <button
                    className={styles.cancelButton}
                    type="button"
                    onClick={checkConnection}
                    disabled={isChecking}
                  >
                    {isChecking ? 'Checking...' : 'Check Connection'}
                  </button>
                  <a
                    className={styles.connectButton}
                    href={`/api/auth/azure?return=${encodeURIComponent(returnPath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}
            <div className={styles.fields}>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>To</label>
                <input
                  className={styles.fieldInput}
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Subject</label>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                />
              </div>
              <textarea
                ref={bodyRef}
                className={styles.bodyField}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                disabled={sending}
                rows={10}
              />
            </div>
            {result === 'error' && (
              <div className={styles.errorMessage}>{errorMsg || 'Failed to send email.'}</div>
            )}
            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={sending || !to || !subject || !body.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


