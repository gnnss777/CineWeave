import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import micAnimation from '../assets/mic-lottie.json';

export default function LottieMic({ isRecording, size = 88 }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        animationData: micAnimation,
        autoplay: false,
        loop: true,
      });
    }
    return () => {
      if (animRef.current) animRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (!animRef.current) return;
    if (isRecording) {
      animRef.current.play();
    } else {
      animRef.current.goToAndStop(0, true);
    }
  }, [isRecording]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
    />
  );
}
