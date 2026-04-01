# Plan: Chức năng Quản lý Thành viên (trừ Trưởng phòng)

## Tổng quan

Xây dựng hệ thống quản lý thành viên phòng trọ cho người dùng thường (member), không bao gồm các chức năng dành riêng cho trưởng phòng (owner). Chức năng này cho phép thành viên xem danh sách thành viên, cập nhật thông tin cá nhân trong phòng, và rời khỏi phòng.

## Phạm vi công việc

### Các chức năng đã có (sẽ sử dụng lại):
- ✅ Tham gia phòng bằng mã mời (POST `/api/members/join`)
- ✅ Lấy danh sách phòng của user (GET `/api/members/my-rooms`)
- ✅ Lấy danh sách thành viên trong phòng (GET `/api/members/:roomId/members`)
- ✅ Rời khỏi phòng (PUT `/api/members/:roomId/leave`)
- ✅ Cập nhật biệt danh (PUT `/api/members/:roomId/nickname`)

### Các chức năng cần bổ sung:
1. **Backend API:**
   - Lấy thông tin chi tiết 1 thành viên trong phòng
   - Cập nhật trạng thái hoạt động của thành viên (active/inactive)
   - Middleware kiểm tra quyền thành viên (không phải owner)
   - Validation nâng cao cho các API

2. **Frontend UI:**
   - Trang danh sách thành viên phòng (member.list.jsx)
   - Component chi tiết thông tin thành viên (member.detail.jsx)
   - Form cập nhật biệt danh
   - Nút rời khỏi phòng với xác nhận
   - Hiển thị trạng thái thành viên (active/inactive/left)

3. **Testing & Validation:**
   - Test các API endpoint
   - Validate dữ liệu input
   - Xử lý error cases

## Coding Standards

### Quy tắc đặt tên:
- **File**: chữ thường, dấu chấm phân tách (vd: `member.list.jsx`, `member.service.js`)
- **Biến/Hàm**: camelCase (vd: `getMemberInfo`, `isActive`)
- **Hằng số**: IN HOA (vd: `MEMBER_STATUS`, `MAX_MEMBERS`)
- **Bảng DB**: snake_case (vd: `room_members`, `bill_details`)

### Git Flow:
- **Nhánh chính**: `main`, `develop`
- **Nhánh feature**: `feature/ten-chuc-nang` (vd: `feature/member-management`)
- **Nhánh bug**: `bug/ten-loi`
- **Commit format**: 
  - `feat: mô tả tính năng` (vd: `feat: thêm API lấy thông tin thành viên`)
  - `fix: mô tả lỗi` (vd: `fix: sửa lỗi validation nickname`)
- **Pull request**: Bắt buộc, không commit trực tiếp vào `main` (trừ PO)

## Danh sách Tasks

### 1. Backend Development

#### Task 1.1: Tạo middleware kiểm tra quyền thành viên
- File: `server/src/middlewares/member.auth.middleware.js`
- Chức năng: Kiểm tra user có phải thành viên của phòng không (role = 'member' hoặc 'owner', status = 'active')
- Dependency: Không

#### Task 1.2: Thêm API lấy thông tin chi tiết thành viên
- Endpoint: GET `/api/members/:roomId/members/:memberId`
- File controller: `server/src/controllers/member.controller.js`
- File route: `server/src/routes/member.route.js`
- Response: Thông tin thành viên, role, nickname, joinedAt, status
- Dependency: Task 1.1

#### Task 1.3: Thêm API cập nhật trạng thái thành viên
- Endpoint: PATCH `/api/members/:roomId/status`
- File controller: `server/src/controllers/member.controller.js`
- File route: `server/src/routes/member.route.js`
- Body: `{ status: 'active' | 'inactive' }`
- Chỉ cho phép member tự cập nhật trạng thái của mình
- Dependency: Task 1.1

#### Task 1.4: Cải thiện validation cho API hiện có
- File: `server/src/controllers/member.controller.js`
- Validate: nickname (max 50 ký tự, không chứa ký tự đặc biệt)
- Validate: roomId (valid ObjectId)
- Validate: inviteCode (6 ký tự chữ và số)
- Dependency: Không

#### Task 1.5: Thêm service xử lý logic thành viên
- File: `server/src/services/member.service.js`
- Functions: 
  - `checkMemberPermission(userId, roomId)` - kiểm tra quyền
  - `validateNickname(nickname)` - validate biệt danh
  - `getMemberStats(roomId)` - thống kê thành viên
- Dependency: Không

### 2. Frontend Development

#### Task 2.1: Tạo component danh sách thành viên
- File: `client/src/components/member.list.jsx`
- Props: `roomId`, `members[]`, `onMemberClick`
- Hiển thị: avatar, tên, nickname, role badge, trạng thái
- Dependency: Không

#### Task 2.2: Tạo component chi tiết thành viên
- File: `client/src/components/member.detail.jsx`
- Props: `member`, `onUpdate`, `onClose`
- Hiển thị: thông tin đầy đủ, ngày tham gia, số hóa đơn đã thanh toán
- Dependency: Task 2.1

