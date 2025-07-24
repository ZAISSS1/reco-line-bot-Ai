import { useQuery } from "@tanstack/react-query";
import { Users, Key, MessageCircle, Radio } from "lucide-react";

interface Stats {
  activeGroups: number;
  maxGroups: number;
  totalKeywords: number;
  todayReplies: number;
  broadcasts: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary animate-pulse h-full flex items-center">
            <div className="flex items-center w-full">
              <div className="h-6 w-6 bg-gray-600 rounded mr-3"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary h-full flex items-center">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <Users className="text-blue-400" size={24} />
          </div>
          <div className="ml-3">
            <div className="text-xs font-medium text-gray-300">活躍群組</div>
            <div className="text-lg font-semibold text-white">
              {stats?.activeGroups || 0} / {stats?.maxGroups || 20}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary h-full flex items-center">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <Key className="text-green-400" size={24} />
          </div>
          <div className="ml-3">
            <div className="text-xs font-medium text-gray-300">總關鍵字</div>
            <div className="text-lg font-semibold text-white">{stats?.totalKeywords || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary h-full flex items-center">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <MessageCircle className="text-yellow-400" size={24} />
          </div>
          <div className="ml-3">
            <div className="text-xs font-medium text-gray-300">今日回覆</div>
            <div className="text-lg font-semibold text-white">{stats?.todayReplies || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-dark-secondary rounded-lg p-4 border border-dark-tertiary h-full flex items-center">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <Radio className="text-purple-400" size={24} />
          </div>
          <div className="ml-3">
            <div className="text-xs font-medium text-gray-300">推播次數</div>
            <div className="text-lg font-semibold text-white">{stats?.broadcasts || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
