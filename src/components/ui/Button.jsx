
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "border-4 border-neo-dark font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#4ADE80] text-neo-dark", // Green
    secondary: "bg-neo-yellow text-neo-dark", // Yellow
    danger: "bg-neo-pink text-neo-dark", // Pink/Red
    outline: "bg-white text-neo-dark",
    blue: "bg-[#60A5FA] text-neo-dark" // Blue
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-6 py-2 text-base rounded-xl",
    lg: "px-8 py-3.5 text-lg rounded-xl",
    icon: "w-10 h-10 rounded-lg"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <><span className="neo-spinner"></span> Loading...</>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
