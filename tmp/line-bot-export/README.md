# 聯能永續 LINE Bot 管理系統

一個功能完整的 LINE Bot 多群組管理系統，支援自動回覆關鍵字設定和群組單獨發送功能。

## 功能特色

### 🤖 群組自動回覆
- 支援多群組管理（最多20個群組）
- 智能關鍵字匹配與自動回覆
- 支援文字和圖片回覆
- 即時活動監控

### 📤 群組單獨發送
- 個別群組自訂訊息內容
- 支援文字和圖片附件
- 批量設定功能
- 測試模式驗證

### 🎨 現代化介面
- 深色主題設計
- 響應式佈局
- 圓形按鈕設計
- 即時數據更新

### 🔧 技術架構
- **前端**: React + TypeScript + Vite
- **後端**: Node.js + Express
- **資料庫**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + Shadcn/ui
- **狀態管理**: TanStack Query

## 快速開始

### 1. 環境準備
```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
```

### 2. 環境變數設定
在 `.env` 檔案中設定：
```env
DATABASE_URL=your_postgresql_connection_string
CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
CHANNEL_SECRET=your_line_channel_secret
```

### 3. 資料庫初始化
```bash
# 推送資料庫 schema
npm run db:push
```

### 4. 啟動開發服務器
```bash
# 啟動開發模式
npm run dev
```

訪問 `http://localhost:5000` 查看應用程式

## LINE Bot 設定

### 1. 建立 LINE Bot
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立新的 Provider 和 Channel
3. 取得 Channel Access Token 和 Channel Secret

### 2. Webhook 設定
設定 Webhook URL：`https://your-domain.com/api/webhook`

### 3. 取得群組 ID
1. 將 Bot 加入 LINE 群組
2. 發送任意訊息
3. 在系統日誌中找到群組 ID
4. 在管理介面中新增群組

## 主要功能說明

### 群組自動回覆
1. 新增群組：輸入群組 ID 和名稱
2. 設定關鍵字：為每個群組設定觸發關鍵字
3. 自訂回覆：設定文字和圖片回覆內容
4. 即時監控：查看回覆活動記錄

### 群組單獨發送
1. 新增推播：選擇目標群組
2. 自訂內容：為每個群組設定不同訊息
3. 附加圖片：支援多張圖片上傳
4. 測試模式：驗證功能無需實際發送
5. 批量操作：快速設定多個群組

## API 端點

### 群組管理
- `GET /api/groups` - 取得所有群組
- `POST /api/groups` - 新增群組
- `PATCH /api/groups/:id` - 更新群組
- `DELETE /api/groups/:id` - 刪除群組

### 關鍵字管理
- `GET /api/keywords` - 取得所有關鍵字
- `POST /api/keywords` - 新增關鍵字
- `PATCH /api/keywords/:id` - 更新關鍵字
- `DELETE /api/keywords/:id` - 刪除關鍵字

### 推播功能
- `POST /api/broadcast-multiple` - 群組單獨發送
- `POST /api/upload` - 圖片上傳

### 系統監控
- `GET /api/stats` - 系統統計
- `GET /api/activities` - 活動記錄
- `POST /api/webhook` - LINE Webhook

## 部署說明

### Replit 部署
1. Fork 此專案到 Replit
2. 設定環境變數
3. 點擊 Deploy 按鈕

### 自訂部署
1. 建置專案：`npm run build`
2. 設定 PostgreSQL 資料庫
3. 設定環境變數
4. 啟動：`npm start`

## 開發指南

### 專案結構
```
├── client/          # React 前端
│   ├── src/
│   │   ├── components/  # UI 組件
│   │   ├── pages/       # 頁面
│   │   └── lib/         # 工具函數
├── server/          # Node.js 後端
│   ├── routes.ts    # API 路由
│   └── storage.ts   # 資料層
├── shared/          # 共用類型定義
└── uploads/         # 圖片上傳目錄
```

### 新增功能
1. 在 `shared/schema.ts` 定義資料結構
2. 在 `server/storage.ts` 實作資料層
3. 在 `server/routes.ts` 新增 API
4. 在 `client/src/components/` 建立 UI

## 故障排除

### 常見問題
1. **LINE API 429 錯誤**: 使用測試模式驗證功能
2. **群組 ID 錯誤**: 確認 Bot 已正確加入群組
3. **圖片上傳失敗**: 檢查上傳目錄權限

### 除錯模式
設定 `NODE_ENV=development` 啟用詳細日誌

## 授權條款

MIT License

## 技術支援

如有問題請查看：
1. 系統活動記錄
2. 瀏覽器開發者工具
3. 服務器日誌

---

**聯能永續 LINE Bot 管理系統** - 讓群組管理更智能、更高效！