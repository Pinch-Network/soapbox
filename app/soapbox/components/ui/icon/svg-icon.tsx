import React from 'react';
import InlineSVG from 'react-inlinesvg'; // eslint-disable-line no-restricted-imports

interface ISvgIcon {
  className?: string,
  alt?: string,
  src: string,
  size?: number,
}

/** Renders an inline SVG with an empty frame loading state */
const SvgIcon: React.FC<ISvgIcon> = ({ src, alt, size = 24, className }): JSX.Element => {
  const loader = (
    <svg
      className={className}
      width={size}
      height={size}
      data-src={src}
      data-testid='svg-icon-loader'
    />
  );

  return (
    <InlineSVG
      className={className}
      src={src}
      title={alt}
      width={size}
      height={size}
      loader={loader}
      data-testid='svg-icon'
    >
      /* If the fetch fails, fall back to displaying the loader */
      {loader}
    </InlineSVG>
  );
};

export default SvgIcon;
