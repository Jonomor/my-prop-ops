import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui/button';
import { Eraser, Check } from 'lucide-react';

const SignaturePad = forwardRef(({ onSave, width = 500, height = 200 }, ref) => {
  const sigCanvas = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => sigCanvas.current?.clear(),
    isEmpty: () => sigCanvas.current?.isEmpty(),
    getSignature: () => {
      if (sigCanvas.current?.isEmpty()) return null;
      return sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    }
  }));

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      return;
    }
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onSave?.(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ width: '100%', maxWidth: width }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas rounded-lg',
            style: { width: '100%', height: 'auto', touchAction: 'none' }
          }}
          backgroundColor="white"
          penColor="black"
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Sign above using your mouse or finger
      </p>
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClear}
          className="flex-1"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
        {onSave && (
          <Button 
            type="button" 
            onClick={handleSave}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Signature
          </Button>
        )}
      </div>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
