/**
 * Nội dung món quà — sửa file này trước khi gửi link.
 *
 * Ảnh: thay file trong `public/memories/` (giữ tên) hoặc đổi `src`
 * thành đường dẫn mới, ví dụ "/memories/anh-cua-minh.jpg".
 * Nên dùng ảnh ngang hoặc dọc nhẹ, khoảng 900px cạnh dài, để trang mở nhanh trên điện thoại.
 *
 * Không điền tên, ngày hay kỷ niệm giả. Các mục bên dưới là bản mẫu.
 */

export type MemoryPhoto = {
  src: string;
  alt: string;
  caption: string;
};

export type MemoryMoment = {
  when: string;
  title: string;
  body: string;
};

export const gift = {
  intro: {
    headline: "Có một món quà nhỏ dành riêng cho cậu",
    hint: "Chạm vào hộp quà để mở nhé ♡",
  },
  story: {
    kicker: "Một lá thư được gói lại",
    title: "Dành cho cậu",
    lede: "Mở chậm thôi. Phía dưới là thư, vài khung ảnh, một dòng thời gian, và một lời nhắn mình giấu ở cuối.",
  },
  letter: {
    greeting: "Cậu ơi,",
    paragraphs: [
      "Mình gói món quà này để cậu mở một mình, như nhận một điều chỉ dành cho cậu — không ồn ào, không cần trả lời ngay.",
      "Cảm ơn cậu đã khiến những ngày bình thường trở nên dịu hơn. Mình không cần một dịp thật lớn mới nhớ đến cậu.",
      "Nếu cậu đang mỉm cười lúc này, món quà đã tới đúng chỗ. Phía dưới còn vài khung ảnh, một dòng thời gian, và một lời nhắn mình giấu ở cuối.",
    ],
    signoff: "Người viết những dòng này",
  },
  album: {
    label: "Album",
    title: "Những khung ảnh",
    note: "Chạm vào ảnh để xem lớn hơn. Đây là ảnh minh họa — hãy thay bằng ảnh của hai người.",
    photos: [
      {
        src: "/memories/tea.jpg",
        alt: "Hai tách trà và một bông hồng trên khăn lanh",
        caption: "Hai tách trà — ảnh minh họa",
      },
      {
        src: "/memories/pier.jpg",
        alt: "Lối gỗ bên mặt nước lúc chiều, hai đôi giày đặt cạnh nhau",
        caption: "Cuối một lối đi — ảnh minh họa",
      },
      {
        src: "/memories/envelope.jpg",
        alt: "Phong thư màu kem và những đóa hồng khô",
        caption: "Phong thư chưa viết — ảnh minh họa",
      },
      {
        src: "/memories/rain.jpg",
        alt: "Bàn nhỏ bên cửa sổ đêm mưa, một ngọn đèn ấm",
        caption: "Đêm mưa bên cửa sổ — ảnh minh họa",
      },
    ] satisfies MemoryPhoto[],
  },
  timeline: {
    label: "Thời gian",
    title: "Những mốc muốn giữ",
    moments: [
      {
        when: "Thuở ban đầu",
        title: "Khoảnh khắc đầu tiên",
        body: "Viết lại lần đầu hai người gặp nhau, hoặc lần đầu cậu làm mình chú ý.",
      },
      {
        when: "Một ngày dịu",
        title: "Điều mình hay nhớ",
        body: "Một buổi đi bộ, một tin nhắn khuya, hay một câu nói rất nhỏ.",
      },
      {
        when: "Gần đây",
        title: "Điều mình muốn giữ",
        body: "Một kỷ niệm còn ấm. Thay dòng này bằng chính lời của bạn.",
      },
      {
        when: "Hôm nay",
        title: "Ngày mở hộp quà",
        body: "Có thể ghi lại cảm giác của chính ngày cậu đọc những dòng này.",
      },
    ] satisfies MemoryMoment[],
  },
  secret: {
    button: "Mở lời nhắn bí mật",
    title: "Lời muốn nói",
    message:
      "Mình thích cậu. Không chỉ trong những ngày đẹp, mà cả những lúc chẳng có gì đặc biệt — chỉ cần được nghĩ về cậu là đủ. Nếu cậu muốn, mình muốn tiếp tục đi bên cậu, chậm rãi và thật lòng.",
    close: "Gấp lời nhắn lại",
  },
  fold: "Gấp lại hộp quà",
  editNote:
    "Bản mẫu. Trước khi gửi, hãy đổi thư, lời nhắn, các mốc thời gian và ảnh trong phần nội dung của trang.",
};
