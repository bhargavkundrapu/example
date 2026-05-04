import { useMemo, useState } from "react";
import {
  BRAND_LOGO_FULL_CLOUDINARY_FALLBACK,
  BRAND_LOGO_FULL_PRIMARY,
  BRAND_LOGO_ICON_CLOUDINARY_FALLBACK,
  BRAND_LOGO_ICON_PRIMARY,
} from "../../constants/brandAssets";

const LOGO_SOURCES = {
  full: [BRAND_LOGO_FULL_PRIMARY, BRAND_LOGO_FULL_CLOUDINARY_FALLBACK],
  icon: [BRAND_LOGO_ICON_PRIMARY, BRAND_LOGO_ICON_CLOUDINARY_FALLBACK],
};

export default function BrandLogo({
  variant = "full",
  alt = "ExpoGraph",
  className = "",
  ...props
}) {
  const sources = useMemo(() => LOGO_SOURCES[variant] || LOGO_SOURCES.full, [variant]);
  const [sourceIndex, setSourceIndex] = useState(0);

  const handleError = () => {
    setSourceIndex((current) => {
      if (current >= sources.length - 1) return current;
      return current + 1;
    });
  };

  const src = sources[sourceIndex];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
