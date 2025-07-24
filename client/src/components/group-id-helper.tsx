import { useState } from "react";
import { HelpCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function GroupIdHelper() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const webhookUrl = `${window.location.origin}/api/webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "已複製",
      description: "Webhook URL 已複製到剪貼簿",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 border-blue-500 text-blue-400">
          <HelpCircle size={14} className="mr-1" />
          如何取得群組 ID?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-dark-secondary border-dark-tertiary">
        <DialogHeader>
          <DialogTitle className="text-white">如何取得 LINE 群組 ID</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 方法一：透過 Webhook */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">方法一：透過 Webhook 自動取得（推薦）</h3>
            <div className="bg-dark-primary p-4 rounded-lg border border-dark-tertiary">
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>先將 Bot 加入您的 LINE 群組</li>
                <li>在 LINE Developers Console 設定以下 Webhook URL：</li>
              </ol>
              <div className="mt-3 p-3 bg-gray-800 rounded border flex items-center justify-between">
                <code className="text-green-400 text-sm break-all">{webhookUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="ml-2 p-1"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </Button>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 mt-3" start={3}>
                <li>在群組中發送任何訊息</li>
                <li>群組會自動出現在系統中，無需手動添加群組 ID</li>
              </ol>
            </div>
          </div>

          {/* 方法二：LINE Bot SDK */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">方法二：使用 LINE Bot SDK</h3>
            <div className="bg-dark-primary p-4 rounded-lg border border-dark-tertiary">
              <div className="space-y-2 text-gray-300">
                <p>如果您有程式開發能力，可以使用以下程式碼取得群組 ID：</p>
                <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`// Node.js 範例
const { Client } = require('@line/bot-sdk');

app.post('/webhook', (req, res) => {
  const events = req.body.events;
  events.forEach(event => {
    if (event.source.type === 'group') {
      console.log('群組 ID:', event.source.groupId);
    }
  });
});`}
                </pre>
              </div>
            </div>
          </div>

          {/* 方法三：LINE Official Account Manager */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">方法三：LINE Official Account Manager</h3>
            <div className="bg-dark-primary p-4 rounded-lg border border-dark-tertiary">
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>登入 <span className="text-blue-400">LINE Official Account Manager</span></li>
                <li>選擇您的 Bot 帳號</li>
                <li>進入「訊息」→「群發訊息」</li>
                <li>選擇目標群組時，可以看到群組 ID</li>
              </ol>
            </div>
          </div>

          {/* 重要提醒 */}
          <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <HelpCircle className="text-yellow-400 mt-0.5" size={16} />
              <div>
                <h4 className="text-yellow-400 font-medium">重要提醒</h4>
                <ul className="text-gray-300 text-sm mt-2 space-y-1">
                  <li>• 群組 ID 通常以 "C" 開頭，長度約 33 字符</li>
                  <li>• 必須先將 Bot 加入群組才能取得群組 ID</li>
                  <li>• 建議使用方法一，系統會自動處理群組管理</li>
                  <li>• 確保 Webhook 設定正確且可以接收訊息</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}