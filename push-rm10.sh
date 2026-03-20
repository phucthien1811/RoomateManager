#!/bin/bash
# Script push code RM-10 cho Huỳnh Gia Bảo
# Tuân thủ Git flow và quy chuẩn Scrum Master

echo "=== PUSH CODE RM-10 - FINANCIAL DASHBOARD ==="
echo ""

# 1. Xóa file cũ (tên không đúng chuẩn)
echo "Step 1: Xóa file tên cũ..."
git rm client/src/FinancialDashboard.jsx 2>/dev/null || rm -f client/src/FinancialDashboard.jsx

# 2. Checkout sang nhánh develop (nếu chưa có thì tạo)
echo "Step 2: Chuyển sang nhánh develop..."
git checkout develop 2>/dev/null || git checkout -b develop

# 3. Tạo feature branch theo chuẩn
echo "Step 3: Tạo feature branch..."
git checkout -b feature/rm-10-financial-dashboard

# 4. Add files
echo "Step 4: Add files..."
git add client/src/financial.dashboard.jsx
git add client/src/app.jsx
git add client/package.json
git add RM10-README.md
git add QUICKSTART-RM10.md

# 5. Commit với author là Huỳnh Gia Bảo
echo "Step 5: Commit với tên Huỳnh Gia Bảo..."
git commit --author="huynhbao1909 <huynhgiabaogold09@gmail.com>" -m "feat: tạo giao diện dashboard tài chính RM-10

- Thêm component financial.dashboard.jsx với Material-UI
- Gradient background hiện đại và glass morphism effects
- 4 summary cards: Tổng chi phí, Đã thu, Còn thiếu, Thành viên
- Tiến độ thu tiền với progress bar
- Chi tiết hóa đơn: Điện, Nước, Mạng, Tiền nhà
- Trạng thái thanh toán từng thành viên
- Responsive design và hover animations
- Format currency theo chuẩn VNĐ

Task: RM-10
Author: Huỳnh Gia Bảo (huynhbao1909)"

# 6. Push branch lên remote
echo "Step 6: Push lên remote..."
git push -u origin feature/rm-10-financial-dashboard

echo ""
echo "=== HOÀN THÀNH ==="
echo "✅ Branch: feature/rm-10-financial-dashboard"
echo "✅ Author: Huỳnh Gia Bảo"
echo "✅ Email: huynhgiabaogold09@gmail.com"
echo ""
echo "📌 BƯỚC TIẾP THEO:"
echo "1. Vào GitHub/GitLab"
echo "2. Tạo Pull Request từ feature/rm-10-financial-dashboard → develop"
echo "3. Assign reviewer và đợi approve"
echo "4. KHÔNG merge trực tiếp vào main (chỉ PO được phép)"
echo ""
