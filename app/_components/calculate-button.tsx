import { Control, useController } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormValues } from '@/types';

export interface CalculateButtonProps {
  control: Control<FormValues>;
}

export default function CalculateButton({ control }: CalculateButtonProps) {
  const { field: { value: stocks } } = useController({
    control,
    name: 'stocks',
  });
  const totalRatio = stocks.reduce((acc, { ratio }) => acc + (ratio || 0), 0);

  return (
    <Button disabled={totalRatio > 100} type="submit">
      계산
    </Button>
  );
}
