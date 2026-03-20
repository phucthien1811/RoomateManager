# Script commit cho phuchthien1811 - Authentication & Personal Dashboard
# 2 commits riêng biệt

Write-Host "=== GIT COMMITS - AUTHENTICATION & PERSONAL DASHBOARD ===" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra đang ở branch nào
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Nếu không phải feature branch, tạo mới
if ($currentBranch -ne "feature/authentication-personal-dashboard") {
    Write-Host "Creating new feature branch..." -ForegroundColor Yellow
    git checkout develop 2>$null
    if (-not $?) {
        git checkout -b develop
    }
    git checkout -b feature/authentication-personal-dashboard
}

Write-Host ""
Write-Host "=== COMMIT 1: AUTHENTICATION (Login & Register) ===" -ForegroundColor Green
Write-Host ""

# Add files cho commit 1
git add client/src/login.jsx
git add client/src/register.jsx

# Commit 1
$commit1Message = @"
feat: thêm giao diện đăng nhập và đăng ký

- Tạo component Login với Material-UI
  → Gradient purple background hiện đại
  → Form validation đầy đủ
  → Show/hide password
  → Demo account sẵn có
  
- Tạo component Register
  → Gradient pink background
  → Form đăng ký: Họ tên, username, email, phone, password
  → Validation: email format, password min 6 chars, confirm password
  → Success notification và auto redirect
  
- Design features:
  → Glass morphism effects
  → Smooth animations
  → Responsive design
  → Material-UI icons

Files:
- client/src/login.jsx
- client/src/register.jsx
"@

git commit -m $commit1Message

Write-Host "✅ Commit 1: Authentication - DONE" -ForegroundColor Green
Write-Host ""

# ============================================

Write-Host "=== COMMIT 2: PERSONAL DASHBOARD ===" -ForegroundColor Green
Write-Host ""

# Add files cho commit 2
git add client/src/personal.dashboard.jsx
git add client/src/app.jsx

# Commit 2
$commit2Message = @"
feat: thêm dashboard cá nhân cho thành viên

- Tạo Personal Dashboard component
  → Hiển thị chi tiêu cá nhân từng thành viên
  → Avatar + greeting personalized
  
- Tính năng dashboard cá nhân:
  → 3 Summary cards: Đã đóng, Còn nợ, Ngân sách tháng
  → Progress bar tiến độ thanh toán
  → Lịch sử chi tiêu table: Loại, Số tiền, Ngày/Giờ, Trạng thái
  → Phân bổ chi phí breakdown theo category (%)
  → Logout button
  
- Cập nhật App.jsx:
  → State management cho navigation
  → Kết nối Login → Register → Personal Dashboard
  → Theme customization với color palette mới
  
- Design:
  → Gradient blue background (#4facfe → #00f2fe)
  → Transaction history với icons color-coded
  → Category breakdown với progress bars
  → Responsive table layout

Files:
- client/src/personal.dashboard.jsx
- client/src/app.jsx
"@

git commit -m $commit2Message

Write-Host "✅ Commit 2: Personal Dashboard - DONE" -ForegroundColor Green
Write-Host ""

# ============================================

Write-Host "=== PUSH TO REMOTE ===" -ForegroundColor Cyan
git push -u origin feature/authentication-personal-dashboard

Write-Host ""
Write-Host "=== HOÀN THÀNH ===" -ForegroundColor Green
Write-Host "✅ 2 Commits đã được tạo:" -ForegroundColor Green
Write-Host "   1. feat: thêm giao diện đăng nhập và đăng ký" -ForegroundColor White
Write-Host "   2. feat: thêm dashboard cá nhân cho thành viên" -ForegroundColor White
Write-Host ""
Write-Host "✅ Branch: feature/authentication-personal-dashboard" -ForegroundColor Green
Write-Host "✅ Author: phuchthien1811" -ForegroundColor Green
Write-Host ""
Write-Host "📌 BƯỚC TIẾP THEO:" -ForegroundColor Magenta
Write-Host "1. Vào GitHub/GitLab"
Write-Host "2. Tạo Pull Request: feature/authentication-personal-dashboard → develop"
Write-Host "3. Title: [Feature] Authentication & Personal Dashboard"
Write-Host "4. Assign reviewer"
Write-Host ""
