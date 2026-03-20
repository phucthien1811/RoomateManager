# Fix: Đổi cả Author và Committer thành huynhbao1909

Write-Host "=== SỬA COMMIT ĐỂ CHỈ HIỆN HUYNHBAO1909 ===" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Set Git config tạm thời
Write-Host "Step 1: Đổi Git config tạm thời..." -ForegroundColor Yellow
git config user.name "huynhbao1909"
git config user.email "huynhgiabaogold09@gmail.com"

# Bước 2: Amend commit với author mới
Write-Host "Step 2: Sửa lại commit..." -ForegroundColor Yellow
git commit --amend --reset-author --no-edit

# Bước 3: Force push lại
Write-Host "Step 3: Force push..." -ForegroundColor Yellow
git push -f origin feature/rm-10-financial-dashboard

# Bước 4: Khôi phục Git config cũ
Write-Host "Step 4: Khôi phục Git config của bạn..." -ForegroundColor Yellow
git config user.name "thientiy1811"
git config user.email "your-email@example.com"

Write-Host ""
Write-Host "=== HOÀN THÀNH ===" -ForegroundColor Green
Write-Host "✅ Giờ cả Author và Committer đều là huynhbao1909!" -ForegroundColor Green
Write-Host "✅ Refresh lại GitHub để xem" -ForegroundColor Green
Write-Host ""
