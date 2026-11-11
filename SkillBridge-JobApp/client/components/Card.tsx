import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`
        card
        ${hover ? 'hover:shadow-xl hover:transform hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface DeconstructedCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'red' | 'cyan' | 'yellow' | 'green' | 'blue' | 'dark-blue';
  style?: React.CSSProperties;
}

export const DeconstructedCard: React.FC<DeconstructedCardProps> = ({
  children,
  className = '',
  gradient,
  style
}) => {
  const gradientStyles: Record<string, string> = {
    red: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
    cyan: 'linear-gradient(135deg, #4ecdc4, #7ee8e1)',
    yellow: 'linear-gradient(135deg, #ffd166, #ffe0a3)',
    green: 'linear-gradient(135deg, #06d6a0, #62f7d1)',
    blue: 'linear-gradient(135deg, #118ab2, #5ac8e3)',
    'dark-blue': 'linear-gradient(135deg, #073b4c, #3c7c8c)',
  };

  return (
    <article className={`deconstructed-card ${className}`} style={style}>
      {gradient && (
        <div className="card-layer card-image">
          <div
            className="wave-svg w-full h-full"
            style={{ background: gradientStyles[gradient] }}
          ></div>
        </div>
      )}

      {!gradient && (
        <div className="card-layer card-background">
          <div className="bg-grid">
            <div className="grid-line horizontal" style={{ top: '25%' }}></div>
            <div className="grid-line horizontal" style={{ top: '50%' }}></div>
            <div className="grid-line horizontal" style={{ top: '75%' }}></div>
            <div className="grid-line vertical" style={{ left: '33.33%' }}></div>
            <div className="grid-line vertical" style={{ left: '66.66%' }}></div>
          </div>
          <div className="bg-objects">
            <div className="bg-object circle"></div>
            <div className="bg-object square"></div>
            <div className="bg-object triangle"></div>
          </div>
        </div>
      )}

      <div className="card-layer card-frame">
        <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="w-full h-full">
          <path className="frame-path" d="M 20,20 H 280 V 380 H 20 Z" />
        </svg>
      </div>

      {children}
    </article>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return <h3 className={`text-2xl font-bold ${className}`}>{children}</h3>;
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>{children}</div>;
};
