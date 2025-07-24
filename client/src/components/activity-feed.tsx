import { useQuery } from "@tanstack/react-query";
import { History, MessageCircle, Radio, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { Activity } from "@shared/schema";

export default function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "auto_reply":
        return <MessageCircle className="text-white" size={12} />;
      case "broadcast":
        return <Radio className="text-white" size={12} />;
      case "keyword_update":
        return <Edit className="text-white" size={12} />;
      default:
        return <MessageCircle className="text-white" size={12} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "auto_reply":
        return "bg-green-500";
      case "broadcast":
        return "bg-purple-500";
      case "keyword_update":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary h-full">
        <div className="px-4 py-3 border-b border-dark-tertiary">
          <h2 className="text-sm font-semibold text-white flex items-center">
            <History className="mr-2 text-blue-400" size={16} />
            近期活動
          </h2>
        </div>
        <div className="p-4 h-full overflow-y-auto">
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-600 rounded mb-1"></div>
                  <div className="h-2 bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary rounded-lg border border-dark-tertiary h-full">
      <div className="px-4 py-3 border-b border-dark-tertiary">
        <h2 className="text-sm font-semibold text-white flex items-center">
          <History className="mr-2 text-blue-400" size={16} />
          近期活動
        </h2>
      </div>

      <div className="p-4 h-full overflow-y-auto">
        <div className="space-y-2">
          {activities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-2">
              <div className={`flex-shrink-0 w-6 h-6 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{activity.message}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true,
                    locale: zhTW 
                  })}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-gray-400 py-4 text-xs">
              暫無活動記錄
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
