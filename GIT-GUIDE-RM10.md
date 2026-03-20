# 🚀 Hướng Dẫn Push Code RM-10

## ✅ Đã Tuân Thủ Quy Chuẩn Scrum Master

### 1. Naming Convention
- ✅ File name: `financial.dashboard.jsx` (chữ thường + dấu chấm)
- ✅ Variables/Functions: `camelCase` (getPaymentProgress, formatCurrency, dashboardData)
- ✅ Constants: `UPPER_CASE` (nếu có)
- ✅ Database tables: `snake_case` (sẽ áp dụng khi có DB)

### 2. Git Flow
- ✅ Branch: `feature/rm-10-financial-dashboard` (theo format feature/tên-chức-năng)
- ✅ Commit message: `feat: tạo giao diện dashboard tài chính RM-10`
- ✅ Author: Huỳnh Gia Bảo (huynhbao1909)
- ✅ Email: huynhgiabaogold09@gmail.com

### 3. Git Workflow
```
main (protected - chỉ PO merge)
  ↑
develop (nhánh phát triển)
  ↑
feature/rm-10-financial-dashboard (nhánh của bạn)
```

---

## 📋 CÁCH CHẠY (Chọn 1 trong 2)

### Cách 1: Chạy Script PowerShell (Windows - Recommended)
```powershell
.\push-rm10.ps1
```

### Cách 2: Chạy Script Bash (Git Bash)
```bash
bash push-rm10.sh
```

### Cách 3: Chạy Thủ Công (Từng Bước)

#### Bước 1: Xóa file tên cũ
```bash
git rm client/src/FinancialDashboard.jsx
```

#### Bước 2: Chuyển sang develop
```bash
git checkout develop
# hoặc tạo mới nếu chưa có
git checkout -b develop
```

#### Bước 3: Tạo feature branch
```bash
git checkout -b feature/rm-10-financial-dashboard
```

#### Bước 4: Add files
```bash
git add client/src/financial.dashboard.jsx
git add client/src/app.jsx
git add client/package.json
git add RM10-README.md
git add QUICKSTART-RM10.md
```

#### Bước 5: Commit với author
```bash
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
```

#### Bước 6: Push lên remote
```bash
git push -u origin feature/rm-10-financial-dashboard
```

---

## 📝 SAU KHI PUSH

### 1. Tạo Pull Request
- Vào GitHub/GitLab
- Tạo PR: `feature/rm-10-financial-dashboard` → `develop`
- Title: `[RM-10] Giao diện Dashboard Tài Chính`
- Description:
  ```markdown
  ## Task: RM-10 - Dashboard Tài Chính
  
  ### Tính năng
  - ✅ Dashboard tài chính với Material-UI
  - ✅ 4 summary cards với gradient hiện đại
  - ✅ Progress bar tiến độ thu tiền
  - ✅ Chi tiết 4 loại hóa đơn
  - ✅ Trạng thái thanh toán thành viên
  - ✅ Responsive & animations
  
  ### Screenshots
  (Đính kèm ảnh màn hình)
  
  ### Author
  Huỳnh Gia Bảo (@huynhbao1909)
  ```

### 2. Assign Reviewer
- Tag Scrum Master hoặc team lead
- Đợi review và approve

### 3. KHÔNG Merge Vào Main
- ⛔ Chỉ merge vào `develop`
- ⛔ PO sẽ merge từ `develop` → `main`

---

## 🔍 Kiểm Tra Commit

Xem commit vừa tạo:
```bash
git log -1 --pretty=full
```

Kết quả mong đợi:
```
Author: huynhbao1909 <huynhgiabaogold09@gmail.com>
Commit: [tên bạn thientiy1811] <email của bạn>

feat: tạo giao diện dashboard tài chính RM-10
...
```

---

## 📦 Files Đã Tạo/Sửa

```
✅ client/src/financial.dashboard.jsx    (MỚI - tên đúng chuẩn)
✅ client/src/app.jsx                     (SỬA - import file mới)
✅ client/package.json                    (SỬA - thêm MUI dependencies)
✅ RM10-README.md                         (MỚI - documentation)
✅ QUICKSTART-RM10.md                     (MỚI - quick guide)
❌ client/src/FinancialDashboard.jsx      (XÓA - tên không đúng chuẩn)
```

---

## ⚠️ Lưu Ý

1. **Tên file**: Phải chữ thường + dấu chấm (financial.dashboard.jsx ✅, FinancialDashboard.jsx ❌)
2. **Branch name**: `feature/rm-10-financial-dashboard` (đúng format)
3. **Commit prefix**: `feat:` cho tính năng mới, `fix:` cho sửa lỗi
4. **Author**: Phải dùng `--author` để commit dưới tên Huỳnh Gia Bảo
5. **Pull Request**: Chỉ merge vào `develop`, KHÔNG merge trực tiếp vào `main`

---

## 🎯 Checklist Cuối Cùng

- [ ] File tên đúng chuẩn (chữ thường + dấu chấm)
- [ ] Branch tên đúng format `feature/rm-10-financial-dashboard`
- [ ] Commit message có prefix `feat:`
- [ ] Author là Huỳnh Gia Bảo
- [ ] Push lên remote thành công
- [ ] Tạo Pull Request vào `develop`
- [ ] Đính kèm screenshots
- [ ] Assign reviewer

---

**Made with ❤️ for Roommate Manager - Task RM-10**
**Author: Huỳnh Gia Bảo (@huynhbao1909)**
