import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as ChevronLeft, r as ChevronRight, t as X } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DHnVe2vz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var gift = {
	intro: {
		headline: "Có một món quà nhỏ dành riêng cho cậu",
		hint: "Chạm vào hộp quà để mở nhé ♡"
	},
	story: {
		kicker: "Một lá thư được gói lại",
		title: "Dành cho cậu",
		lede: "Mở chậm thôi. Phía dưới là thư, vài khung ảnh, một dòng thời gian, và một lời nhắn mình giấu ở cuối."
	},
	letter: {
		greeting: "Cậu ơi,",
		paragraphs: [
			"Mình gói món quà này để cậu mở một mình, như nhận một điều chỉ dành cho cậu — không ồn ào, không cần trả lời ngay.",
			"Cảm ơn cậu đã khiến những ngày bình thường trở nên dịu hơn. Mình không cần một dịp thật lớn mới nhớ đến cậu.",
			"Nếu cậu đang mỉm cười lúc này, món quà đã tới đúng chỗ. Phía dưới còn vài khung ảnh, một dòng thời gian, và một lời nhắn mình giấu ở cuối."
		],
		signoff: "Người viết những dòng này"
	},
	album: {
		label: "Album",
		title: "Những khung ảnh",
		note: "Chạm vào ảnh để xem lớn hơn. Đây là ảnh minh họa — hãy thay bằng ảnh của hai người.",
		photos: [
			{
				src: "/memories/tea.jpg",
				alt: "Hai tách trà và một bông hồng trên khăn lanh",
				caption: "Hai tách trà — ảnh minh họa"
			},
			{
				src: "/memories/pier.jpg",
				alt: "Lối gỗ bên mặt nước lúc chiều, hai đôi giày đặt cạnh nhau",
				caption: "Cuối một lối đi — ảnh minh họa"
			},
			{
				src: "/memories/envelope.jpg",
				alt: "Phong thư màu kem và những đóa hồng khô",
				caption: "Phong thư chưa viết — ảnh minh họa"
			},
			{
				src: "/memories/rain.jpg",
				alt: "Bàn nhỏ bên cửa sổ đêm mưa, một ngọn đèn ấm",
				caption: "Đêm mưa bên cửa sổ — ảnh minh họa"
			}
		]
	},
	timeline: {
		label: "Thời gian",
		title: "Những mốc muốn giữ",
		moments: [
			{
				when: "Thuở ban đầu",
				title: "Khoảnh khắc đầu tiên",
				body: "Viết lại lần đầu hai người gặp nhau, hoặc lần đầu cậu làm mình chú ý."
			},
			{
				when: "Một ngày dịu",
				title: "Điều mình hay nhớ",
				body: "Một buổi đi bộ, một tin nhắn khuya, hay một câu nói rất nhỏ."
			},
			{
				when: "Gần đây",
				title: "Điều mình muốn giữ",
				body: "Một kỷ niệm còn ấm. Thay dòng này bằng chính lời của bạn."
			},
			{
				when: "Hôm nay",
				title: "Ngày mở hộp quà",
				body: "Có thể ghi lại cảm giác của chính ngày cậu đọc những dòng này."
			}
		]
	},
	secret: {
		button: "Mở lời nhắn bí mật",
		title: "Lời muốn nói",
		message: "Mình thích cậu. Không chỉ trong những ngày đẹp, mà cả những lúc chẳng có gì đặc biệt — chỉ cần được nghĩ về cậu là đủ. Nếu cậu muốn, mình muốn tiếp tục đi bên cậu, chậm rãi và thật lòng.",
		close: "Gấp lời nhắn lại"
	},
	fold: "Gấp lại hộp quà",
	editNote: "Bản mẫu. Trước khi gửi, hãy đổi thư, lời nhắn, các mốc thời gian và ảnh trong phần nội dung của trang."
};
/** A short music-box figure. Only call from a user gesture. */
function playChime() {
	const Ctx = window.AudioContext ?? window.webkitAudioContext;
	if (!Ctx) return;
	const ctx = new Ctx();
	const master = ctx.createGain();
	master.gain.value = .9;
	master.connect(ctx.destination);
	const notes = [
		523.25,
		659.25,
		783.99,
		1046.5,
		783.99
	];
	const start = ctx.currentTime + .02;
	notes.forEach((freq, index) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.value = freq;
		const t = start + index * .16;
		gain.gain.setValueAtTime(1e-4, t);
		gain.gain.exponentialRampToValueAtTime(.05, t + .03);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + 1.35);
		osc.connect(gain);
		gain.connect(master);
		osc.start(t);
		osc.stop(t + 1.4);
	});
	window.setTimeout(() => {
		ctx.close();
	}, 2800);
}
var PETALS = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
];
function Atmosphere() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "atmosphere",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dust" }), PETALS.map((petal) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `petal petal-${petal}` }, petal))]
	});
}
var HEARTS = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11
];
function GiftBox({ opening }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: opening ? "present is-opening" : "present",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "present-shadow" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "present-glow" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "scene3d",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cube",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "face front",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "band band-v" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "face right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "band band-v" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "face left" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "face back",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "band band-v" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "face inside" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lid",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "band band-v" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "band band-h" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "bow",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "loop loop-l" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "loop loop-r" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "knot" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tail tail-l" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tail tail-r" })
									]
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hearts",
				children: HEARTS.map((heart) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `float-heart heart-${heart}` }, heart))
			})
		]
	});
}
function OpenedGift({ shown, onFold }) {
	const [photo, setPhoto] = (0, import_react.useState)(null);
	const active = photo === null ? null : gift.album.photos[photo];
	function step(dir) {
		setPhoto((current) => {
			if (current === null) return current;
			const next = current + dir;
			if (next < 0 || next >= gift.album.photos.length) return current;
			return next;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: shown ? "story is-shown" : "story",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "story-hero stagger",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "section-label",
						children: gift.story.kicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "story-title",
						children: gift.story.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "lede",
						children: gift.story.lede
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "sheet stagger",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "greeting",
						children: gift.letter.greeting
					}),
					gift.letter.paragraphs.map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "letter-p",
						children: paragraph
					}, paragraph)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "signoff",
						children: gift.letter.signoff
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "block stagger",
				"aria-labelledby": "album-title",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "section-label",
						children: gift.album.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "album-title",
						className: "block-title",
						children: gift.album.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "note",
						children: gift.album.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "album",
						children: gift.album.photos.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "photo-btn",
							onClick: () => setPhoto(index),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: "photo-frame",
								src: item.src,
								alt: item.alt,
								width: 900,
								height: 1200,
								loading: "lazy",
								decoding: "async"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "caption",
								children: item.caption
							})]
						}) }, item.src))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "block stagger",
				"aria-labelledby": "timeline-title",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "section-label",
						children: gift.timeline.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "timeline-title",
						className: "block-title",
						children: gift.timeline.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "timeline",
						children: gift.timeline.moments.map((moment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "moment",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "when",
									children: moment.when
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "moment-title",
									children: moment.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "moment-body",
									children: moment.body
								})
							]
						}, moment.title))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "block secret-block stagger",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					className: "text-button",
					children: gift.secret.button
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "dialog-overlay" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "dialog-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "section-label",
							children: "Giấu trong hộp"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "block-title",
							children: gift.secret.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "secret-copy",
							children: gift.secret.message
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
							className: "text-button text-button-quiet",
							children: gift.secret.close
						})
					]
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "story-foot stagger",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: gift.editNote }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-button text-button-quiet",
					onClick: onFold,
					children: gift.fold
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: photo !== null,
				onOpenChange: (open) => !open && setPhoto(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "dialog-overlay" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "dialog-card photo-dialog",
					children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "sr-only",
							children: active.caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "sr-only",
							children: active.alt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: "lightbox-img",
							src: active.src,
							alt: active.alt,
							width: 900,
							height: 1200
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "caption lightbox-caption",
							children: active.caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lightbox-nav",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "icon-button",
									onClick: () => step(-1),
									disabled: photo === 0,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { "aria-hidden": "true" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Ảnh trước"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
									className: "icon-button",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { "aria-hidden": "true" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Đóng ảnh"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "icon-button",
									onClick: () => step(1),
									disabled: photo === gift.album.photos.length - 1,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { "aria-hidden": "true" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Ảnh sau"
									})]
								})
							]
						})
					] }) : null
				})] })
			})
		]
	});
}
var OPEN_MS = 2600;
var OPEN_MS_REDUCED = 420;
function GiftExperience() {
	const [phase, setPhase] = (0, import_react.useState)("sealed");
	const lock = (0, import_react.useRef)(false);
	const timer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		return () => {
			if (timer.current !== null) window.clearTimeout(timer.current);
		};
	}, []);
	function openGift() {
		if (lock.current) return;
		lock.current = true;
		setPhase("opening");
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (!reduce) playChime();
		timer.current = window.setTimeout(() => {
			setPhase("open");
		}, reduce ? OPEN_MS_REDUCED : OPEN_MS);
	}
	function fold() {
		if (timer.current !== null) window.clearTimeout(timer.current);
		lock.current = false;
		setPhase("sealed");
	}
	function onKeyDown(event) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openGift();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stage",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Atmosphere, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: phase === "open" ? "Hộp quà đã mở." : ""
			}),
			phase !== "sealed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenedGift, {
				shown: phase === "open",
				onFold: fold
			}) : null,
			phase !== "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: phase === "opening" ? "veil is-opening" : "veil",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "veil-copy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "veil-title",
							children: gift.intro.headline
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "gift-hit",
						role: "button",
						tabIndex: phase === "sealed" ? 0 : -1,
						"aria-disabled": phase !== "sealed",
						"aria-label": "Mở hộp quà",
						onClick: openGift,
						onKeyDown,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GiftBox, { opening: phase === "opening" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: gift.intro.hint
					})
				]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GiftExperience, {});
}
//#endregion
export { Home as component };
