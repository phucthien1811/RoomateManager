# Script push code RM-10 cho Huỳnh Gia Bảo - PowerShell Version
# Tuân thủ Git flow và quy chuẩn Scrum Master

Write-Host "=== PUSH CODE RM-10 - FINANCIAL DASHBOARD ===" -ForegroundColor Cyan
Write-Host ""

# 1. Xóa file cũ (tên không đúng chuẩn)
Write-Host "Step 1: Xóa file tên cũ..." -ForegroundColor Yellow
if (Test-Path "client\src\FinancialDashboard.jsx") {
    git rm client/src/FinancialDashboard.jsx 2>$null
    if (-not $?) {
        Remove-Item "client\src\FinancialDashboard.jsx" -Force -ErrorAction SilentlyContinue
    }
}

# 2. Checkout sang nhánh develop
Write-Host "Step 2: Chuyển sang nhánh develop..." -ForegroundColor Yellow
git checkout develop 2>$null
if (-not $?) {
    git checkout -b develop
}

# 3. Tạo feature branch theo chuẩn
Write-Host "Step 3: Tạo feature branch..." -ForegroundColor Yellow
git checkout -b feature/rm-10-financial-dashboard

# 4. Add files
Write-Host "Step 4: Add files..." -ForegroundColor Yellow
git add client/src/financial.dashboard.jsx
git add client/src/app.jsx
git add client/package.json
git add RM10-README.md
git add QUICKSTART-RM10.md

# 5. Commit với author là Huỳnh Gia Bảo
Write-Host "Step 5: Commit với tên Huỳnh Gia Bảo..." -ForegroundColor Yellow
$commitMessage = @"
feat: tạo giao diện dashboard tài chính RM-10

- Thêm component financial.dashboard.jsx với Material-UI
- Gradient background hiện đại và glass morphism effects
- 4 summary cards: Tổng chi phí, Đã thu, Còn thiếu, Thành viên
- Tiến độ thu tiền với progress bar
- Chi tiết hóa đơn: Điện, Nước, Mạng, Tiền nhà
- Trạng thái thanh toán từng thành viên
- Responsive design và hover animations
- Format currency theo chuẩn VNĐ

Task: RM-10
Author: Huỳnh Gia Bảo (huynhbao1909)
"@

git commit --author="huynhbao1909 <huynhgiabaogold09@gmail.com>" -m $commitMessage

# 6. Push branch lên remote
Write-Host "Step 6: Push lên remote..." -ForegroundColor Yellow
git push -u origin feature/rm-10-financial-dashboard

Write-Host ""
Write-Host "=== HOÀN THÀNH ===" -ForegroundColor Green
Write-Host "✅ Branch: feature/rm-10-financial-dashboard" -ForegroundColor Green
Write-Host "✅ Author: Huỳnh Gia Bảo" -ForegroundColor Green
Write-Host "✅ Email: huynhgiabaogold09@gmail.com" -ForegroundColor Green
Write-Host ""
Write-Host "📌 BƯỚC TIẾP THEO:" -ForegroundColor Magenta
Write-Host "1. Vào GitHub/GitLab"
Write-Host "2. Tạo Pull Request từ feature/rm-10-financial-dashboard → develop"
Write-Host "3. Assign reviewer và đợi approve"
Write-Host "4. KHÔNG merge trực tiếp vào main (chỉ PO được phép)"
Write-Host ""
