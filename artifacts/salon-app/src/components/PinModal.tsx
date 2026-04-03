import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Lock, X } from "lucide-react";

interface Props {
  moduleName: string;
  onSuccess: () => void;
  onCancel: () => void;
  correctPin: string;
}

export function PinModal({ moduleName, onSuccess, onCancel, correctPin }: Props) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(false);
    if (v && i < 5) refs[i + 1].current?.focus();
    if (next.every(d => d !== "") && i === 5) {
      const pin = next.join("");
      if (pin === correctPin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(["", "", "", "", "", ""]);
          setError(false);
          refs[0].current?.focus();
        }, 700);
      }
    }
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
    if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length === 6) {
        if (pin === correctPin) onSuccess();
        else {
          setError(true);
          setTimeout(() => { setDigits(["", "", "", "", "", ""]); setError(false); refs[0].current?.focus(); }, 700);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="bg-card rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors hidden">
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-1">Module Locked</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter 6-digit PIN to access <span className="font-semibold text-foreground">{moduleName}</span>
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 bg-muted/30 outline-none transition-all
                ${error ? "border-red-400 bg-red-50 text-red-600" : d ? "border-primary" : "border-border focus:border-primary"}`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-medium mb-3">Incorrect PIN. Try again.</p>}

        <button onClick={onCancel}
          className="w-full mt-2 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
          Go Back
        </button>
      </div>
    </div>
  );
}
