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
    headline: "Có một món quà nhỏ dành riêng cho Huệ",
    hint: "Chạm vào hộp quà để mở nhé ♡",
  },

  story: {
    kicker: "Từ một lần gặp gỡ",
    title: "Gửi em, Huệ",
    lede:
      "Anh đã gom một vài kỷ niệm nhỏ vào đây. Có những điều anh vẫn nhớ, có những điều anh chưa từng nói, và có một điều anh muốn em biết khi đọc đến cuối.",
  },

  letter: {
    greeting: "Huệ ơi,",

    paragraphs: [
      "Anh cũng không biết phải bắt đầu từ đâu nữa. Có lẽ là từ ngày 06/09, khi hai đứa gặp nhau ở sân cầu lông. Lúc ấy anh đâu nghĩ rằng một người mới quen lại có thể dần trở thành người khiến anh mong chờ những lần gặp tiếp theo đến vậy.",

      "Sau đó là những buổi đánh cầu, buổi đi chơi quanh Hồ Tây, hôm trời mưa, buổi Music Box, những lần ngồi cà phê và cả những cuộc gọi kéo dài đến khuya. Mỗi chuyện khi xảy ra đều rất bình thường, nhưng chẳng hiểu từ lúc nào anh lại nhớ chúng lâu hơn mình nghĩ.",

      "Anh bắt đầu nhớ những điều nhỏ xíu về em, nhớ những câu chuyện em kể, nhớ cả cảm giác vui vui khi biết hôm nay có thể gặp em. Có những ngày chẳng có gì đặc biệt, nhưng chỉ cần được nói chuyện với em một lúc thôi cũng đủ khiến ngày hôm ấy dễ chịu hơn.",

      "Anh làm trang quà này không phải vì muốn biến những kỷ niệm ấy thành điều gì quá lớn lao. Anh chỉ muốn giữ lại một chút những ngày vừa qua, theo cách riêng của anh, để em biết rằng sự xuất hiện của em đã khiến cuộc sống thường ngày của anh có thêm nhiều điều đáng mong chờ.",

      "Có một điều anh đã nghĩ khá lâu mới quyết định nói ra. Anh thích em, Huệ ạ. Không chỉ vì những buổi đi chơi vui vẻ, mà vì càng tiếp xúc, anh càng muốn hiểu em nhiều hơn, quan tâm em nhiều hơn và được cùng em tạo thêm những kỷ niệm mới.",

      "Anh biết chuyện tình cảm không phải cứ có một người chân thành thì mọi thứ sẽ tự nhiên trở nên đúng lúc. Anh cũng nhớ em từng nói rằng em sợ làm tổn thương người khác khi yêu. Vì thế, anh không muốn em cảm thấy phải trả lời anh theo cách nào đó chỉ vì anh đã chuẩn bị món quà này.",

      "Anh chỉ muốn thành thật với cảm xúc của mình. Nếu em cũng muốn, anh mong hai đứa có thể cho nhau cơ hội tìm hiểu nghiêm túc hơn, chậm rãi thôi, để cả hai đều cảm thấy thoải mái và chân thành.",
    ],

    signoff: "Người đang mong chờ những ngày có em",
  },

  album: {
    label: "Kỷ niệm",
    title: "Những điều anh muốn giữ",
    note:
      "Mỗi bức ảnh có thể không kể hết một câu chuyện, nhưng anh vẫn muốn giữ lại những khoảnh khắc mà sau này nhìn lại, mình sẽ nhớ đã từng có những ngày như thế.",

    photos: [
      {
        src: "/memories/tea.jpg",
        alt: "Một góc quán cà phê yên tĩnh",
        caption: "Những buổi ngồi coffee cạnh nhau",
      },
      {
        src: "/memories/pier.jpg",
        alt: "Khung cảnh Hồ Tây lúc chiều",
        caption: "Một vòng Hồ Tây",
      },
      {
        src: "/memories/rain.jpg",
        alt: "Những gì có thể",
        caption: "Một buổi đánh cầu trời mưa",
      },
      {
        src: "/memories/music.jpg",
        alt: "Một buổi Music Box",
        caption: "Một buổi Music Box",
      },
      {
        src: "/memories/cham.jpg",
        alt: "lần đầu chạm nhẹ",
        caption: "Lần đầu chạm nhẹ tay nhau",
      },

      {
        src: "/memories/call.jpg",
        alt: "Đánh cầu vui vẻ",
        caption: "Tấm ảnh muốn giữ",
      }

    ],
  },

  timeline: {
    label: "Hành trình",
    title: "Từ ngày ấy đến bây giờ",

    moments: [
      {
        when: "06/09",
        title: "Lần đầu gặp em",
        body:
          "Chỉ là một lần gặp nhau ở sân cầu lông, rồi kết bạn Zalo. Khi ấy anh chưa biết rằng mình sẽ có nhiều kỷ niệm với em đến vậy.",
      },
      {
        when: "13/09",
        title: "Một ngày quanh Hồ Tây",
        body:
          "Từ Jollibee, quán cà phê đến những đoạn đường quanh Hồ Tây. Một ngày dài hơn dự định, nhưng khi nhớ lại, anh chỉ thấy thời gian trôi nhanh quá.",
      },
      {
        when: "16–18/09",
        title: "Mưa và một buổi Music Box",
        body:
          "Một ngày đi qua mưa để gặp em, cùng ăn cháo sau buổi đánh cầu. Rồi một buổi Music Box khiến anh bất ngờ vì giọng hát của em. Những chuyện nhỏ mà anh vẫn nhớ.",
      },
      {
        when: "26/09",
        title: "Một chút gần gũi",
        body:
          "Có những khoảnh khắc khiến anh nhận ra mình muốn được gần em hơn một chút. Anh vẫn muốn mọi điều diễn ra tự nhiên, để cả hai đều thấy thoải mái.",
      },
      {
        when: "07–10/10",
        title: "Những cuộc gọi kéo dài",
        body:
          "Từ những buổi đánh cầu, những câu chuyện sau giờ chơi đến các cuộc gọi buổi tối. Anh nhận ra mình ngày càng mong chờ những lúc được trò chuyện với em.",
      },
      {
        when: "16/10",
        title: "Một điều anh muốn nói",
        body:
          "Anh không biết sau ngày hôm nay, câu chuyện của hai đứa sẽ đi đến đâu. Nhưng anh muốn em biết rằng những ngày vừa qua thật sự có ý nghĩa với anh.",
      },
    ],
  },

  secret: {
    button: "Có một điều anh muốn nói",
    title: "Anh thích em, Huệ ạ",

    message:
      "Anh thích em. Anh muốn được quan tâm em nhiều hơn, hiểu em nhiều hơn và nghiêm túc tìm hiểu em, không chỉ với tư cách một người em nữa. Nếu em cũng muốn, mình thử cho nhau một cơ hội nhé? Còn nếu em chưa sẵn sàng hoặc không có cùng cảm xúc, anh vẫn tôn trọng điều đó. Em không cần phải trả lời chỉ để anh vui đâu. Anh chỉ mong em biết rằng những điều anh nói hôm nay đều là thật lòng.",

    close: "Gấp lời nhắn lại",
  },

  fold: "Gấp lại hộp quà",

  editNote:
    "Hãy thay ảnh minh họa bằng những bức ảnh thật của hai người trước khi gửi. Kiểm tra lại ngày tháng và các kỷ niệm để tất cả đều đúng với câu chuyện của hai người.",
};