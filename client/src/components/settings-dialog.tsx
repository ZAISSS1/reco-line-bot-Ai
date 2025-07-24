import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    channelAccessToken: "j4qKbIVDhzsbxF4qZR9tAquy2CvfznndhQ2f5zmZ+k+SbarBijmewCNPtp6ujrhjiSTu7hsLoohXGZB1pPgAJ6yGoIwu7SyUfEWK+P3SXN1S4qP9m3wLyzUIoDQOG31QW6iLQbhWPmFQZNbDYeDitwdB04t89/1O/w1cDnyilFU=",
    channelSecret: "68ca31ab8a5b03d3c3db85bf645e1305",
    webhookUrl: `${window.location.origin}/api/webhook`,
    maxGroups: 20
  });

  const handleSave = () => {
    toast({
      title: "設定已儲存",
      description: "LINE Bot 設定已更新成功",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white transition-colors p-2"
        >
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-dark-secondary border-dark-tertiary">
        <DialogHeader>
          <DialogTitle className="text-white">系統設定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* LINE Bot 設定 */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-white">LINE Bot 設定</h3>
            
            <div className="space-y-2">
              <Label htmlFor="channelAccessToken" className="text-gray-300">Channel Access Token</Label>
              <Textarea
                id="channelAccessToken"
                value={settings.channelAccessToken}
                onChange={(e) => setSettings(prev => ({ ...prev, channelAccessToken: e.target.value }))}
                className="bg-dark-primary border-dark-tertiary text-white h-16 resize-none text-sm"
                placeholder="輸入 LINE Channel Access Token"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channelSecret" className="text-gray-300">Channel Secret</Label>
              <Input
                id="channelSecret"
                value={settings.channelSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, channelSecret: e.target.value }))}
                className="bg-dark-primary border-dark-tertiary text-white"
                placeholder="輸入 LINE Channel Secret"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="text-gray-300">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={settings.webhookUrl}
                readOnly
                className="bg-dark-primary border-dark-tertiary text-gray-400"
              />
              <p className="text-xs text-gray-400">
                請將此 URL 設定到 LINE Bot 的 Webhook URL
              </p>
            </div>
          </div>

          {/* 系統設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">系統設定</h3>
            
            <div className="space-y-2">
              <Label htmlFor="maxGroups" className="text-gray-300">最大群組數量</Label>
              <Input
                id="maxGroups"
                type="number"
                value={settings.maxGroups}
                onChange={(e) => setSettings(prev => ({ ...prev, maxGroups: parseInt(e.target.value) }))}
                className="bg-dark-primary border-dark-tertiary text-white w-32"
                min="1"
                max="50"
              />
            </div>
          </div>

          {/* 連線狀態 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">連線狀態</h3>
            <div className="bg-dark-primary p-4 rounded-lg border border-dark-tertiary">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-medium">LINE Bot 已連線</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                最後連線時間：{new Date().toLocaleString('zh-TW')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-dark-tertiary">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="border-dark-tertiary text-gray-300"
          >
            取消
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save size={16} className="mr-2" />
            儲存設定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}