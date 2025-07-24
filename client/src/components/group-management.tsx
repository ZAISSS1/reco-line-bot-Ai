import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Edit, RotateCcw, Save, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload";
import AddGroupDialog from "@/components/add-group-dialog";
import type { LineGroup, Keyword } from "@shared/schema";

export default function GroupManagement() {
  const { toast } = useToast();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [keywordForm, setKeywordForm] = useState({
    keyword: "",
    responseText: "",
    images: [] as string[]
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<LineGroup[]>({
    queryKey: ["/api/groups"],
  });

  const { data: keywords = [] } = useQuery<Keyword[]>({
    queryKey: ["/api/groups", expandedGroup, "keywords"],
    enabled: !!expandedGroup,
  });

  const { data: allKeywords = [] } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
    queryFn: async () => {
      const response = await fetch("/api/keywords");
      return response.json();
    }
  });

  const createKeywordMutation = useMutation({
    mutationFn: async (keywordData: any) => {
      const response = await apiRequest("POST", "/api/keywords", keywordData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setKeywordForm({ keyword: "", responseText: "", images: [] });
      toast({
        title: "成功",
        description: "關鍵字已儲存",
      });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "儲存關鍵字失敗",
        variant: "destructive",
      });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (keywordId: number) => {
      const response = await apiRequest("DELETE", `/api/keywords/${keywordId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "成功",
        description: "關鍵字已刪除",
      });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "刪除關鍵字失敗",
        variant: "destructive",
      });
    },
  });

  const handleSaveKeyword = () => {
    if (!expandedGroup || !keywordForm.keyword.trim()) return;

    createKeywordMutation.mutate({
      groupId: expandedGroup,
      keyword: keywordForm.keyword,
      responseText: keywordForm.responseText,
      images: keywordForm.images,
    });
  };

  const handleResetForm = () => {
    setKeywordForm({ keyword: "", responseText: "", images: [] });
  };

  const handleImagesChange = (images: string[]) => {
    setKeywordForm(prev => ({ ...prev, images }));
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    toast({
      title: "已更新",
      description: "正在檢查是否有新的群組加入...",
    });
  };

  if (groupsLoading) {
    return (
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary rounded-lg border border-dark-tertiary">
      <div className="px-6 py-4 border-b border-dark-tertiary">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">群組自動回覆</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-8 h-8 p-0 rounded-full bg-white text-black hover:bg-gray-100 border-white"
            >
              <RefreshCw size={14} />
            </Button>
            <AddGroupDialog />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {groups.map((group, index) => (
            <div key={group.groupId} className="bg-dark-primary rounded-lg p-4 border border-dark-tertiary">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    group.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    <Users className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{group.name}</h3>
                    <p className="text-sm text-gray-400">ID: {group.groupId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? "啟用" : "停用"}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setExpandedGroup(
                      expandedGroup === group.groupId ? null : group.groupId
                    )}
                    className="w-8 h-8 p-0 rounded-full bg-gray-500 hover:bg-gray-600 text-white border-none"
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              </div>

              {/* Keywords Summary */}
              <div className="mb-4">
                <div className="text-sm text-gray-300 mb-2">
                  設定關鍵字 ({allKeywords.filter(k => k.groupId === group.groupId).length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {allKeywords
                    .filter(k => k.groupId === group.groupId)
                    .slice(0, 3)
                    .map(keyword => (
                      <Badge key={keyword.id} variant="outline">
                        {keyword.keyword}
                      </Badge>
                    ))}
                  {allKeywords.filter(k => k.groupId === group.groupId).length > 3 && (
                    <Badge variant="secondary">
                      +{allKeywords.filter(k => k.groupId === group.groupId).length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Expanded Form */}
              {expandedGroup === group.groupId && (
                <div className="border-t border-dark-tertiary pt-4">
                  {/* Existing Keywords */}
                  {allKeywords.filter(k => k.groupId === group.groupId).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white mb-3">現有關鍵字</h4>
                      <div className="space-y-2">
                        {allKeywords
                          .filter(k => k.groupId === group.groupId)
                          .map(keyword => (
                            <div key={keyword.id} className="bg-dark-secondary p-3 rounded-lg border border-dark-tertiary">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                                      {keyword.keyword}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-1">{keyword.responseText}</p>
                                  {keyword.images && keyword.images.length > 0 && (
                                    <div className="text-xs text-gray-400">
                                      📷 {keyword.images.length} 張圖片
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <h4 className="text-sm font-medium text-white mb-3">新增關鍵字</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">關鍵字</label>
                        <Input
                          placeholder="例如: #報價"
                          value={keywordForm.keyword}
                          onChange={(e) => setKeywordForm(prev => ({ ...prev, keyword: e.target.value }))}
                          className="bg-dark-secondary border-dark-tertiary text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">回覆類型</label>
                        <Select defaultValue="text_image">
                          <SelectTrigger className="bg-dark-secondary border-dark-tertiary text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text_image">文字 + 圖片</SelectItem>
                            <SelectItem value="text_only">僅文字</SelectItem>
                            <SelectItem value="image_only">僅圖片</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">回覆文字</label>
                      <Textarea
                        rows={3}
                        placeholder="輸入自動回覆的文字內容..."
                        value={keywordForm.responseText}
                        onChange={(e) => setKeywordForm(prev => ({ ...prev, responseText: e.target.value }))}
                        className="bg-dark-secondary border-dark-tertiary text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">圖片上傳 (最多5張)</label>
                      <ImageUpload
                        images={keywordForm.images}
                        onChange={handleImagesChange}
                        maxImages={5}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleResetForm}
                        className="bg-yellow-600 hover:bg-yellow-700 border-yellow-600"
                      >
                        <RotateCcw size={16} className="mr-1" />
                        重新
                      </Button>
                      <Button
                        onClick={handleSaveKeyword}
                        disabled={createKeywordMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save size={16} className="mr-1" />
                        儲存
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
