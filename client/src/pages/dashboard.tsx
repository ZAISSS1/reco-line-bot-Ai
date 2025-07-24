import { LineChart } from "lucide-react";
import StatsOverview from "@/components/stats-overview";
import GroupManagement from "@/components/group-management";
import BroadcastPanel from "@/components/broadcast-panel";
import ActivityFeed from "@/components/activity-feed";
import SettingsDialog from "@/components/settings-dialog";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-dark-primary text-white">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-tertiary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <SettingsDialog />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <LineChart className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-white">聯能永續 LINE Bot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  已連線
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview and Activity Feed */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6 h-32">
          <div className="flex-1">
            <StatsOverview />
          </div>
          <div className="lg:w-96">
            <ActivityFeed />
          </div>
        </div>

        {/* Main Management Area - 左右各一半 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：群組管理 */}
          <div>
            <GroupManagement />
          </div>

          {/* 右側：個別推播 */}
          <div>
            <BroadcastPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
