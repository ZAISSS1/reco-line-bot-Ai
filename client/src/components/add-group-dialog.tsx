import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import GroupIdHelper from "@/components/group-id-helper";

export default function AddGroupDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: "",
    name: "",
    isActive: true
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await apiRequest("POST", "/api/groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setFormData({ groupId: "", name: "", isActive: true });
      setOpen(false);
      toast({
        title: "成功",
        description: "群組已新增",
      });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "新增群組失敗",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupId.trim() || !formData.name.trim()) {
      toast({
        title: "錯誤",
        description: "請填入群組ID和名稱",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-none">
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-dark-secondary border-dark-tertiary">
        <DialogHeader>
          <DialogTitle className="text-white">新增 LINE 群組</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groupId" className="text-gray-300">群組 ID</Label>
              <GroupIdHelper />
            </div>
            <Input
              id="groupId"
              placeholder="例如: C1234567890abcdef"
              value={formData.groupId}
              onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
              className="bg-dark-primary border-dark-tertiary text-white"
            />
            <p className="text-xs text-gray-400">不知道如何取得群組 ID？點選上方「如何取得群組 ID?」按鈕</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">群組名稱</Label>
            <Input
              id="name"
              placeholder="例如: 客服群組"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-dark-primary border-dark-tertiary text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-dark-tertiary text-gray-300"
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={createGroupMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createGroupMutation.isPending ? "新增中..." : "新增群組"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}