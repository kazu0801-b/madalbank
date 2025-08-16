import Image from 'next/image';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  compact?: boolean;
  bordered?: boolean;
  glass?: boolean;
  image?: string;
  imageAlt?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  compact = false,
  bordered = false,
  glass = false,
  image,
  imageAlt,
  actions,
}) => {
  const baseClasses = 'card bg-base-100 shadow-xl';
  const modifierClasses = [
    compact && 'card-compact',
    bordered && 'card-bordered',
    glass && 'glass',
  ].filter(Boolean).join(' ');

  const cardClasses = `${baseClasses} ${modifierClasses} ${className}`.trim();

  return (
    <div className={cardClasses}>
      {image && (
        <figure>
          <Image src={image} alt={imageAlt || 'Card image'} width={300} height={200} />
        </figure>
      )}
      <div className="card-body">
        {title && (
          <h2 className="card-title">{title}</h2>
        )}
        {children}
        {actions && (
          <div className="card-actions justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};