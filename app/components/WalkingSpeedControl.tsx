import { useCallback } from "react";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import {
  useWalkingSpeed,
  MIN_WALKING_SPEED_MPH,
  MAX_WALKING_SPEED_MPH,
} from "~/lib/walking-speed";

type WalkingSpeedControlProps = {
  className?: string;
};

export function WalkingSpeedControl({ className }: WalkingSpeedControlProps) {
  const [speed, setSpeed] = useWalkingSpeed();

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newSpeed = values[0];
      if (newSpeed !== undefined) {
        setSpeed(newSpeed);
      }
    },
    [setSpeed],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(event.target.value);
      if (Number.isFinite(value)) {
        setSpeed(value);
      }
    },
    [setSpeed],
  );

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <Label htmlFor="walking-speed">Walking Speed</Label>
        <div className="flex items-center gap-2">
          <Input
            id="walking-speed-input"
            type="number"
            value={speed.toFixed(1)}
            onChange={handleInputChange}
            min={MIN_WALKING_SPEED_MPH}
            max={MAX_WALKING_SPEED_MPH}
            step={0.1}
            className="w-16 text-right"
          />
          <span className="text-sm text-muted-foreground">mph</span>
        </div>
      </div>
      <Slider
        id="walking-speed"
        value={[speed]}
        onValueChange={handleSliderChange}
        min={MIN_WALKING_SPEED_MPH}
        max={MAX_WALKING_SPEED_MPH}
        step={0.1}
        className="w-full"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Adjust to recalculate estimated walk times
      </p>
    </div>
  );
}
