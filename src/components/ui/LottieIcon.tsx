import React, { useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

// Import all Lottie JSON assets
import HomeAnimation from '../../assets/icons/Home.json';
import FileAddAnimation from '../../assets/icons/File-Add.json';
import FileAnimation from '../../assets/icons/File.json';
import FileUploadAnimation from '../../assets/icons/File-Upload.json';
import FileDownloadAnimation from '../../assets/icons/File-Download.json';
import SaveAnimation from '../../assets/icons/Save.json';
import SendAnimation from '../../assets/icons/Send.json';
import SettingAnimation from '../../assets/icons/Setting.json';
import ChevronsRightAnimation from '../../assets/icons/Chevrons Right.json';
import BrushAnimation from '../../assets/icons/Brush.json';
import ServerAnimation from '../../assets/icons/Server.json';
import DownloadButtonAnimation from '../../assets/icons/Download_Button.json';
import Disable01Animation from '../../assets/icons/Disable01.json';

export type IconName =
  | 'home'
  | 'file-add'
  | 'file'
  | 'file-upload'
  | 'file-download'
  | 'save'
  | 'send'
  | 'setting'
  | 'chevrons-right'
  | 'brush'
  | 'server'
  | 'download-button'
  | 'disable'
  | 'sparkle';

const animationMap: Record<string, any> = {
  'home': HomeAnimation,
  'file-add': FileAddAnimation,
  'file': FileAnimation,
  'file-upload': FileUploadAnimation,
  'file-download': FileDownloadAnimation,
  'save': SaveAnimation,
  'send': SendAnimation,
  'setting': SettingAnimation,
  'chevrons-right': ChevronsRightAnimation,
  'brush': BrushAnimation,
  'server': ServerAnimation,
  'download-button': DownloadButtonAnimation,
  'disable': Disable01Animation,
};

interface LottieIconProps {
  name: IconName;
  className?: string;
  size?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  playOnHover?: boolean;
  color?: string;
}

export const SparkleIcon: React.FC<{ className?: string; size?: number }> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    <path
      shapeRendering="geometricPrecision"
      d="M9.8132 15.9038L9 18.75L8.1868 15.9038C7.75968 14.4089 6.59112 13.2403 5.09619 12.8132L2.25 12L5.09619 11.1868C6.59113 10.7597 7.75968 9.59112 8.1868 8.09619L9 5.25L9.8132 8.09619C10.2403 9.59113 11.4089 10.7597 12.9038 11.1868L15.75 12L12.9038 12.8132C11.4089 13.2403 10.2403 14.4089 9.8132 15.9038Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.2589 8.71454L18 9.75L17.7411 8.71454C17.4388 7.50533 16.4947 6.56117 15.2855 6.25887L14.25 6L15.2855 5.74113C16.4947 5.43883 17.4388 4.49467 17.7411 3.28546L18 2.25L18.2589 3.28546C18.5612 4.49467 19.5053 5.43883 20.7145 5.74113L21.75 6L20.7145 6.25887C19.5053 6.56117 18.5612 7.50533 18.2589 8.71454Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.8942 20.5673L16.5 21.75L16.1058 20.5673C15.8818 19.8954 15.3546 19.3682 14.6827 19.1442L13.5 18.75L14.6827 18.3558C15.3546 18.1318 15.8818 17.6046 16.1058 16.9327L16.5 15.75L16.8942 16.9327C17.1182 17.6046 17.6454 18.1318 18.3173 18.3558L19.5 18.75L18.3173 19.1442C17.6454 19.3682 17.1182 19.8954 16.8942 20.5673Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LottieIcon: React.FC<LottieIconProps> = ({
  name,
  className = 'w-6 h-6',
  size,
  loop = false,
  autoplay = false,
  playOnHover = true,
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isHovered, setIsHovered] = useState(false);

  if (name === 'sparkle') {
    return <SparkleIcon className={className} size={typeof size === 'number' ? size : undefined} />;
  }

  const animData = animationMap[name];
  if (!animData) {
    return null;
  }

  const handleMouseEnter = () => {
    if (playOnHover && lottieRef.current) {
      setIsHovered(true);
      lottieRef.current.goToAndPlay(0);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animData}
        loop={loop || (isHovered && loop)}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
