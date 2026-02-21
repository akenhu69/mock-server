# Mock API 文檔

本文檔詳細說明了可供測試的 Mock API 端點。所有 API 基礎路徑為 `/api`。

## 產品相關 API

### 取得所有產品

```
GET /api/products
```

查詢參數:

- `category` (可選): 按分類名稱過濾
- `_page` 和 `_limit` (可選): 分頁參數

響應示例:

```json
{
  "products": [
    {
      "id": 1,
      "name": "麥香雞",
      "price": 45,
      "description": "美味的麥香雞漢堡，酥脆多汁的雞肉搭配新鮮的生菜和特製醬料",
      "image": "/images/products/mcchicken.png",
      "category": "漢堡",
      "categoryId": 1,
      "inStock": true,
      "isPopular": true,
      "calories": 380,
      "tags": ["熱門", "雞肉"]
    }
    // ...更多產品
  ],
  "total": 10
}
```

### 依名稱搜尋產品

```
GET /api/products/search?q=雞
```

響應與取得所有產品相同，但只返回名稱中包含 '雞' 的產品。

### 取得熱門產品

```
GET /api/products/featured
```

響應與取得所有產品相同，但只返回 `isPopular` 為 `true` 的產品。

### 依分類取得產品

```
GET /api/products/category/1
```

響應與取得所有產品相同，但只返回分類 ID 為 1 的產品。

### 取得單一產品詳情

```
GET /api/products/1
```

響應示例:

```json
{
  "id": 1,
  "name": "麥香雞",
  "price": 45,
  "description": "美味的麥香雞漢堡，酥脆多汁的雞肉搭配新鮮的生菜和特製醬料",
  "image": "/images/products/mcchicken.png",
  "category": "漢堡",
  "categoryId": 1,
  "inStock": true,
  "isPopular": true,
  "calories": 380,
  "tags": ["熱門", "雞肉"]
}
```

## 分類相關 API

### 取得所有分類

```
GET /api/categories
```

響應示例:

```json
[
  {
    "id": 1,
    "name": "漢堡",
    "slug": "burgers",
    "description": "各式美味漢堡",
    "image": "/images/categories/burgers.png"
  }
  // ...更多分類
]
```

### 取得單一分類詳情

```
GET /api/categories/1
```

響應示例:

```json
{
  "id": 1,
  "name": "漢堡",
  "slug": "burgers",
  "description": "各式美味漢堡",
  "image": "/images/categories/burgers.png"
}
```

## 使用者相關 API

### 使用者登入

```
POST /api/login
```

請求體:

```json
{
  "username": "demo",
  "password": "demo123"
}
```

成功響應 (200):

```json
{
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "role": "user",
    "firstName": "測試",
    "lastName": "用戶",
    "phone": "0912345678",
    "address": "台北市信義區101大樓",
    "createdAt": "2023-01-15T08:30:00.000Z"
  },
  "token": "mock-jwt-token-a1b2c3d4e5"
}
```

失敗響應 (401):

```json
{
  "error": true,
  "message": "用戶名或密碼錯誤"
}
```

### 使用者註冊

```
POST /api/register
```

