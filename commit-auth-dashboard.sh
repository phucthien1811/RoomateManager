#!/bin/bash
# Script commit cho phuchthien1811 - Authentication & Personal Dashboard
# 2 commits riêng biệt

echo "=== GIT COMMITS - AUTHENTICATION & PERSONAL DASHBOARD ==="
echo ""

# Kiểm tra đang ở branch nào
currentBranch=$(git branch --show-current)
echo "Current branch: $currentBranch"

# Nếu không phải feature branch, tạo mới
if [ "$currentBranch" != "feature/authentication-personal-dashboard" ]; then
    echo "Creating new feature branch..."
    git checkout develop 2>/dev/null || git checkout -b develop
    git checkout -b feature/authentication-personal-dashboard
fi

echo ""
echo "=== COMMIT 1: AUTHENTICATION (Login & Register) ==="
echo ""

# Add files cho commit 1
git add client/src/login.jsx
git add client/src/register.jsx

# Commit 1
git commit -m "feat: thêm giao diện đăng nhập và đăng ký

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
- client/src/register.jsx"

echo "✅ Commit 1: Authentication - DONE"
echo ""

# ============================================

echo "=== COMMIT 2: PERSONAL DASHBOARD ==="
echo ""

# Add files cho commit 2
git add client/src/personal.dashboard.jsx
git add client/src/app.jsx

# Commit 2
git commit -m "feat: thêm dashboard cá nhân cho thành viên

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
- client/src/app.jsx"

echo "✅ Commit 2: Personal Dashboard - DONE"
echo ""

# ============================================

echo "=== PUSH TO REMOTE ==="
git push -u origin feature/authentication-personal-dashboard

echo ""
echo "=== HOÀN THÀNH ==="
echo "✅ 2 Commits đã được tạo:"
echo "   1. feat: thêm giao diện đăng nhập và đăng ký"
echo "   2. feat: thêm dashboard cá nhân cho thành viên"
echo ""
echo "✅ Branch: feature/authentication-personal-dashboard"
echo "✅ Author: phuchthien1811"
echo ""
echo "📌 BƯỚC TIẾP THEO:"
echo "1. Vào GitHub/GitLab"
echo "2. Tạo Pull Request: feature/authentication-personal-dashboard → develop"
echo "3. Title: [Feature] Authentication & Personal Dashboard"
echo "4. Assign reviewer"
echo ""
