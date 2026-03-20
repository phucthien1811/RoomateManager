#!/bin/bash
# Fix: Đổi cả Author và Committer thành huynhbao1909

echo "=== SỬA COMMIT ĐỂ CHỈ HIỆN HUYNHBAO1909 ==="
echo ""

# Bước 1: Set Git config tạm thời
echo "Step 1: Đổi Git config tạm thời..."
git config user.name "huynhbao1909"
git config user.email "huynhgiabaogold09@gmail.com"

# Bước 2: Amend commit với author mới
echo "Step 2: Sửa lại commit..."
git commit --amend --reset-author --no-edit

# Bước 3: Force push lại
echo "Step 3: Force push..."
git push -f origin feature/rm-10-financial-dashboard

# Bước 4: Khôi phục Git config cũ
echo "Step 4: Khôi phục Git config của bạn..."
git config user.name "thientiy1811"
git config user.email "your-email@example.com"

echo ""
echo "=== HOÀN THÀNH ==="
echo "✅ Giờ cả Author và Committer đều là huynhbao1909!"
echo "✅ Refresh lại GitHub để xem"
echo ""
