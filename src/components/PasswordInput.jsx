import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`form-control password-input ${className}`.trim()}
      />
      <button
        type="button"
        className="password-visibility-button"
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        aria-pressed={visible}
        onClick={() => setVisible(current => !current)}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
