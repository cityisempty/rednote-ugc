import React, { useState, useEffect, useRef } from 'react';
import { xhsApi } from '../../../api';
import { Loader2, RefreshCw, X, CheckCircle } from 'lucide-react';

interface XhsLoginModalProps {
  onClose: () => void;
  onSuccess: (username?: string) => void;
}

type ModalState = 'checking' | 'already_logged_in' | 'qrcode' | 'expired' | 'error';

const XhsLoginModal: React.FC<XhsLoginModalProps> = ({ onClose, onSuccess }) => {
  const [state, setState] = useState<ModalState>('checking');
  const [qrcode, setQrcode] = useState('');
  const [error, setError] = useState('');
  const [detectedUsername, setDetectedUsername] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: Check if already logged in
  const checkFirst = async () => {
    setState('checking');
    setError('');
    try {
      const res = await xhsApi.checkLogin();
      const data = (res.data as any).data;
      if (data?.logged_in) {
        setDetectedUsername(data.username || '');
        setState('already_logged_in');
        // Auto-callback after a short delay so user sees the "already logged in" state
        setTimeout(() => onSuccess(data.username), 1200);
        return;
      }
      // Not logged in → fetch QR code
      await fetchQrcode();
    } catch {
      // MCP unreachable or error → still try to show QR code
      await fetchQrcode();
    }
  };

  // Step 2: Fetch QR code (only if not logged in)
  const fetchQrcode = async () => {
    setState('checking');
    setError('');
    try {
      const res = await xhsApi.getQrcode();
      setQrcode((res.data as any).data.qrcode);
      setState('qrcode');
      startPolling();
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setState('expired');
      }, 120000);
    } catch {
      setError('获取二维码失败，请检查 MCP 服务是否可用');
      setState('error');
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await xhsApi.checkLogin();
        const data = (res.data as any).data;
        if (data?.logged_in) {
          stopPolling();
          onSuccess(data.username);
        }
      } catch {
        // continue polling
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    checkFirst();
    return () => stopPolling();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">登录小红书</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {state === 'checking' && (
            <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
              <p className="text-sm text-slate-400">检查登录状态...</p>
            </div>
          )}

          {state === 'already_logged_in' && (
            <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium text-green-600">已登录{detectedUsername ? `: ${detectedUsername}` : ''}</p>
              <p className="text-xs text-slate-400">正在跳转...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-500 text-center">{error}</p>
              <button onClick={checkFirst} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 text-sm font-medium hover:bg-rose-100 transition">
                <RefreshCw className="w-4 h-4" /> 重试
              </button>
            </div>
          )}

          {state === 'expired' && (
            <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-slate-500">二维码已过期</p>
              <button onClick={fetchQrcode} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 text-sm font-medium hover:bg-rose-100 transition">
                <RefreshCw className="w-4 h-4" /> 刷新二维码
              </button>
            </div>
          )}

          {state === 'qrcode' && (
            <>
              <img src={qrcode} alt="QR Code" className="w-48 h-48 rounded-xl" />
              <p className="text-sm text-slate-500 text-center">
                打开小红书 App 扫描二维码登录
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default XhsLoginModal;
