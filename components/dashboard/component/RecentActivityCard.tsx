import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { format, parseISO, isToday, isYesterday, differenceInCalendarDays } from "date-fns";

interface Activity {
  date: string;
  activity: string;
  accuracy: number;
  type: string;
}

export default function RecentActivityCard({ recentActivity }: { recentActivity: Activity[] }) {
  // Sort activities by date descending
  const sortedActivities = [...recentActivity].sort((a, b) => b.date.localeCompare(a.date));

  // Group by unique dates
  const uniqueDays: { date: string; activity: string; accuracy: number }[] = [];
  for (const item of sortedActivities) {
    if (!uniqueDays.some(day => day.date === item.date)) {
      uniqueDays.push({
        date: item.date,
        activity: item.activity,
        accuracy: item.accuracy,
      });
    }
    if (uniqueDays.length === 3) break; // only last 3 days
  }

  // Format date nicely
  const getFriendlyDate = (dateStr: string) => {
    const dateObj = parseISO(dateStr);
    if (isToday(dateObj)) return "Today";
    if (isYesterday(dateObj)) return "Yesterday";
    const daysAgo = differenceInCalendarDays(new Date(), dateObj);
    return daysAgo > 0 ? `${daysAgo} days ago` : format(dateObj, "MMM d, yyyy");
  };

  return (
    <CardContent>
      <div className="space-y-4">
        {uniqueDays.length > 0 ? (
          uniqueDays.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-900">{item.activity}</p>
                <p className="text-sm text-gray-500">{getFriendlyDate(item.date)}</p>
              </div>
              <Badge variant="outline">{item.accuracy}% accuracy</Badge>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-600">
            <p className="text-lg font-medium">
              You haven’t started practicing yet.
            </p>
            <p className="text-sm text-gray-500">
              Begin a conversation with our AI and improve your skills!
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );
}
