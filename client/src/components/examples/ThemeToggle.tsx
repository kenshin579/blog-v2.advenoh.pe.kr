import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeToggle } from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-8">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
