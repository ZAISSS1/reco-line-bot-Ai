import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Plus, X, Copy, RotateCcw, Check, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload";
import type { LineGroup } from "@shared/schema";

interface GroupBroadcast {
  groupId: string;
  groupName: string;
  message: string;
  images: string[];
}

const STORAGE_KEY = 'individual-broadcasts';

export default function BroadcastPanel() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<GroupBroadcast[]>([]);
  const [scheduleType, setScheduleType] = useState("immediate");

  // 載入儲存的推播資料
  useEffect(() => {
    const savedBroadcasts = localStorage.getItem(STORAGE_KEY);
    if (savedBroadcasts) {
      try {
        setBroadcasts(JSON.parse(savedBroadcasts));
      } catch (error) {
        console.error('Failed to load saved broadcasts:', error);
      }
    }
  }, []);

  // 儲存推播資料
  const saveBroadcasts = (newBroadcasts: GroupBroadcast[]) => {
    setBroadcasts(newBroadcasts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBroadcasts));
  };

  const { data: groups = [] } = useQuery<LineGroup[]>({
    queryKey: ["/api/groups"],
  });

  const broadcastMutation = useMutation({
    mutationFn: async (broadcastData: any) => {
      const response = await apiRequest("POST", "/api/broadcast-multiple", broadcastData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // 只在成功發送時才清空，並給用戶選擇
      if (data.totalSent > 0) {
        if (data.testMode) {
          toast({
            title: "測試模式成功",
            description: `已模擬發送至 ${data.totalSent} 個群組。功能驗證完成，可切換到正常模式。`,
          });
        } else {
          toast({
            title: "發送成功",
            description: `已成功發送至 ${data.totalSent} 個群組。設定已保留，可手動清空。`,
          });
        }
      } else {
        // 檢查是否有頻率限制錯誤
        const hasRateLimit = data.results?.some((r: any) => 
          r.error?.includes('429') || r.error?.includes('頻率限制')
        );
        if (hasRateLimit) {
          toast({
            title: "切換測試模式",
            description: "LINE API 暫時限制中，請選擇「測試模式」完成功能驗證。您的設定已保留。",
            variant: "destructive",
          });
        } else {
          toast({
            title: "發送完成",
            description: "發送完成，但可能有錯誤。請檢查錯誤訊息或活動日誌。",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error) => {
      console.error('Broadcast error:', error);
      toast({
        title: "發送失敗",
        description: "推播發送過程中發生錯誤，請檢查網路連線和群組設定",
        variant: "destructive",
      });
    },
  });

  const addBroadcast = () => {
    console.log('Adding broadcast, groups available:', groups.length);
    console.log('Current broadcasts:', broadcasts.length);
    
    const availableGroups = groups.filter((group: LineGroup) => 
      group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
    );
    
    if (groups.length === 0) {
      toast({
        title: "提醒",
        description: "請先在群組管理中添加 LINE 群組",
        variant: "destructive",
      });
      return;
    }
    
    if (availableGroups.length === 0) {
      toast({
        title: "提醒",
        description: "所有可用群組都已添加或沒有活躍群組",
      });
      return;
    }

    const newBroadcast: GroupBroadcast = {
      groupId: "",
      groupName: "",
      message: "",
      images: []
    };
    saveBroadcasts([...broadcasts, newBroadcast]);
  };

  const removeBroadcast = (index: number) => {
    const newBroadcasts = broadcasts.filter((_, i) => i !== index);
    saveBroadcasts(newBroadcasts);
  };

  const updateBroadcast = (index: number, field: keyof GroupBroadcast, value: any) => {
    const newBroadcasts = broadcasts.map((broadcast, i) => {
      if (i === index) {
        if (field === 'groupId') {
          const group = groups.find((g: LineGroup) => g.groupId === value);
          return { 
            ...broadcast, 
            groupId: value,
            groupName: group?.name || ""
          };
        }
        return { ...broadcast, [field]: value };
      }
      return broadcast;
    });
    saveBroadcasts(newBroadcasts);
  };

  const copyMessageToAll = (sourceIndex: number) => {
    const sourceMessage = broadcasts[sourceIndex].message;
    const newBroadcasts = broadcasts.map((broadcast, i) => 
      i !== sourceIndex ? { ...broadcast, message: sourceMessage } : broadcast
    );
    saveBroadcasts(newBroadcasts);
    toast({
      title: "已複製",
      description: "訊息內容已複製到所有其他群組",
    });
  };

  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [selectedGroupsForBatch, setSelectedGroupsForBatch] = useState<string[]>([]);
  const [batchMessage, setBatchMessage] = useState("");

  const addAllGroups = () => {
    const availableGroups = groups.filter((group: LineGroup) => 
      group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
    );
    
    const newBroadcasts = availableGroups.map((group: LineGroup) => ({
      groupId: group.groupId,
      groupName: group.name,
      message: "",
      images: []
    }));
    
    saveBroadcasts([...broadcasts, ...newBroadcasts]);
  };

  const handleBatchAdd = () => {
    setShowBatchAdd(true);
    const availableGroups = groups.filter((group: LineGroup) => 
      group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
    );
    setSelectedGroupsForBatch(availableGroups.map(g => g.groupId));
  };

  const confirmBatchAdd = () => {
    const selectedGroups = groups.filter((group: LineGroup) => 
      selectedGroupsForBatch.includes(group.groupId)
    );
    
    const newBroadcasts = selectedGroups.map((group: LineGroup) => ({
      groupId: group.groupId,
      groupName: group.name,
      message: batchMessage,
      images: []
    }));
    
    saveBroadcasts([...broadcasts, ...newBroadcasts]);
    setShowBatchAdd(false);
    setBatchMessage("");
    setSelectedGroupsForBatch([]);
    
    toast({
      title: "批量新增完成",
      description: `已新增 ${selectedGroups.length} 個群組推播`,
    });
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupsForBatch(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const [sendMode, setSendMode] = useState<"normal" | "test">("normal");

  const handleSendBroadcast = () => {
    const validBroadcasts = broadcasts.filter(b => 
      b.groupId && b.message.trim()
    );

    if (validBroadcasts.length === 0) {
      toast({
        title: "錯誤",
        description: "請至少完成一個群組的推播設定",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      broadcasts: validBroadcasts,
      scheduleType,
      testMode: sendMode === "test"
    });
  };

  const handleReset = () => {
    saveBroadcasts([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "已清空",
      description: "所有個別推播設定已清空",
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    toast({
      title: "已更新",
      description: "正在檢查是否有新的群組可用於推播...",
    });
  };

  const getAvailableGroups = (currentIndex: number) => {
    const usedGroupIds = broadcasts
      .map((b, i) => i !== currentIndex ? b.groupId : null)
      .filter(Boolean);
    
    return groups.filter((group: LineGroup) => 
      group.isActive && !usedGroupIds.includes(group.groupId)
    );
  };

  return (
    <div className="bg-dark-secondary rounded-lg border border-dark-tertiary">
      <div className="px-6 py-4 border-b border-dark-tertiary">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">群組單獨發送</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-8 h-8 p-0 rounded-full bg-white text-black hover:bg-gray-100 border-white"
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={addBroadcast}
              className="w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-none"
            >
              <Plus size={14} />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBatchAdd}
              className="w-8 h-8 p-0 rounded-full bg-purple-500 hover:bg-purple-600 text-white border-none"
            >
              <Users size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {broadcasts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">尚未設定任何推播</p>
            <p className="text-sm text-gray-500 mb-4">
              您可以為不同群組設定不同的訊息和附件
            </p>
            {groups.length === 0 ? (
              <div className="mb-4">
                <p className="text-sm text-yellow-400 mb-2">
                  ⚠️ 請先在左側「群組自動回覆」中添加 LINE 群組
                </p>
              </div>
            ) : (
              <p className="text-sm text-green-400 mb-4">
                ✅ 發現 {groups.filter((g: LineGroup) => g.isActive).length} 個可用群組
              </p>
            )}
            <Button
              type="button"
              onClick={addBroadcast}
              className="w-10 h-10 p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={groups.length === 0}
            >
              <Plus size={20} />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 發送時間選項 */}
            <div className="bg-dark-primary border border-dark-tertiary rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">發送時間</label>
              <RadioGroup value={scheduleType} onValueChange={setScheduleType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="text-sm text-white">立即發送</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="text-sm text-white">預約發送</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 推播設定列表 */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {broadcasts.map((broadcast, index) => (
                <div
                  key={index}
                  className="bg-dark-primary border border-dark-tertiary rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">
                      推播 #{index + 1}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {broadcasts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessageToAll(index)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="複製訊息到所有群組"
                        >
                          <Copy size={14} />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBroadcast(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      目標群組
                    </label>
                    <select
                      value={broadcast.groupId}
                      onChange={(e) => updateBroadcast(index, 'groupId', e.target.value)}
                      className="w-full bg-dark-secondary border border-dark-tertiary rounded-md px-3 py-2 text-white"
                    >
                      <option value="">選擇群組</option>
                      {getAvailableGroups(index).map((group: LineGroup) => (
                        <option key={group.groupId} value={group.groupId}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    {broadcast.groupId && (
                      <p className="text-xs text-green-400">
                        ✓ 已選擇：{broadcast.groupName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      專屬訊息
                    </label>
                    <Textarea
                      placeholder="輸入專屬於此群組的訊息內容..."
                      value={broadcast.message}
                      onChange={(e) => updateBroadcast(index, 'message', e.target.value)}
                      className="bg-dark-secondary border-dark-tertiary text-white h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">
                        專屬附件 (最多10張)
                      </label>
                    </div>
                    <ImageUpload 
                      images={broadcast.images} 
                      onChange={(images) => updateBroadcast(index, 'images', images)}
                      gridCols={2}
                      maxImages={10}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 發送模式選擇 */}
            <div className="flex items-center space-x-4 pt-4 border-t border-dark-tertiary">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">發送模式：</label>
                <select
                  value={sendMode}
                  onChange={(e) => setSendMode(e.target.value as "normal" | "test")}
                  className="bg-dark-secondary border border-dark-tertiary rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="test">測試模式（推薦）</option>
                  <option value="normal">正常模式</option>
                </select>
              </div>
              {sendMode === "test" && (
                <p className="text-xs text-blue-400">
                  ✨ 測試模式會模擬發送並記錄，不會實際發送訊息
                </p>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex space-x-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 border-dark-tertiary text-gray-300"
              >
                <RotateCcw size={16} className="mr-2" />
                重新
              </Button>
              <Button
                type="button"
                onClick={handleSendBroadcast}
                disabled={broadcastMutation.isPending}
                className={`flex-2 ${sendMode === "test" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
                }`}
              >
                <Send size={16} className="mr-2" />
                {broadcastMutation.isPending 
                  ? "發送中..." 
                  : `${sendMode === "test" ? "測試" : "推播"} (${broadcasts.filter(b => b.groupId && b.message.trim()).length}個群組)`
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 批量新增對話框 */}
      <Dialog open={showBatchAdd} onOpenChange={setShowBatchAdd}>
        <DialogContent className="bg-dark-secondary border-dark-tertiary max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">批量新增推播</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 統一訊息設定 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                統一訊息內容（選填）
              </label>
              <Textarea
                placeholder="輸入要套用到所有選中群組的共同訊息..."
                value={batchMessage}
                onChange={(e) => setBatchMessage(e.target.value)}
                className="bg-dark-primary border-dark-tertiary text-white h-20 resize-none"
              />
              <p className="text-xs text-gray-400">
                如果不填寫，每個群組的訊息欄位將為空白，可後續個別編輯
              </p>
            </div>

            {/* 群組選擇 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  選擇要新增的群組 ({selectedGroupsForBatch.length} 個已選擇)
                </label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const availableGroups = groups.filter((group: LineGroup) => 
                        group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
                      );
                      setSelectedGroupsForBatch(availableGroups.map(g => g.groupId));
                    }}
                    className="text-xs border-dark-tertiary text-gray-300"
                  >
                    全選
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroupsForBatch([])}
                    className="text-xs border-dark-tertiary text-gray-300"
                  >
                    清除
                  </Button>
                </div>
              </div>
              
              <div className="bg-dark-primary border border-dark-tertiary rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {groups
                    .filter((group: LineGroup) => 
                      group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
                    )
                    .map((group: LineGroup) => (
                      <div key={group.groupId} className="flex items-center space-x-3 p-2 hover:bg-dark-secondary rounded">
                        <Checkbox
                          id={`batch-${group.groupId}`}
                          checked={selectedGroupsForBatch.includes(group.groupId)}
                          onCheckedChange={() => toggleGroupSelection(group.groupId)}
                        />
                        <label
                          htmlFor={`batch-${group.groupId}`}
                          className="text-sm text-gray-300 cursor-pointer flex-1"
                        >
                          {group.name}
                        </label>
                        {selectedGroupsForBatch.includes(group.groupId) && (
                          <Check size={16} className="text-green-400" />
                        )}
                      </div>
                    ))}
                </div>
                
                {groups.filter((group: LineGroup) => 
                  group.isActive && !broadcasts.some(b => b.groupId === group.groupId)
                ).length === 0 && (
                  <p className="text-center text-gray-400 py-4">
                    所有可用群組都已添加
                  </p>
                )}
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex space-x-3 pt-4 border-t border-dark-tertiary">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBatchAdd(false);
                  setBatchMessage("");
                  setSelectedGroupsForBatch([]);
                }}
                className="flex-1 border-dark-tertiary text-gray-300"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={confirmBatchAdd}
                disabled={selectedGroupsForBatch.length === 0}
                className="flex-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                <Plus size={16} className="mr-2" />
                新增 {selectedGroupsForBatch.length} 個推播
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
