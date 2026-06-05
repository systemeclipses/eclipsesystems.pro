type BrandLoaderProps = {
  label?: string;
  fullscreen?: boolean;
};

export default function BrandLoader({ label = 'Loading...', fullscreen = true }: BrandLoaderProps) {
  return (
    <div className={fullscreen ? 'brand-loader-screen' : 'brand-loader-inline'}>
      <div className="brand-progress" role="status" aria-live="polite">
        <div className="brand-progress__bar" />
        <div className="brand-progress__text">{label}</div>
      </div>
    </div>
  );
}
