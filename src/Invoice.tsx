import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Copy, Share2, Download, ShieldCheck, CheckCircle2, Calendar, AlertCircle, XCircle, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

export default function Invoice() {
  const { id } = useParams();
  const [trx, setTrx] = useState<any>(null);
  const [settings, setSettings] = useState({ storeName: 'SanzOfficiallID', profilePic: '', sandboxMode: false });
  
  // Track previous status to detect transitions and play sound
  const prevStatusRef = useRef<string | null>(null);

  const playSound = (type: 'success' | 'failed') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  useEffect(() => {
    const fetchTrx = () => {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => {
          if (data.settings) setSettings(data.settings);
          const found = data.transactions.find((t: any) => t.id === id);
          if (found) {
            setTrx(found);
            
            // Play sound if status changed to success/failed
            if (prevStatusRef.current && prevStatusRef.current === 'pending' && found.status !== 'pending') {
               playSound(found.status === 'success' ? 'success' : 'failed');
            }
            prevStatusRef.current = found.status;
          }
        })
        .catch(console.error);
    };

    fetchTrx();
    const interval = setInterval(fetchTrx, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const simulatePaid = async (status: 'success'|'failed' = 'success') => {
    if (!trx) return;
    if (status === 'success') {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominal: trx.total })
      });
    } else {
      // Simulate failed (just for demo, assuming we modify local state or backend)
      setTrx({...trx, status: 'failed'});
      playSound('failed');
      prevStatusRef.current = 'failed';
    }
  };

  if (!trx) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt)' }}>Loading...</div>;
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  }

  const isSuccess = trx.status === 'success';
  const isFailed = trx.status === 'failed';
  const isPending = trx.status === 'pending';
  const downloadStruk = async () => {
    const originalElement = document.getElementById('struk-print-area');
    if (!originalElement) return;
    
    // Clone node to avoid viewport cropping and opacity issues
    const clone = originalElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999'; // Sembunyikan di belakang background layar
    
    document.body.appendChild(clone);
    
    // Beri waktu sebentar agar browser merender elemen baru
    await new Promise(r => setTimeout(r, 100));
    
    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Struk-${trx.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      document.body.removeChild(clone);
    }
  };

  const handleCopyQR = () => {
    if (trx?.qris_string) {
      navigator.clipboard.writeText(trx.qris_string);
      alert('Teks QRIS berhasil disalin!');
    }
  };

  const handleShareQR = () => {
    if (navigator.share && trx) {
      navigator.share({
        title: 'Tagihan Pembayaran QRIS',
        text: `Silakan scan QRIS atau bayar tagihan sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.total)}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert('Browser ini tidak mendukung fitur Share.');
    }
  };

  const handleSimpanQR = async () => {
    const el = document.getElementById('qr-container');
    if (el) {
      try {
        const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
        const link = document.createElement('a');
        link.download = `QRIS-${trx?.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Gagal menyimpan QR', err);
      }
    }
  };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Hidden Struk View for html2canvas */}
      <div style={{ display: 'none' }}>
        <div id="struk-print-area" style={{ width: '450px', background: 'white', border: '1px solid #E5EAE1', padding: '40px', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#141A16' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 800 }}>Buat<span style={{color: '#2563EB'}}>Qris</span></h1>
            <div style={{ fontSize: '13px', color: '#93A093', fontWeight: 700, letterSpacing: '0.05em', marginTop: '4px' }}>STRUK PEMBAYARAN QRIS</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#16A34A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden' }}>
              {settings.profilePic ? <img src={settings.profilePic} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <CheckCircle2 size={32} />}
            </div>
            <div style={{ color: '#16A34A', fontWeight: 800, fontSize: '16px', letterSpacing: '0.02em' }}>PEMBAYARAN BERHASIL</div>
            <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'Plus Jakarta Sans', marginTop: '4px', marginBottom: '8px', letterSpacing: '-0.03em' }}>{formatRupiah(trx.total)}</div>
            <div style={{ fontSize: '20px', color: '#4C5B7A' }}>{settings.storeName}</div>
          </div>

          <div style={{ borderTop: '2px dashed #E5EAE1', margin: '24px 0' }}></div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: '#8494B8', fontSize: '15px', marginBottom: '4px' }}>ID Transaksi</div>
            <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{trx.id}</div>
            
            <div style={{ color: '#8494B8', fontSize: '15px', marginBottom: '4px' }}>Keterangan</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>Pembayaran QRIS</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8494B8' }}>Tanggal</span>
              <span style={{ fontWeight: 700 }}>23 Agu 2026 {trx.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8494B8' }}>Metode Pembayaran</span>
              <span style={{ fontWeight: 700 }}>QRIS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8494B8' }}>Biaya Layanan</span>
              <span style={{ fontWeight: 700 }}>Rp {trx.unique}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8494B8' }}>Status</span>
              <span style={{ fontWeight: 800, color: '#16A34A' }}>BERHASIL</span>
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #E5EAE1', margin: '24px 0' }}></div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Terima kasih telah bertransaksi</div>
            <div style={{ color: '#8494B8', fontSize: '13px' }}>Dibuat via QRISGate · QRISGate.app</div>
          </div>
          
        </div>
      </div>

      {/* Navbar Simple */}
      <nav style={{ background: 'var(--surf)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bdr)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--txt)', margin: 0, fontWeight: 800 }}>Buat<span style={{color: 'var(--acc)'}}>Qris</span></h2>
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--surf2)', color: 'var(--acc)', padding: '6px 16px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--bdr)' }}>
            <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            14:50
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'var(--surf)', width: '100%', maxWidth: '900px', borderRadius: '24px', display: 'flex', overflow: 'hidden', boxShadow: 'var(--scard)', border: '1px solid var(--bdr)' }}>
          
          {/* Left Column */}
          <div style={{ flex: 1, padding: '48px', borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: isPending ? 'flex-start' : 'center' }}>
            
            <div className={!isPending ? 'animate-pop' : ''} style={{ width: '80px', height: '80px', borderRadius: '50%', background: isSuccess ? '#16A34A' : isFailed ? '#DC2626' : 'var(--acc)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: isSuccess ? '0 10px 30px rgba(22, 163, 74, 0.4)' : isFailed ? '0 10px 30px rgba(220, 38, 38, 0.4)' : 'var(--sacc)', transition: 'all 0.3s' }}>
              {isSuccess ? <CheckCircle2 size={40} /> : isFailed ? <XCircle size={40} /> : <Clock size={40} />}
            </div>
            
            <div className={!isPending ? 'animate-pop' : ''} style={{ background: isSuccess ? 'rgba(22, 163, 74, 0.1)' : isFailed ? 'rgba(220, 38, 38, 0.1)' : 'var(--surf2)', color: isSuccess ? '#16A34A' : isFailed ? '#DC2626' : 'var(--acc)', padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '16px', transition: 'all 0.3s' }}>
              • {isSuccess ? 'PEMBAYARAN BERHASIL' : isFailed ? 'PEMBAYARAN GAGAL' : 'MENUNGGU PEMBAYARAN'}
            </div>

            <h1 className={!isPending ? 'animate-pop' : ''} style={{ fontSize: '28px', color: 'var(--txt)', marginBottom: '8px', fontWeight: 800, transition: 'all 0.3s' }}>
              {isSuccess ? 'Pembayaran Berhasil!' : isFailed ? 'Pembayaran Gagal / Kadaluarsa!' : 'Menunggu Pembayaran'}
            </h1>
            
            <p className={!isPending ? 'animate-pop' : ''} style={{ color: 'var(--txt2)', fontSize: '15px', marginBottom: '32px', transition: 'all 0.3s' }}>
              {isSuccess ? 'Terima kasih, pembayaran Anda telah berhasil diterima.' : isFailed ? 'Maaf, pembayaran Anda tidak dapat diproses atau kadaluarsa.' : 'Scan QRIS di bawah untuk menyelesaikan pembayaran.'}
            </p>

            {/* ONLY SHOW QR CODE IF PENDING */}
            {isPending && (
              <>
                <div id="qr-container" style={{ background: 'white', padding: '16px', borderRadius: '24px', border: '1px solid var(--bdr)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '252px', height: '252px' }}>
                  <div style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTop: '4px solid var(--acc)', borderLeft: '4px solid var(--acc)', borderRadius: '6px 0 0 0' }}></div>
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTop: '4px solid var(--acc)', borderRight: '4px solid var(--acc)', borderRadius: '0 6px 0 0' }}></div>
                  <div style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottom: '4px solid var(--acc)', borderLeft: '4px solid var(--acc)', borderRadius: '0 0 0 6px' }}></div>
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottom: '4px solid var(--acc)', borderRight: '4px solid var(--acc)', borderRadius: '0 0 6px 0' }}></div>
                  
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--bdr)', fontWeight: 800, fontSize: '14px', letterSpacing: '0.2em', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}>MODE TEST</div>
                  
                  <style>{`
                    @keyframes scanline {
                      0% { top: 8%; opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { top: 92%; opacity: 0; }
                    }
                  `}</style>
                  
                  <div style={{ position: 'absolute', width: '90%', height: '3px', background: 'var(--acc)', left: '5%', borderRadius: '50%', boxShadow: '0 0 15px 3px var(--acc)', zIndex: 10, animation: 'scanline 2.5s infinite linear', pointerEvents: 'none' }}></div>
                  
                  <div style={{ padding: '8px', zIndex: 1 }}>
                    <QRCodeSVG value={trx.qris_string} size={220} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                  <button onClick={handleCopyQR} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid var(--bdr)', padding: '12px', borderRadius: '999px', color: 'var(--txt)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Copy size={16} /> Salin</button>
                  <button onClick={handleShareQR} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid var(--bdr)', padding: '12px', borderRadius: '999px', color: 'var(--txt)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Share2 size={16} /> Bagikan</button>
                  <button onClick={handleSimpanQR} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid var(--bdr)', padding: '12px', borderRadius: '999px', color: 'var(--txt)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Download size={16} /> Simpan</button>
                </div>
              </>
            )}
          </div>

          {/* Right Column */}
          <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', background: 'var(--surf)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surf2)', padding: '6px 16px', borderRadius: '999px', border: '1px solid var(--bdr)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--acc)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {settings.profilePic ? <img src={settings.profilePic} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <ShieldCheck size={12} />}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--txt)', fontSize: '14px' }}>{settings.storeName}</span>
                <CheckCircle2 size={16} color="var(--acc)" />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '42px', fontWeight: 800, color: 'var(--txt)', letterSpacing: '-0.03em', marginBottom: '8px' }}>{formatRupiah(trx.total)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt2)', fontSize: '14px' }}>
                <Receipt size={16} /> Pembayaran via <b>QRIS</b>
              </div>
              <div style={{ color: 'var(--txt3)', fontSize: '13px', marginLeft: '24px' }}>Pembayaran QRIS</div>
            </div>

            <div style={{ background: 'var(--surf2)', borderRadius: '16px', padding: '20px', border: '1px solid var(--bdr)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed var(--bdr)', paddingBottom: '16px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Rincian Pembayaran</span>
                <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>Total Dibayar <b style={{ color: 'var(--acc)', fontSize: '15px' }}>{formatRupiah(trx.total)}</b></span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--txt2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> ID Transaksi</span>
                  <span className="font-mono">{trx.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Nominal</span>
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--txt)' }}>{formatRupiah(trx.nominal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={16} /> Biaya Layanan</span>
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--txt)' }}>+ Rp {trx.unique}</span>
                </div>
              </div>
            </div>

            {!isPending && (
              <div className="animate-pop" style={{ background: isSuccess ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: isSuccess ? '#16A34A' : '#DC2626', border: `1px solid ${isSuccess ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`, borderRadius: '12px', padding: '12px 16px', fontSize: '13px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {isSuccess ? 'Pembayaran berhasil! Halaman ini bisa ditutup.' : 'Pembayaran gagal. Silakan buat tagihan baru.'}
              </div>
            )}

            <div style={{ background: 'var(--surf2)', borderRadius: '16px', padding: '16px 20px', border: '1px solid var(--bdr)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid var(--bdr)' }}>
                <Calendar size={20} color="var(--txt2)" />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 700, letterSpacing: '0.05em' }}>WAKTU</div>
                <div style={{ fontWeight: 700, color: 'var(--txt)', fontSize: '15px' }}>23 Agu 2026 {trx.time}</div>
              </div>
            </div>

            {isPending && settings?.sandboxMode && (
              <div style={{ border: '1px dashed var(--acc)', background: 'var(--surf2)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--txt)', marginBottom: '8px', fontSize: '14px' }}>
                  <AlertCircle size={16} /> Mode Test (Sandbox)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => simulatePaid('success')} style={{ flex: 1, background: 'var(--acc)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: 'var(--sacc)' }}>
                    Sukses (Test)
                  </button>
                  <button onClick={() => simulatePaid('failed')} style={{ flex: 1, background: 'transparent', color: '#DC2626', border: '1px solid #DC2626', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Gagal (Test)
                  </button>
                </div>
              </div>
            )}

            {!isPending ? (
              <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleShareQR} style={{ flex: 1, background: 'white', border: '1px solid var(--bdr)', padding: '14px', borderRadius: '12px', color: 'var(--txt)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Share2 size={18} /> Bagikan
                  </button>
                  <button onClick={downloadStruk} style={{ flex: 1, background: '#16A34A', border: 'none', padding: '14px', borderRadius: '12px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)' }}>
                    <Download size={18} /> Download Struk
                  </button>
                </div>
                <button style={{ width: '100%', background: isSuccess ? 'rgba(37, 99, 235, 0.5)' : 'var(--surf2)', color: isSuccess ? 'white' : 'var(--txt2)', padding: '16px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSuccess ? <><CheckCircle2 size={18} /> Pembayaran Berhasil</> : <><XCircle size={18} /> Pembayaran Gagal</>}
                </button>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  const target = e.currentTarget;
                  const originalText = target.innerText;
                  target.innerText = 'Mengecek...';
                  fetch('/api/dashboard')
                    .then(res => res.json())
                    .then(data => {
                      const found = data.transactions.find((t: any) => t.id === id);
                      if (found) setTrx(found);
                      setTimeout(() => { target.innerText = originalText; }, 500);
                    });
                }}
                style={{ width: '100%', background: 'var(--acc)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s' }}
              >
                Cek Status Pembayaran
              </button>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>● Status diperbarui otomatis setiap beberapa detik</div>
          </div>
        </div>
      </main>
    </div>
  );
}
