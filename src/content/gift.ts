
/**
 * Nội dung món quà — sửa file này trước khi gửi link.
 *
 * Ảnh: thay file trong `public/memories/` (giữ tên) hoặc đổi `src`
 * thành đường dẫn mới, ví dụ "/memories/anh-cua-minh.jpg".
 * Ảnh bó hoa nằm riêng trong `bouquetPhotos`; ảnh thư/album nằm ở `gift.album.photos`.
 * Nên dùng ảnh khoảng 900px cạnh dài để trang mở nhanh trên điện thoại.
 *
 * Chỉ giữ những ngày tháng và kỷ niệm có thật.
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

// Cấu hình ảnh riêng cho bó hoa; không dùng chung danh sách ảnh trong thư.
export const bouquetPhotos: MemoryPhoto[] = [
  {
    src: "/memories/1.jpg",
    alt: "Ảnh kỷ niệm trên bông hoa thứ nhất",
    caption: "Bí mật",
  },
  {
    src: "/memories/2.jpg",
    alt: "Ảnh kỷ niệm trên bông hoa thứ hai",
    caption: "Bí mật",
  },
  {
    src: "/memories/3.jpg",
    alt: "Ảnh kỷ niệm trên bông hoa thứ ba",
    caption: "Bí mật",
  },
  {
    src: "/memories/4.jpg",
    alt: "Ảnh kỷ niệm trên bông hoa thứ tư",
    caption: "Bí mật",
  },
  {
    src: "/memories/5.jpg",
    alt: "Ảnh kỷ niệm trên bông hoa thứ năm",
    caption: "Bí mật",
  },
];

export const gift = {
  intro: {
    headline: "Một món quà nhỏ dành riêng cho chị",
    hint: "Chạm vào hộp quà để mở nhé ♡",
  },

  story: {
    kicker: "Từ một lần gặp gỡ",
    title: "Gửi chị, người đặc biệt của em",
    lede:
      "Em đã gom một vài kỷ niệm nhỏ vào đây. Có những điều em muốn giữ lại, có những khoảnh khắc em vẫn nhớ, và có một điều em muốn dành riêng cho chị ở cuối món quà này.",
  },

  letter: {
    greeting: "Cô gái của những ngày dịu dàng,",

    paragraphs: [
      "Em cũng không biết nên bắt đầu từ đâu nữa. Có lẽ là từ ngày 06/09, khi hai đứa gặp nhau ở sân cầu lông. Khi ấy, em đâu nghĩ rằng một người mới quen lại có thể khiến em mong chờ những lần gặp tiếp theo đến vậy.",

      "Rồi những buổi đánh cầu, một ngày quanh Hồ Tây, hôm trời mưa, buổi Music Box, những lần ngồi cà phê và cả những cuộc gọi kéo dài đến khuya. Từng chuyện đều rất bình thường, nhưng khi nhìn lại, em mới nhận ra mình đã có nhiều kỷ niệm đáng nhớ đến thế.",

      "Em thích những lúc được nghe chị kể chuyện, những lần chị cười và cả cảm giác vui vui khi biết hôm ấy có thể gặp chị. Đôi khi chẳng cần làm gì đặc biệt, chỉ cần được trò chuyện cùng chị thôi cũng đủ khiến một ngày của em trở nên dễ chịu hơn.",

      "Vì vậy, em muốn gom những khoảnh khắc ấy vào một món quà nhỏ. Không phải vì chúng ta đã có điều gì lớn lao, mà bởi với em, những ngày vừa qua thực sự rất đáng quý.",

      "Em biết chuyện tình cảm cần đúng thời điểm và cần sự tự nguyện từ cả hai phía. Em cũng nhớ những điều chị từng chia sẻ, nên em không muốn chị cảm thấy áp lực hay phải đưa ra câu trả lời nào cả.",

      "Em chỉ mong khi nhìn lại những bức ảnh này, chị cũng sẽ mỉm cười và nhớ về những ngày chúng ta đã có cùng nhau. Còn có một điều em vẫn muốn nói với chị, em xin phép giữ lại đến cuối món quà nhé ♡",
    ],

    signoff: "Từ em, người đang thương chị",
  },

  album: {
    label: "Kỷ niệm",
    title: "Những ngày em muốn giữ",
    note:
      "Có những khoảnh khắc lúc xảy ra chẳng có gì đặc biệt. Nhưng khi gom lại, em mới nhận ra mình đã có nhiều điều để nhớ đến thế. Em muốn cất chúng ở đây, như một cách dịu dàng để nhớ về những ngày có chị.",

    photos: [
      {
        src: "/memories/tea.jpg",
        alt: "Một góc quán cà phê yên tĩnh",
        caption: "Những buổi ngồi cà phê cạnh chị",
      },
      {
        src: "/memories/pier.jpg",
        alt: "Khung cảnh Hồ Tây lúc chiều",
        caption: "Một vòng Hồ Tây, một ngày thật dài",
      },
      {
        src: "/memories/rain.jpg",
        alt: "Kỷ niệm một buổi đánh cầu trời mưa",
        caption: "Một ngày mưa mà em vẫn nhớ",
      },
      {
        src: "/memories/music.jpg",
        alt: "Kỷ niệm một buổi Music Box",
        caption: "Giọng hát khiến em bất ngờ",
      },
      {
        src: "/memories/cham.jpg",
        alt: "Kỷ niệm một khoảnh khắc gần gũi",
        caption: "Một chút gần gũi, một chút bối rối",
      },
      {
        src: "/memories/call.jpg",
        alt: "Một bức ảnh lưu giữ kỷ niệm của hai người",
        caption: "Những bức ảnh em muốn giữ",
      },
    ],
  },

  timeline: {
    label: "Hành trình",
    title: "Từ ngày ấy đến hôm nay",

    moments: [
      {
        when: "06/09",
        title: "Lần đầu gặp chị",
        body:
          "Một lần gặp nhau ở sân cầu lông, rồi hai đứa kết bạn Zalo. Khi ấy, em chưa biết rằng người bạn mới quen này sẽ dần trở thành người em mong chờ được gặp.",
      },
      {
        when: "13/09",
        title: "Một ngày quanh Hồ Tây",
        body:
          "Từ Jollibee, quán cà phê đến những đoạn đường quanh Hồ Tây. Một ngày dài hơn dự định, nhưng khi nhớ lại, em chỉ thấy thời gian trôi nhanh quá.",
      },
      {
        when: "16–18/09",
        title: "Những kỷ niệm ngày mưa",
        body:
          "Một ngày đi qua mưa để gặp chị, cùng ăn cháo sau buổi đánh cầu. Rồi một buổi Music Box khiến em bất ngờ vì giọng hát của chị. Những chuyện nhỏ thôi, nhưng em vẫn nhớ.",
      },
      {
        when: "26/09",
        title: "Một chút gần gũi",
        body:
          "Có những khoảnh khắc khiến em nhận ra mình muốn được gần chị hơn một chút. Em vẫn mong mọi điều diễn ra tự nhiên, để cả hai đều cảm thấy thoải mái.",
      },
      {
        when: "07–18/10",
        title: "Những cuộc gọi kéo dài",
        body:
          "Từ những buổi đánh cầu, những câu chuyện sau giờ chơi đến các cuộc gọi buổi tối. Em nhận ra mình ngày càng mong chờ những lúc được trò chuyện cùng chị.",
      },
      {
        when: "19/10",
        title: "Điều em muốn nói với chị",
        body:
          "Em đã dành thời gian chuẩn bị món quà nhỏ này, chỉ mong có thể nói ra một điều mà em đã giữ trong lòng. Em không biết câu chuyện sẽ tiếp tục thế nào, nhưng hôm nay em muốn thành thật với chị và với chính mình.",
      },
    ],
  },

  secret: {
    button: "Có một điều em muốn nói",
    title: "Em thích chị",

    message:
      "Em thích chị. Em muốn được quan tâm chị nhiều hơn, hiểu chị nhiều hơn và nghiêm túc tìm hiểu em, không chỉ dừng lại ở những buổi đi chơi hay những cuộc trò chuyện như hiện tại. Nếu chị cũng muốn, mình cho nhau một cơ hội nhé? Mình không cần vội vàng, cứ chậm rãi tìm hiểu nhau thôi. Còn nếu chị chưa sẵn sàng hoặc không có cùng cảm xúc, em vẫn tôn trọng điều đó. Chị không cần phải trả lời chỉ để em vui đâu. Em chỉ mong chị biết rằng những điều em nói hôm nay đều là thật lòng.",

    close: "Gấp lời nhắn lại",
  },

  fold: "Gấp lại hộp quà",

  editNote:
    "Em đã dành một chút thời gian để làm món quà này cho chị. Những bức ảnh và kỷ niệm ở đây là những điều em muốn giữ lại từ những ngày vừa qua. Nếu sau này chị cũng muốn, em hy vọng chúng ta sẽ còn cùng nhau viết tiếp câu chuyện này.",
};
