// Remove the cn function from here
export { cn } from '@/lib/utils'; // ← use shadcn's cn instead

// Keep only themeClasses
export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-[#0D0D0D] dark:bg-[#0D0D0D] light:bg-gray-50',
    surface: 'bg-background dark:bg-background light:bg-white',
    card: 'bg-card dark:bg-card light:bg-white',
    cardHover: 'hover:bg-background dark:hover:bg-background light:hover:bg-gray-50',
  },
  border: {
    default: 'border-border dark:border-border light:border-gray-200',
    light: 'border-border dark:border-border light:border-gray-100',
  },
  text: {
    primary: 'text-foreground dark:text-foreground light:text-gray-900',
    secondary: 'text-muted-foreground dark:text-muted-foreground light:text-gray-600',
    muted: 'text-muted-foreground dark:text-muted-foreground light:text-gray-500',
  },
  input: {
    bg: 'bg-background dark:bg-background light:bg-white',
    border: 'border-border dark:border-border light:border-gray-300',
    text: 'text-foreground dark:text-foreground light:text-gray-900',
    placeholder: 'placeholder:text-muted-foreground dark:placeholder:text-muted-foreground light:placeholder:text-gray-400',
  },
};