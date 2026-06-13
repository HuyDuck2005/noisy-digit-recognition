src/
├── assets/                 # Chứa hình ảnh mẫu, logo, icon
│
├── components/             # Các thành phần giao diện nhỏ
│   ├── Common/             # Button.jsx, Card.jsx, Input.jsx
│   ├── Layout/             #  Sidebar.jsx, Header.jsx (Khắc phục lỗi import lúc nãy)
│   ├── Upload/             # DragDropZone.jsx (Khu vực kéo thả ảnh)
│   ├── Process/            #  ParameterPanel.jsx (Thanh chỉnh Threshold, Dilation, Min Area...)
│   ├── Result/             # BoundingBoxTable.jsx, ImageTabs.jsx
│   │   └── LLMFeedback.jsx #  Khối hiển thị nhận xét từ AI
│   └── Admin/              #  ConfusionMatrix.jsx, ModelUploadCard.jsx
│
├── layouts/                # Bố cục khung của trang web
│   ├── MainLayout.jsx      # Bố cục có Sidebar + Header (Dùng cho User/Admin)
│   ├── AdminLayout.jsx     # Bố cục riêng cho trang Quản trị (nếu cần khác biệt)
│   └── AuthLayout.jsx      #  Bố cục trống (không có menu) để chứa trang Login/Register
│
├── pages/                  # Các màn hình lớn (Ghép từ các components lại)
│   ├── Auth/               #  Thư mục chứa Login.jsx, Register.jsx
│   ├── Dashboard.jsx       # Dashboard thống kê
│   ├── ImageProcess.jsx    # Màn hình chính xử lý ảnh
│   ├── History.jsx         # Lịch sử xử lý
│   ├── AdminLog.jsx        # Xem log lỗi hệ thống
│   └── ModelManager.jsx    # Trang quản lý, upload và test Model CNN
│
├── services/               # Xử lý logic gọi API Backend
│   └── api.js              # Các hàm fetch/axios
│
├── App.jsx                 # Chứa React Router để cấu hình luồng chuyển trang
├── index.css               # File CSS tổng (bạn đã dán code CSS ở trên vào đây)
└── main.jsx                # Điểm khởi chạy của React