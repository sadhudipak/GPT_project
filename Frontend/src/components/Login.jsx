import "./Auth.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            await login(email.trim(), password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="authPage">
            <div className="authBackground">
                <div className="authGlow authGlowOne"></div>
                <div className="authGlow authGlowTwo"></div>
            </div>

            <section className="authCard">
                <div className="authLogo">
                    <span>✦</span>
                </div>

                <div className="authHeader">
                    <h1>Welcome back</h1>
                    <p>
                        Sign in to continue your conversations
                    </p>
                </div>

                {error && (
                    <div className="authError">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form
                    className="authForm"
                    onSubmit={handleSubmit}
                >
                    <div className="authField">
                        <label htmlFor="email">
                            Email address
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-envelope"></i>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="authField">
                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-lock"></i>

                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                <i
                                    className={`fa-solid ${
                                        showPassword
                                            ? "fa-eye-slash"
                                            : "fa-eye"
                                    }`}
                                ></i>
                            </button>
                        </div>
                    </div>

                    <button
                        className="authSubmit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign in
                                <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="authDivider">
                    <span>or</span>
                </div>

                <p className="authSwitch">
                    Don't have an account?
                    <Link to="/signup">
                        Create an account
                    </Link>
                </p>

                <p className="authFooter">
                    By continuing, you agree to use this service responsibly.
                </p>
            </section>
        </main>
    );
}

export default Login;