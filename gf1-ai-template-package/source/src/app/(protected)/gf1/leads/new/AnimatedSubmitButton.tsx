"use client";

import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { animate, Timeline, utils } from 'animejs';

export function AnimatedSubmitButton() {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (!pending || !buttonRef.current) return;
    if (isAnimating) return;
    
    setIsAnimating(true);
    const button = buttonRef.current;
    const text = button.querySelector('.text') as HTMLElement;
    const progressBar = button.querySelector('.progress-bar') as HTMLElement;
    const svg = button.querySelector('svg') as SVGElement;
    const checkPath = button.querySelector('.check') as SVGPathElement;
    
    // Calculate path length for checkmark animation
    const pathLength = checkPath.getTotalLength();
    checkPath.style.strokeDasharray = `${pathLength}`;
    checkPath.style.strokeDashoffset = `${pathLength}`;
    
    // Create animation timeline
    const tl = new Timeline({
      defaults: {
        ease: 'inOut(2)'
      },
      onComplete: () => {
        // Reset after animation completes
        setTimeout(() => {
          if (!pending) {
            setIsAnimating(false);
            utils.set(text, { opacity: 1 });
            utils.set(progressBar, { width: 0 });
            utils.set(checkPath, { strokeDashoffset: pathLength });
          }
        }, 500);
      }
    });
    
    // Fade out text
    tl.add(text, {
      opacity: 0,
      duration: 300
    });
    
    // Expand progress bar
    tl.add(progressBar, {
      width: '100%',
      duration: 1000,
      ease: 'inOut(3)'
    }, '-=100');
    
    // Contract to circle
    tl.add(progressBar, {
      width: '80px',
      borderRadius: '50%',
      duration: 500
    });
    
    // Draw checkmark
    tl.add(checkPath, {
      strokeDashoffset: 0,
      duration: 600,
      ease: 'inOut(4)'
    }, '-=200');
    
  }, [pending, isAnimating]);
  
  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={pending}
      id="create-lead-btn"
      style={{
        position: 'relative',
        height: '50px',
        width: '200px',
        textAlign: 'center',
        cursor: pending ? 'not-allowed' : 'pointer',
        borderRadius: '8px',
        background: pending 
          ? 'rgba(99, 173, 242, 0.5)'
          : 'linear-gradient(135deg, var(--brand-blue-light) 0%, var(--brand-blue) 100%)',
        border: 'none',
        padding: 0,
        overflow: 'hidden',
        transition: 'background 0.2s ease',
      }}
    >
      <span 
        className="text"
        style={{
          fontWeight: 600,
          fontSize: '15px',
          color: 'white',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          pointerEvents: 'none',
        }}
      >
        <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
        Create lead
      </span>
      
      <div 
        className="progress-bar"
        style={{
          position: 'absolute',
          height: '10px',
          width: '0',
          right: 0,
          top: '50%',
          left: '50%',
          borderRadius: '200px',
          transform: 'translateY(-50%) translateX(-50%)',
          background: '#71DFBE',
          pointerEvents: 'none',
        }}
      />
      
      <svg 
        x="0px" 
        y="0px" 
        viewBox="0 0 25 30"
        style={{
          width: '30px',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%) translateX(-50%)',
          left: '50%',
          right: 0,
          pointerEvents: 'none',
        }}
      >
        <path 
          className="check" 
          d="M2,19.2C5.9,23.6,9.4,28,9.4,28L23,2"
          style={{
            fill: 'none',
            stroke: '#0b2239',
            strokeWidth: 4,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        />
      </svg>
    </button>
  );
}