請求體:

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "newuser123"
}
```

成功響應 (201):

```json
{
  "user": {
    "id": 3,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "createdAt": "2023-09-15T12:34:56.789Z"
  },
  "token": "mock-jwt-token-f6g7h8i9j0"
}
```

失敗響應 (400):

```json
{
  "error": true,
  "message": "用戶名已存在"
}
```

## 訂單相關 API

### 取得使用者訂單

需要 JWT 授權。

```
GET /api/orders/user/1
```

Authorization 標頭:

```
Bearer mock-jwt-token-a1b2c3d4e5
```

響應示例:

```json
[
  {
    "id": 1,
    "userId": 1,
    "items": [
      { "productId": 1, "name": "麥香雞", "quantity": 2, "price": 45 },
      { "productId": 3, "name": "可口可樂", "quantity": 1, "price": 28 },
      { "productId": 4, "name": "薯條 (中)", "quantity": 1, "price": 33 }
    ],
    "total": 151,
    "status": "completed",
    "paymentMethod": "cash",
    "deliveryAddress": "台北市信義區101大樓",
    "contactPhone": "0912345678",
    "createdAt": "2023-09-01T12:00:00.000Z",
    "completedAt": "2023-09-01T12:45:00.000Z"
  }
  // ...更多訂單
]
```

### 結帳下單

需要 JWT 授權。

```
POST /api/checkout
```

Authorization 標頭:

```
Bearer mock-jwt-token-a1b2c3d4e5
```

請求體:

```json
{
  "userId": 1,
  "items": [
    { "productId": 2, "quantity": 1, "price": 72 },
    { "productId": 9, "quantity": 1, "price": 30 }
  ],
  "total": 102,
  "paymentMethod": "credit_card",
  "deliveryAddress": "台北市信義區101大樓",
  "contactPhone": "0912345678"
}
```

成功響應 (201):

```json
{
  "orderId": 1631234567890,
  "status": "processing",
  "message": "訂單已建立，處理中",
  "createdAt": "2023-09-15T12:34:56.789Z"
}
```

## 購物車相關 API

### 取得使用者購物車

需要 JWT 授權。

```
GET /api/users/1/cart
```

Authorization 標頭:

```
Bearer mock-jwt-token-a1b2c3d4e5
```

響應示例:

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    { "productId": 2, "quantity": 1 },
    { "productId": 4, "quantity": 1 }
  ],
  "updatedAt": "2023-09-10T15:30:00.000Z"
}
```

### 更新購物車

需要 JWT 授權。

```
PUT /api/carts/1
```

Authorization 標頭:

```
Bearer mock-jwt-token-a1b2c3d4e5
```

請求體:

```json
{
  "userId": 1,
  "items": [
    { "productId": 2, "quantity": 2 },
    { "productId": 5, "quantity": 1 }
  ]
}
```

## 評論相關 API

### 取得產品評論

```
GET /api/reviews/product/1
```

響應示例:

```json
[
  {
    "id": 1,
    "productId": 1,
    "userId": 1,
    "username": "demo",
    "rating": 4,
    "comment": "非常美味的漢堡，推薦！",
    "createdAt": "2023-08-15T14:30:00.000Z"
  }
]
```

### 新增評論

需要 JWT 授權。

```
POST /api/reviews
```

Authorization 標頭:

```
Bearer mock-jwt-token-a1b2c3d4e5
```

請求體:

```json
{
  "productId": 2,
  "userId": 1,
  "username": "demo",
  "rating": 5,
  "comment": "大麥克永遠的經典，好吃！"
}
```

## 促銷活動相關 API

### 取得所有促銷活動

```
GET /api/promotions
```

響應示例:

```json
[
  {
    "id": 1,
    "title": "超值午餐組合",
    "description": "指定漢堡加飲料享優惠價",
    "discount": 15,
    "startDate": "2023-09-01T00:00:00.000Z",
    "endDate": "2023-10-31T23:59:59.000Z",
    "image": "/images/promotions/lunch_combo.png",
    "isActive": true
  }
  // ...更多促銷活動
]
```

## 分頁和過濾

json-server 支持以下查詢參數:

- `_page` 和 `_limit`: 分頁
- `_sort` 和 `_order`: 排序
- `_start` 和 `_end`: 切片
- `propertyName_like`: 模糊搜索
- `propertyName_gte` 和 `propertyName_lte`: 數值範圍

例如:

```
GET /api/products?_page=1&_limit=5&_sort=price&_order=desc
```

返回按價格降序排列的第一頁 5 個產品。

## 錯誤處理

所有錯誤響應都包含一個 `error` 屬性，設置為 `true`，以及一個 `message` 屬性，說明錯誤的原因。

常見錯誤響應:

- 400 Bad Request: 請求格式不正確或缺少必要的參數
- 401 Unauthorized: 缺少授權或授權無效
- 404 Not Found: 請求的資源不存在