#### Task 2.3: Tạo form cập nhật biệt danh
- File: `client/src/components/member.nickname.form.jsx`
- Props: `currentNickname`, `onSave`, `onCancel`
- Validation: max 50 ký tự, không chứa ký tự đặc biệt
- Dependency: Không

#### Task 2.4: Tạo trang quản lý thành viên
- File: `client/src/member.management.jsx`
- Tích hợp: MemberList, MemberDetail, NicknameForm
- Features: 
  - Hiển thị danh sách thành viên
  - Click vào thành viên → hiển thị chi tiết
  - Nút "Cập nhật biệt danh"
  - Nút "Rời khỏi phòng" với modal xác nhận
- Dependency: Task 2.1, Task 2.2, Task 2.3

#### Task 2.5: Tạo service API cho frontend
- File: `client/src/services/member.api.js`
- Functions:
  - `getMembers(roomId)` - lấy danh sách thành viên
  - `getMemberDetail(roomId, memberId)` - lấy chi tiết
  - `updateNickname(roomId, nickname)` - cập nhật biệt danh
  - `updateStatus(roomId, status)` - cập nhật trạng thái
  - `leaveRoom(roomId)` - rời phòng
- Dependency: Không

#### Task 2.6: Thêm routing cho trang quản lý thành viên
- File: `client/src/main.jsx` hoặc router config
- Route: `/rooms/:roomId/members`
- Component: MemberManagement
- Dependency: Task 2.4

#### Task 2.7: Tạo CSS module cho components
- Files: 
  - `client/src/styles/member.list.module.css`
  - `client/src/styles/member.detail.module.css`
  - `client/src/styles/member.nickname.form.module.css`
- Responsive design, animations, hover effects
- Dependency: Task 2.1, Task 2.2, Task 2.3

### 3. Integration & Testing

#### Task 3.1: Tích hợp API backend với frontend
- Kết nối các component với API services
- Xử lý loading states
- Xử lý error messages
- Dependency: Task 1.2, Task 1.3, Task 2.4, Task 2.5

#### Task 3.2: Test API endpoints với Postman/Thunder Client
- Test cases:
  - Lấy danh sách thành viên (auth required)
  - Cập nhật nickname (valid/invalid)
  - Cập nhật trạng thái (member only)
  - Rời khỏi phòng (không phải owner)
- Dependency: Task 1.2, Task 1.3, Task 1.4

#### Task 3.3: Test UI/UX flow
- User journey: Xem danh sách → Chi tiết → Cập nhật nickname → Rời phòng
- Kiểm tra responsive trên mobile/tablet/desktop
- Kiểm tra accessibility (keyboard navigation, screen reader)
- Dependency: Task 3.1

#### Task 3.4: Code review và refactoring
- Review code theo coding standards
- Refactor duplicate code
- Optimize performance
- Add comments cho logic phức tạp
- Dependency: Task 3.2, Task 3.3

## Thứ tự thực hiện (Dependencies)

```
Giai đoạn 1 - Backend Foundation:
  Task 1.1 (middleware) → Task 1.2, 1.3 (APIs)
  Task 1.4 (validation) - parallel
  Task 1.5 (service) - parallel

Giai đoạn 2 - Frontend Components:
  Task 2.1, 2.2, 2.3, 2.5 (components & service) - parallel
  → Task 2.4 (page integration)
  → Task 2.6 (routing)
  Task 2.7 (styling) - parallel

Giai đoạn 3 - Integration & Testing:
  Task 3.1 (API integration) → Task 3.2 (API testing)
  → Task 3.3 (UI testing)
  → Task 3.4 (review & refactor)
```

## Ghi chú kỹ thuật

### Security:
- Tất cả API đều yêu cầu authentication (JWT token)
- Member chỉ được cập nhật thông tin của chính mình
- Không cho phép member xóa/kick thành viên khác (chức năng của owner)
- Owner không thể rời khỏi phòng (phải transfer ownership trước)

### Error Handling:
- 400: Validation error (nickname invalid, status invalid)
- 401: Unauthorized (token missing/invalid)
- 403: Forbidden (không phải member của phòng)
- 404: Not found (room/member không tồn tại)
- 500: Server error

### Performance:
- Pagination cho danh sách thành viên nếu >50 members
- Cache danh sách thành viên ở frontend (5 phút)
- Debounce cho form input (nickname)

### Data Validation:
- Nickname: 1-50 ký tự, chỉ chữ cái, số, khoảng trắng, dấu gạch ngang
- Status: chỉ 'active' hoặc 'inactive'
- RoomId: valid MongoDB ObjectId

## Branch Strategy

1. Checkout từ `develop`: `git checkout develop && git pull`
2. Tạo branch feature: `git checkout -b feature/member-management`
3. Commit theo format: 
   - `git commit -m "feat: thêm middleware kiểm tra quyền thành viên"`
   - `git commit -m "feat: thêm API lấy thông tin thành viên"`
4. Push và tạo PR: `git push origin feature/member-management`
5. Request review từ team
6. Merge vào `develop` sau khi approve
