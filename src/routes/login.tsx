import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) throw new Error(result.error.message ?? "Không thể đăng nhập.");
      await navigate({ to: "/" });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể kết nối tài khoản. Hãy thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="secret-account-page">
      <section className="secret-account-card" aria-labelledby="secret-account-title">
        <Link to="/" className="secret-account-back">
          <ArrowLeft aria-hidden="true" />
          Quay lại món quà
        </Link>
        <div className="secret-account-mark" aria-hidden="true">
          <LockKeyhole />
        </div>
        <p className="secret-eyebrow">Không gian riêng tư</p>
        <h1 id="secret-account-title">Tài khoản của bạn</h1>
        <p className="secret-account-intro">
          Đăng nhập cùng một tài khoản trên các thiết bị để xem ảnh và nhật ký đã đồng bộ.
        </p>

        {isPending ? (
          <p className="secret-account-status" role="status">
            Đang kiểm tra phiên đăng nhập…
          </p>
        ) : user ? (
          <div className="secret-account-signed-in">
            <p>
              Đang đăng nhập với {user.primaryEmail ?? user.displayName ?? "tài khoản của bạn"}.
            </p>
            <Link to="/" className="secret-account-submit">
              Tiếp tục
            </Link>
          </div>
        ) : (
          <>
            <div
              className="secret-account-tabs"
              role="tablist"
              aria-label="Chọn thao tác tài khoản"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-in"}
                onClick={() => {
                  setMode("sign-in");
                  setError("");
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-up"}
                onClick={() => {
                  setMode("sign-up");
                  setError("");
                }}
              >
                Tạo tài khoản
              </button>
            </div>
            <form className="secret-account-form" onSubmit={submit}>
              {mode === "sign-up" ? (
                <label>
                  Tên hiển thị
                  <input
                    autoComplete="name"
                    maxLength={80}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              ) : null}
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Mật khẩu
                <span className="secret-account-password">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>
              {error ? (
                <p className="secret-account-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="secret-account-submit" disabled={submitting}>
                {submitting ? "Đang xử lý…" : mode === "sign-up" ? "Tạo tài khoản" : "Đăng nhập"}
              </button>
            </form>
          </>
        )}
        <p className="secret-account-privacy">
          Ảnh và nhật ký riêng tư, chỉ tài khoản của bạn mới có thể truy cập.
        </p>
      </section>
    </main>
  );
}
