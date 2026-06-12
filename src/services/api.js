// src/services/api.js

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const uploadAndProcessImage = async (imageFile, parameters) => {
  // Giả lập thời gian model đang chạy pipeline (2 giây)
  await delay(2000);

  // Trả về Mock Data đúng chuẩn ProcessResult trong file đặc tả
  return {
    result_id: "RUN-20260612-0001",
    user_id: "U001",
    filename: imageFile?.name || "sample_noisy_image.png",
    status: "success",
    created_at: new Date().toISOString(),
    processing_time_ms: 1850,
    image_info: {
      width: 512,
      height: 256,
      file_size: imageFile?.size || 102400,
      format: imageFile?.type || "image/png",
    },
    parameters: parameters,
    statistics: {
      detected_boxes: 3,
      removed_components: 15,
      average_confidence: 0.91,
      low_confidence_count: 0,
      foreground_ratio: 0.2,
      noise_component_count: 10,
    },
    boxes: [
      {
        index: 1,
        x: 12,
        y: 35,
        width: 24,
        height: 40,
        area: 960,
        aspect_ratio: 0.6,
        label: "7",
        confidence: 0.94,
        status: "normal",
      },
      {
        index: 2,
        x: 80,
        y: 31,
        width: 22,
        height: 39,
        area: 858,
        aspect_ratio: 0.56,
        label: "A",
        confidence: 0.88,
        status: "normal",
      },
      {
        index: 3,
        x: 140,
        y: 29,
        width: 25,
        height: 42,
        area: 1050,
        aspect_ratio: 0.59,
        label: "B",
        confidence: 0.91,
        status: "normal",
      },
    ],
    // Dùng ảnh placeholder tạm thời
    output_image_url: "https://via.placeholder.com/512x256/f3f4f6/ef4444?text=Output+Image+With+Red+Boxes",
    llm_comment: "Hệ thống phát hiện 3 ký tự với độ tin cậy trung bình 91%. Ảnh khá sạch, các thông số hiện tại (Otsu, blur 3) hoạt động tốt. Không phát hiện ký tự nào bị dính hoặc đứt nét nghiêm trọng.",
  };
};