import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, X, Sparkles, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';

export default function CameraScanner({ isOpen, onClose, onScan }) {
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Products list for simulator
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [simWeight, setSimWeight] = useState(1.250);
  const [generatedBarcode, setGeneratedBarcode] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Fetch products to populate simulator dropdown
  useEffect(() => {
    if (isOpen) {
      api.get('/products')
        .then(res => {
          // Keep only active products
          const activeProds = res.data.filter(p => p.isActive);
          setProducts(activeProds);
          // Auto select first weight-based product if available, else first product
          const wb = activeProds.find(p => p.pricingType === 'WEIGHT_BASED');
          setSelectedProduct(wb || activeProds[0] || null);
        })
        .catch(err => {
          console.error('Failed to fetch products for simulator', err);
        });
    }
  }, [isOpen]);

  // Generate simulated barcode when selected product or weight changes
  useEffect(() => {
    if (selectedProduct) {
      const prefix = '20';
      // Normalize product barcode to 4 digits
      let prodCode = selectedProduct.barcode || '1001';
      // Strip non-digits if needed or just use last/first 4 digits
      prodCode = prodCode.replace(/[^0-9]/g, '');
      if (prodCode.length > 4) {
        prodCode = prodCode.slice(-4);
      } else {
        prodCode = prodCode.padStart(4, '0');
      }

      // Convert weight to grams and pad to 5 digits
      const grams = Math.round(simWeight * 1000);
      const weightStr = Math.min(Math.max(grams, 0), 99999).toString().padStart(5, '0');

      // Check digits (dummy placeholders)
      const barcode13 = `${prefix}${prodCode}0${weightStr}0`;
      setGeneratedBarcode(barcode13);
    }
  }, [selectedProduct, simWeight]);

  // Start Camera Feed
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setHasCamera(true);

      // Initialize native BarcodeDetector if supported by the browser
      if ('BarcodeDetector' in window) {
        // Supported
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes('ean_13')) {
          const detector = new window.BarcodeDetector({ formats: ['ean_13'] });
          const scanLoop = async () => {
            if (videoRef.current && streamRef.current && detector) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const val = barcodes[0].rawValue;
                  if (val) {
                    onScan(val);
                    stopCamera();
                    return;
                  }
                }
              } catch (e) {
                // Ignore detector capture frame failures
              }
            }
            animationFrameRef.current = requestAnimationFrame(scanLoop);
          };
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        }
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setHasCamera(false);
      setErrorMsg('Webcam access denied or unavailable. Please use the high-fidelity simulator below.');
    }
  };

  // Stop Camera Feed
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Cleanup camera stream on close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="text-[var(--color-brand-red)]" size={20} />
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight m-0">Scale Label Camera Scanner</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Camera Feed Area */}
          <div className="relative aspect-video w-full max-w-md mx-auto bg-black rounded-lg border border-[var(--color-border-default)] overflow-hidden flex flex-col items-center justify-center">
            {cameraActive ? (
              <>
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                {/* Visual Scanning Guide Overlay */}
                <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-24 border-2 border-dashed border-[var(--color-brand-red)] relative rounded-sm">
                    {/* Pulsing Red Laser Line */}
                    <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_#ff0000] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                {/* Camera Control button */}
                <button
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 btn-secondary btn-sm opacity-80 hover:opacity-100 flex items-center gap-2"
                >
                  <CameraOff size={12} />
                  <span>Disable Feed</span>
                </button>
              </>
            ) : (
              <div className="text-center p-6 space-y-4">
                <CameraOff className="text-[var(--color-text-muted)] mx-auto" size={48} />
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-secondary)] m-0">Camera Feed is Offline</p>
                  {errorMsg && <p className="text-xs text-[var(--color-danger)] mt-2 max-w-xs mx-auto m-0">{errorMsg}</p>}
                </div>
                <button 
                  onClick={startCamera}
                  className="btn-primary btn-sm mx-auto flex items-center gap-2"
                >
                  <Camera size={14} />
                  <span>Enable Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* High Fidelity Simulator Panel */}
          <div className="border border-[var(--color-border-default)] rounded-md bg-[var(--color-surface-raised)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-[var(--color-brand-red)]">
              <Sparkles size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider m-0">Weight Label Simulator</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] m-0 leading-relaxed">
              Use this panel to simulate scale barcode printouts. Generates standard EAN-13 random-weight barcodes.
            </p>

            {products.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic">Loading products...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                    Select Product
                  </label>
                  <select 
                    value={selectedProduct?.id || ''} 
                    onChange={(e) => {
                      const prod = products.find(p => p.id === e.target.value);
                      setSelectedProduct(prod || null);
                    }}
                    className="input py-2 px-3 text-xs w-full font-semibold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pricingType === 'WEIGHT_BASED' ? 'Weight-Based' : 'Fixed'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight Input (Active only for weight-based) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                      Simulated Weight (kg)
                    </label>
                    {selectedProduct?.pricingType !== 'WEIGHT_BASED' && (
                      <span className="text-[9px] font-bold text-[var(--color-danger)] uppercase">Fixed Item</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0.100" 
                      max="4.000" 
                      step="0.005"
                      value={simWeight}
                      disabled={selectedProduct?.pricingType !== 'WEIGHT_BASED'}
                      onChange={(e) => setSimWeight(parseFloat(e.target.value))}
                      className="flex-1 accent-[var(--color-brand-red)] disabled:opacity-30"
                    />
                    <span className="text-sm font-mono font-bold w-16 text-right select-all">
                      {simWeight.toFixed(3)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Barcode Code block */}
            {selectedProduct && (
              <div className="bg-[var(--color-surface-input)] border border-[var(--color-border-default)] p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                    Generated EAN-13 Scale Barcode
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-black text-[var(--color-text-primary)] tracking-widest bg-black/20 py-1 px-2.5 rounded-sm">
                      {generatedBarcode}
                    </span>
                  </div>
                  {/* Explanation block */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[9px] text-[var(--color-text-muted)] font-mono">
                    <span>Prefix: <strong className="text-[var(--color-brand-red)]">20</strong></span>
                    <span>Code: <strong className="text-blue-400">{generatedBarcode.substring(2, 6)}</strong></span>
                    <span>Weight: <strong className="text-emerald-400">{generatedBarcode.substring(7, 12)} g</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onScan(generatedBarcode);
                  }}
                  className="btn-primary w-full md:w-auto px-6 py-2.5 text-xs uppercase flex items-center justify-center gap-2 shadow-lg hover:opacity-95"
                >
                  <Sparkles size={14} />
                  <span>Simulate Scale Scan</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-surface-raised)] flex justify-end">
          <button 
            onClick={onClose}
            className="btn-secondary px-6 text-xs uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
