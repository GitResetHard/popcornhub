import { Progress } from '@/components/ui/progress';

/** Level chip with a progress bar toward the next threshold. */
export function LevelProgress({ level, points, nextLevelAt }: { level: number; points: number; nextLevelAt: number | null }) {
    const percent = nextLevelAt && nextLevelAt > 0 ? Math.min(100, Math.round((points / nextLevelAt) * 100)) : 100;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Level {level}</span>
                <span className="text-muted-foreground tabular-nums">
                    {points.toLocaleString()}
                    {nextLevelAt ? ` / ${nextLevelAt.toLocaleString()} XP` : ' XP'}
                </span>
            </div>
            <Progress value={percent} color="primary" />
        </div>
    );
}
