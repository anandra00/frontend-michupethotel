const Card = ({ children, className = '', hoverEffect = false, color = 'bg-white' }) => {
  const baseStyle = `neo-card flex flex-col h-full border-4 border-neo-dark shadow-[4px_4px_0_0_#1E1E1E] ${color}`;
  const hoverStyle = hoverEffect ? 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all' : '';
  
  return (
    <div className={`${baseStyle} ${hoverStyle} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
