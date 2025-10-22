import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 h-64 p-6">
      <CardContent>
        {icon && <div className="mb-4">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}