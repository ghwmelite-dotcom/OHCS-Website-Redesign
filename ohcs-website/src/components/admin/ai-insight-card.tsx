import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiInsightCardProps {
  insight: string;
  severity?: 'info' | 'warning' | 'positive' | 'alert';
  className?: string;
}

const SEVERITY_STYLES = {
  info: 'bg-accent/5 border-accent/20 text-primary-dark',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  positive: 'bg-green-50 border-green-200 text-green-900',
  alert: 'bg-red-50 border-red-200 text-red-900',
};

export function AiInsightCard({ insight, severity = 'info', className }: AiInsightCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 flex items-start gap-3',
        SEVERITY_STYLES[severity],
        className,
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles className="h-4 w-4 text-primary-dark" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
          AI Insight
        </p>
        <p className="text-sm leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
